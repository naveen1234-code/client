"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type DoorLiveState = {
  success?: boolean;
  state?: string;
  color?: "red" | "green" | "orange" | "gray" | string;
  isUnlocked?: boolean;
  hardwareOnline?: boolean;
  message?: string;
  device?: {
    deviceId?: string;
    ip?: string;
    state?: string;
    doorClosed?: boolean;
    doorOpen?: boolean;
    sessionId?: string;
    userName?: string;
    accessPoint?: string;
    lastHeartbeatAt?: string;
  } | null;
  session?: {
    id?: string;
    action?: string;
    userName?: string;
    accessPoint?: string;
    doorOpened?: boolean;
    doorClosed?: boolean;
    completed?: boolean;
    createdAt?: string;
    openedAt?: string;
    closedAt?: string;
    completedAt?: string;
  } | null;
  command?: {
    id?: string;
    status?: string;
    action?: string;
    createdAt?: string;
    claimedAt?: string;
    completedAt?: string;
  } | null;
};

const TOKEN_KEY = "gym_ravana_door_admin_token";
const USER_KEY = "gym_ravana_door_admin_user";

const getButtonTheme = (color?: string) => {
  if (color === "green") {
    return {
      button:
        "border-emerald-300/50 bg-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.45)]",
      dot: "bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.9)]",
      label: "UNLOCKED",
      ring: "border-emerald-400/35",
    };
  }

  if (color === "orange") {
    return {
      button:
        "border-orange-300/50 bg-orange-500 shadow-[0_0_80px_rgba(249,115,22,0.45)]",
      dot: "bg-orange-400 shadow-[0_0_22px_rgba(251,146,60,0.9)]",
      label: "PENDING",
      ring: "border-orange-400/35",
    };
  }

  if (color === "gray") {
    return {
      button:
        "border-zinc-400/30 bg-zinc-700 shadow-[0_0_55px_rgba(113,113,122,0.25)]",
      dot: "bg-zinc-400 shadow-[0_0_14px_rgba(161,161,170,0.6)]",
      label: "OFFLINE",
      ring: "border-zinc-500/25",
    };
  }

  return {
    button:
      "border-red-400/40 bg-red-600 shadow-[0_0_80px_rgba(220,38,38,0.45)]",
    dot: "bg-red-400 shadow-[0_0_22px_rgba(248,113,113,0.9)]",
    label: "LOCKED",
    ring: "border-red-500/35",
  };
};

const formatTime = (value?: string) => {
  if (!value) return "Not available";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "Not available";
  }
};

