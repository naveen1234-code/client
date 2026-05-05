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

type SystemStatus = {
  success?: boolean;
  maintenanceMode?: boolean;
  title?: string;
  headline?: string;
  message?: string;
  updatedAt?: string;
  updatedByName?: string;
};

type ToastType = "success" | "error" | "warning";

export default function SystemControlPage() {
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

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("GYM RAVANA DIGITAL SYSTEM");
  const [headline, setHeadline] = useState("SYSTEM TEMPORARILY SHUT DOWN");
  const [message, setMessage] = useState(
    "We are currently upgrading the Gym Ravana digital system. Access app, account dashboard, QR scanning, and member features are temporarily unavailable. Please check back soon."
  );

  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const isAdmin = user?.role === "admin";

  const showToast = (nextMessage: string, type: ToastType = "warning") => {
    setToast({ message: nextMessage, type });
  };

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const saveSession = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem("gym_ravana_system_control_token", nextToken);
    localStorage.setItem(
      "gym_ravana_system_control_user",
      JSON.stringify(nextUser)
    );
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem("gym_ravana_system_control_token");
    localStorage.removeItem("gym_ravana_system_control_user");
    setToken("");
    setUser(null);
  };

  const getDisplayName = () => {
    return user?.fullName || user?.name || user?.email || "Admin";
  };

  const loadStatus = async () => {
    const response = await fetch(`${apiBase}/api/system/status`, {
      cache: "no-store",
    });

    const data: SystemStatus = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load system status.");
    }

    setStatus(data);
    setTitle(data.title || "GYM RAVANA DIGITAL SYSTEM");
    setHeadline(data.headline || "SYSTEM TEMPORARILY SHUT DOWN");
    setMessage(
      data.message ||
        "We are currently upgrading the Gym Ravana digital system. Please check back soon."
    );

    return data;
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const savedToken = localStorage.getItem(
          "gym_ravana_system_control_token"
        );

        if (savedToken) {
          const response = await fetch(`${apiBase}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            const currentUser = await response.json();

            if (currentUser?.role === "admin") {
              saveSession(savedToken, currentUser);
            } else {
              clearSession();
            }
          } else {
            clearSession();
          }
        }

        await loadStatus();
      } catch (err: any) {
        showToast(err?.message || "Failed to load control page.", "error");
      } finally {
        setLoading(false);
      }
    };

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast("Email and password are required.", "error");
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

      const data = await response.json();

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.user.role !== "admin") {
        throw new Error("Only admins can control system shutdown.");
      }

      saveSession(data.token, data.user);
      setEmail("");
      setPassword("");
      showToast("Admin login successful.", "success");
    } catch (err: any) {
      clearSession();
      showToast(err?.message || "Login failed.", "error");
    } finally {
      setLoggingIn(false);
    }
  };

  const updateMaintenanceMode = async (nextMode: boolean) => {
    if (!token) {
      showToast("Please login first.", "error");
      return;
    }

    const confirmed = window.confirm(
      nextMode
        ? "Turn ON full system shutdown mode now?"
        : "Turn OFF shutdown mode and reopen the system?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await fetch(`${apiBase}/api/system/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maintenanceMode: nextMode,
          title,
          headline,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update system status.");
      }

      await loadStatus();

      showToast(
        nextMode
          ? "System shutdown mode enabled."
          : "System shutdown mode disabled.",
        "success"
      );
    } catch (err: any) {
      showToast(err?.message || "Failed to update system status.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          Loading system control...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white">
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
            <p className="text-sm font-black">{toast.message}</p>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-2xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-400">
            Gym Ravana
          </p>

          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight">
            System Control
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/55">
            Hidden admin page for turning full system shutdown mode ON/OFF.
          </p>
        </header>

        {!isAdmin ? (
          <form
            onSubmit={handleLogin}
            className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl"
          >
            <h2 className="text-xl font-black">Admin Login</h2>

            <div className="mt-5 space-y-4">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="Admin email"
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none focus:border-red-500"
              />

              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none focus:border-red-500"
              />

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60"
              >
                {loggingIn ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
                Logged in as
              </p>
              <h2 className="mt-2 text-xl font-black">{getDisplayName()}</h2>
              <p className="mt-1 text-sm text-white/50">{user?.email}</p>

              <div
                className={`mt-5 rounded-3xl border p-5 ${
                  status?.maintenanceMode
                    ? "border-red-500/30 bg-red-500/10 text-red-100"
                    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-[0.28em]">
                  Current Status
                </p>
                <p className="mt-2 text-2xl font-black">
                  {status?.maintenanceMode
                    ? "SHUTDOWN MODE ON"
                    : "SYSTEM ONLINE"}
                </p>
                {status?.updatedAt && (
                  <p className="mt-2 text-xs opacity-70">
                    Last updated: {new Date(status.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
              <h2 className="text-xl font-black">Shutdown Overlay Text</h2>

              <div className="mt-5 space-y-4">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none focus:border-red-500"
                  placeholder="Title"
                />

                <input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none focus:border-red-500"
                  placeholder="Headline"
                />

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none focus:border-red-500"
                  placeholder="Message"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => updateMaintenanceMode(true)}
                disabled={saving || status?.maintenanceMode}
                className="rounded-2xl bg-red-600 px-5 py-5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Enable Full Shutdown"}
              </button>

              <button
                onClick={() => updateMaintenanceMode(false)}
                disabled={saving || !status?.maintenanceMode}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-5 text-sm font-black uppercase tracking-wide text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Disable Shutdown / Reopen System"}
              </button>

              <button
                onClick={() => {
                  clearSession();
                  showToast("Logged out.", "warning");
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold text-white/70"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}