"use client";

import { useEffect, useMemo, useState } from "react";

type AuthUser = {
  id?: string;
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

type LoginResponse = {
  message?: string;
  token?: string;
  user?: AuthUser;
};

type ToastType = "success" | "error" | "warning";

type DoorCommandStatusResponse = {
  success?: boolean;
  status?: string;
  message?: string;
  user?: AuthUser;
  command?: {
    id?: string;
    status?: string;
    deviceMessage?: string;
  };
};

type DoorLiveStateResponse = {
  success?: boolean;
  state?: string;
  color?: string;
  isUnlocked?: boolean;
  hardwareOnline?: boolean;
  message?: string;
  device?: {
    deviceId?: string;
    ip?: string;
    state?: string;
    doorClosed?: boolean;
    doorOpen?: boolean;
    lastHeartbeatAt?: string;
  };
  command?: {
    id?: string;
    status?: string;
    action?: string;
    deviceMessage?: string;
  } | null;
};

const TOKEN_KEY = "gym_ravana_door_admin_token";
const USER_KEY = "gym_ravana_door_admin_user";

export default function DoorControlPage() {
  const apiBase = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://gym-ravana-backend.onrender.com"
    ).replace(/\/$/, "");
  }, []);

  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [doorStatus, setDoorStatus] = useState<DoorLiveStateResponse | null>(
    null
  );

  const [lastCommandId, setLastCommandId] = useState("");
  const [lastCommandStatus, setLastCommandStatus] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const isAdmin = user?.role === "admin";

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, ms));

  const isFinalSuccessStatus = (status: string) => {
    return ["unlocked", "completed", "restarting"].includes(status);
  };

  const isFinalFailureStatus = (status: string) => {
    return [
      "busy",
      "failed",
      "expired",
      "rejected_door_open",
      "rejected_unknown_action",
    ].includes(status);
  };

  const showTopMessage = (message: string, type: ToastType = "warning") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const saveSession = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
    setDoorStatus(null);
    setLastCommandId("");
    setLastCommandStatus("");
  };

  const getDisplayName = () => {
    return user?.fullName || user?.name || user?.email || "Admin";
  };

  const refreshDoorStatus = async (authToken = token) => {
    if (!authToken) return;

    try {
      const response = await fetch(`${apiBase}/api/access/device/live-state`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data: DoorLiveStateResponse = await response.json();

      if (response.ok) {
        setDoorStatus(data);
      }
    } catch {
      // Keep previous status silently.
    }
  };

  const waitForDoorCommandResult = async (
    commandId: string,
    authToken: string
  ): Promise<DoorCommandStatusResponse> => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await fetch(
        `${apiBase}/api/access/command-status/${commandId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data: DoorCommandStatusResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to check door command status.");
      }

      const status = String(data.status || "").toLowerCase();

      setLastCommandStatus(status);

      if (isFinalSuccessStatus(status)) {
        return data;
      }

      if (isFinalFailureStatus(status)) {
        throw new Error(data.message || "Door command failed.");
      }

      await sleep(900);
    }

    throw new Error("Door controller did not confirm in time.");
  };

  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);

        if (!savedToken) {
          return;
        }

        const response = await fetch(`${apiBase}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (!response.ok) {
          clearSession();
          return;
        }

        const currentUser = await response.json();

        if (currentUser?.role !== "admin") {
          clearSession();
          showTopMessage("Only admins can use door control.", "error");
          return;
        }

        saveSession(savedToken, currentUser);
        await refreshDoorStatus(savedToken);
      } catch {
        clearSession();
      } finally {
        setCheckingSession(false);
      }
    };

    checkSavedSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    refreshDoorStatus(token);

    const interval = window.setInterval(() => {
      refreshDoorStatus(token);
    }, 5000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      showTopMessage("Email and password are required.", "error");
      return;
    }

    try {
      setLoggingIn(true);

      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.user.role !== "admin") {
        throw new Error("Only admins can use this app.");
      }

      saveSession(data.token, data.user);
      setEmail("");
      setPassword("");
      await refreshDoorStatus(data.token);
      showTopMessage("Admin login successful ✅", "success");
    } catch (err: any) {
      clearSession();
      showTopMessage(err?.message || "Login failed.", "error");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUnlockDoor = async () => {
    if (!token) {
      showTopMessage("Please login first.", "error");
      return;
    }

    const confirmed = window.confirm("Unlock Gym Ravana main door now?");

    if (!confirmed) return;

    try {
      setUnlocking(true);
      setLastCommandId("");
      setLastCommandStatus("");

      const response = await fetch(`${apiBase}/api/access/device/manual-unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accessPoint: "main-door",
          notes: "Admin remote unlock from Door Control PWA",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Door unlock request failed.");
      }

      if (!data.commandId) {
        throw new Error("Door command was not created.");
      }

      setLastCommandId(data.commandId);
      setLastCommandStatus("pending");
      showTopMessage("Unlocking door... waiting for ESP32.", "warning");

      const finalResult = await waitForDoorCommandResult(data.commandId, token);

      showTopMessage(
        finalResult.message || "Door unlocked successfully ✅",
        "success"
      );

      await refreshDoorStatus(token);
    } catch (err: any) {
      showTopMessage(
        err?.message || "Door unlock failed. Please try again.",
        "error"
      );
      await refreshDoorStatus(token);
    } finally {
      setUnlocking(false);
    }
  };

  const handleRestartController = async () => {
    if (!token) {
      showTopMessage("Please login first.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Restart the ESP32 door controller now? Use this only when the door controller is not responding."
    );

    if (!confirmed) return;

    try {
      setRestarting(true);
      setLastCommandId("");
      setLastCommandStatus("");

      const response = await fetch(`${apiBase}/api/access/device/restart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Restart request failed.");
      }

      if (!data.commandId) {
        throw new Error("Restart command was not created.");
      }

      setLastCommandId(data.commandId);
      setLastCommandStatus("pending");
      showTopMessage("Restart command sent. Waiting for ESP32...", "warning");

      const finalResult = await waitForDoorCommandResult(data.commandId, token);

      showTopMessage(
        finalResult.message || "Door controller restarting ✅",
        "success"
      );

      await refreshDoorStatus(token);
    } catch (err: any) {
      showTopMessage(
        err?.message || "Door controller restart failed.",
        "error"
      );
      await refreshDoorStatus(token);
    } finally {
      setRestarting(false);
    }
  };

  const getStatusBadgeClass = () => {
    if (!doorStatus) return "border-white/10 bg-white/[0.04] text-white/60";

    if (!doorStatus.hardwareOnline) {
      return "border-gray-500/30 bg-gray-900/70 text-gray-200";
    }

    if (doorStatus.state === "LOCKED_READY") {
      return "border-emerald-400/30 bg-emerald-950/70 text-emerald-100";
    }

    if (doorStatus.state === "UNLOCK_WAITING_FOR_PUSH") {
      return "border-green-400/30 bg-green-950/70 text-green-100";
    }

    if (
      doorStatus.state === "DOOR_OPEN_LOCKED" ||
      doorStatus.state === "UNLOCK_PENDING"
    ) {
      return "border-orange-400/30 bg-orange-950/70 text-orange-100";
    }

    return "border-white/10 bg-white/[0.04] text-white/70";
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-900/40">
            <span className="text-3xl font-black">R</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight">GYM RAVANA</h1>
          <p className="mt-3 text-sm text-white/60">Checking admin session...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {toast && (
        <div className="fixed left-0 right-0 top-4 z-50 mx-auto w-[92%] max-w-md">
          <div
            className={`rounded-3xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-100"
                : toast.type === "error"
                ? "border-red-500/40 bg-red-950/95 text-red-100"
                : "border-orange-400/30 bg-orange-950/90 text-orange-100"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/55">
              {toast.type === "success"
                ? "Success"
                : toast.type === "error"
                ? "Warning"
                : "Notice"}
            </p>

            <p className="mt-1 text-sm font-black leading-relaxed">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-6 pt-10">
        <header className="pt-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-900/40">
            <span className="text-3xl font-black">R</span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
            Gym Ravana
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Door Control
          </h1>

          <p className="mt-2 text-sm text-white/55">
            Admin-only remote unlock app
          </p>
        </header>

        {!isAdmin ? (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
            <h2 className="text-xl font-black">Admin Login</h2>

            <p className="mt-2 text-sm text-white/55">
              Login once. Your admin session will stay saved on this phone.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/75">
                  Email
                </span>

                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  placeholder="admin@email.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/75">
                  Password
                </span>

                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  placeholder="••••••••"
                />
              </label>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-2xl bg-red-600 px-5 py-4 text-base font-black uppercase tracking-wide text-white shadow-lg shadow-red-950/40 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingIn ? "Logging in..." : "Login"}
              </button>
            </form>
          </section>
        ) : (
          <section className="mt-8 flex flex-1 flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
            <div className="rounded-3xl border border-white/10 bg-black/50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                Logged in as
              </p>

              <h2 className="mt-2 text-xl font-black">{getDisplayName()}</h2>
              <p className="mt-1 text-sm text-white/50">{user?.email}</p>
            </div>

            <div className={`mt-5 rounded-3xl border p-5 ${getStatusBadgeClass()}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">
                    Door Controller
                  </p>

                  <h3 className="mt-2 text-lg font-black">
                    {doorStatus?.hardwareOnline ? "Online" : "Offline / Unknown"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => refreshDoorStatus(token)}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-black uppercase tracking-wide text-white/70 active:scale-95"
                >
                  Refresh
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-white/75">
                {doorStatus?.message || "Door live status not loaded yet."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="uppercase tracking-[0.2em] text-white/35">State</p>
                  <p className="mt-1 break-words font-black text-white/80">
                    {doorStatus?.state || "UNKNOWN"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="uppercase tracking-[0.2em] text-white/35">Door</p>
                  <p className="mt-1 font-black text-white/80">
                    {doorStatus?.device?.doorOpen
                      ? "Open"
                      : doorStatus?.device?.doorClosed
                      ? "Closed"
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {doorStatus?.device?.lastHeartbeatAt && (
                <p className="mt-3 text-[11px] text-white/40">
                  Last heartbeat:{" "}
                  {new Date(doorStatus.device.lastHeartbeatAt).toLocaleString()}
                </p>
              )}
            </div>

            {lastCommandId && (
              <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                  Last Command
                </p>

                <p className="mt-2 break-all text-xs text-white/50">
                  {lastCommandId}
                </p>

                <p className="mt-2 text-sm font-black uppercase tracking-wide text-red-300">
                  {lastCommandStatus || "pending"}
                </p>
              </div>
            )}

            <div className="my-8 flex flex-1 items-center justify-center">
              <button
                onClick={handleUnlockDoor}
                disabled={unlocking || restarting}
                className="flex h-64 w-64 items-center justify-center rounded-full border border-red-400/40 bg-red-600 text-center text-3xl font-black uppercase leading-tight tracking-wide text-white shadow-[0_0_80px_rgba(220,38,38,0.45)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {unlocking ? "Unlocking..." : "Unlock Door"}
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRestartController}
                disabled={unlocking || restarting}
                className="w-full rounded-2xl border border-orange-400/30 bg-orange-500/10 px-5 py-4 text-sm font-black uppercase tracking-wide text-orange-100 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {restarting ? "Restarting..." : "Restart Door Controller"}
              </button>

              <button
                onClick={() => {
                  clearSession();
                  showTopMessage("Logged out.", "warning");
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white/70"
              >
                Logout
              </button>
            </div>
          </section>
        )}

        <footer className="py-5 text-center text-xs text-white/35">
          Remote door unlock only
        </footer>
      </div>
    </main>
  );
}