export default function DoorControlPage() {
  const apiBase = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://gym-ravana-backend.onrender.com"
    ).replace(/\/$/, "");
  }, []);

  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<AuthUser | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [refreshingState, setRefreshingState] = useState(false);

  const [doorState, setDoorState] = useState<DoorLiveState | null>(null);
  const [status, setStatus] = useState("Checking admin session...");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";
  const buttonTheme = getButtonTheme(doorState?.color);

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
    setDoorState(null);
  };

  const getDisplayName = () => {
    return user?.fullName || user?.name || user?.email || "Admin";
  };

  const fetchDoorState = useCallback(
    async (activeToken?: string) => {
      const tokenToUse = activeToken || token;

      if (!tokenToUse) return;

      try {
        setRefreshingState(true);

        const response = await fetch(`${apiBase}/api/access/device/live-state`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
          cache: "no-store",
        });

        const data: DoorLiveState = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch door state.");
        }

        setDoorState(data);
      } catch (err: any) {
        setDoorState({
          success: false,
          state: "STATE_UNKNOWN",
          color: "gray",
          isUnlocked: false,
          hardwareOnline: false,
          message: err?.message || "Door live state unavailable.",
        });
      } finally {
        setRefreshingState(false);
      }
    },
    [apiBase, token]
  );

  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUserRaw = localStorage.getItem(USER_KEY);

        if (!savedToken) {
          setStatus("Please login as admin.");
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
          setStatus("Session expired. Please login again.");
          return;
        }

        const currentUser = await response.json();

        if (currentUser?.role !== "admin") {
          clearSession();
          setError("Only admins can use door control.");
          setStatus("Admin access required.");
          return;
        }

        let finalUser = currentUser;

        if (!finalUser && savedUserRaw) {
          finalUser = JSON.parse(savedUserRaw);
        }

        saveSession(savedToken, finalUser);
        setStatus("Admin ready.");
        await fetchDoorState(savedToken);
      } catch {
        clearSession();
        setStatus("Please login as admin.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSavedSession();
  }, [apiBase, fetchDoorState]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const interval = window.setInterval(() => {
      fetchDoorState();
    }, 1000);

    return () => window.clearInterval(interval);
  }, [fetchDoorState, isAdmin, token]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoggingIn(true);
      setError("");
      setStatus("Logging in...");

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
      setStatus("Admin ready.");
      setEmail("");
      setPassword("");
      await fetchDoorState(data.token);
    } catch (err: any) {
      clearSession();
      setError(err?.message || "Login failed.");
      setStatus("Login required.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUnlockDoor = async () => {
    if (!token) {
      setError("Please login first.");
      return;
    }

    const confirmed = window.confirm("Unlock Gym Ravana main door now?");

    if (!confirmed) return;

    try {
      setUnlocking(true);
      setError("");
      setStatus("Sending unlock command...");

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
        throw new Error(data.message || "Door unlock failed.");
      }

      setStatus("Unlock command sent ✅");
      setDoorState((prev) => ({
        ...(prev || {}),
        state: "UNLOCK_PENDING",
        color: "orange",
        isUnlocked: false,
        message: "Unlock command sent. Waiting for ESP32.",
      }));

      setTimeout(() => {
        fetchDoorState();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Door unlock failed.");
      setStatus("Unlock failed.");
    } finally {
      setUnlocking(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-red-600 shadow-lg shadow-red-900/40" />
          <h1 className="text-2xl font-black tracking-tight">GYM RAVANA</h1>
          <p className="mt-3 text-sm text-white/60">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">
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
            Secure admin-only remote unlock app
          </p>
        </header>

        {!isAdmin ? (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
            <h2 className="text-xl font-black">Admin Login</h2>
            <p className="mt-2 text-sm text-white/55">
              Login once. The app will keep your admin session saved on this phone.
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                    Logged in as
                  </p>
                  <h2 className="mt-2 text-xl font-black">{getDisplayName()}</h2>
                  <p className="mt-1 text-sm text-white/50">{user?.email}</p>
                </div>

                <div className="text-right">
                  <div
                    className={`ml-auto h-3 w-3 rounded-full ${buttonTheme.dot}`}
                  />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                    {refreshingState ? "Syncing" : "Live"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                Door State
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full ${buttonTheme.dot}`} />
                <div>
                  <h3 className="text-2xl font-black">
                    {doorState?.state || "UNKNOWN"}
                  </h3>
                  <p className="mt-1 text-sm text-white/55">
                    {doorState?.message || "Waiting for live door state..."}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    Hardware
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {doorState?.hardwareOnline ? "Online" : "Offline"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    Reed
                  </p>
                  <p className="mt-1 text-sm font-black">
                    {doorState?.device?.doorClosed
                      ? "Closed"
                      : doorState?.device?.doorOpen
                      ? "Open"
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            <div className="my-8 flex flex-1 items-center justify-center">
              <div
                className={`rounded-full border p-3 ${buttonTheme.ring}`}
              >
                <button
                  onClick={handleUnlockDoor}
                  disabled={unlocking}
                  className={`flex h-56 w-56 items-center justify-center rounded-full border text-center text-2xl font-black uppercase leading-tight tracking-wide text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${buttonTheme.button}`}
                >
                  {unlocking ? "Sending..." : buttonTheme.label === "LOCKED" ? "Unlock Door" : buttonTheme.label}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
                Last Hardware Signal
              </p>
              <p className="mt-2 text-sm text-white/65">
                {formatTime(doorState?.device?.lastHeartbeatAt)}
              </p>

              {doorState?.device?.ip ? (
                <p className="mt-1 text-xs text-white/35">
                  IP: {doorState.device.ip}
                </p>
              ) : null}
            </div>

            <button
              onClick={() => {
                clearSession();
                setStatus("Logged out.");
              }}
              className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white/70"
            >
              Logout
            </button>
          </section>
        )}

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
            Status
          </p>
          <p className="mt-2 text-sm text-white/75">{status}</p>

          {error ? (
            <p className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
              {error}
            </p>
          ) : null}
        </section>

        <footer className="py-5 text-center text-xs text-white/35">
          Admin-only remote door control
        </footer>
      </div>
    </main>
  );
}