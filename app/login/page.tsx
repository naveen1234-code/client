"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed");
      } else {
        localStorage.setItem("token", data.token);
setMessage("Login successful ✅ Redirecting...");

setTimeout(() => {
  if (data.user?.role === "admin") {
    router.push("/admin");
  } else {
    router.push("/access");
  }
}, 900);
      }
    } catch (error) {
      setMessage("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[100px] h-[260px] w-[260px] rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute right-[-80px] top-[140px] h-[220px] w-[220px] rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[90vh] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT BRAND PANEL */}
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
            Member Access Portal
          </div>

          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome Back to
            <span className="block text-red-500">GYM RAVANA</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
            Access your member dashboard, track your remaining days, review your
            attendance, and use the QR entry system with a single secure login.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Dashboard
              </p>
              <p className="mt-2 text-base font-bold text-white">
                Membership Overview
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Entry
              </p>
              <p className="mt-2 text-base font-bold text-white">
                QR Check-In System
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Tracking
              </p>
              <p className="mt-2 text-base font-bold text-white">
                Attendance & Days
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT LOGIN CARD */}
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
              Secure Sign In
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Member Login
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              Enter your account details to continue into your member area.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
              />
            </div>

            <div>
  <div className="mb-2 flex items-center justify-between">
    <label className="block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
      Password
    </label>

    <button
      type="button"
      onClick={() => router.push("/forgot-password")}
      className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-400 transition hover:text-red-300"
    >
      Forgot Password?
    </button>
  </div>

  <input
    type="password"
    name="password"
    placeholder="Enter your password"
    value={formData.password}
    onChange={handleChange}
    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
  />
</div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-red-600 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-4 text-sm font-semibold ${
                message.toLowerCase().includes("successful")
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-sm text-gray-400">
              Don’t have an account yet?
            </p>
            <button
              onClick={() => router.push("/register")}
              className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              Create Account
            </button>
          </div>
        </section>
      </div>
    </main>
    </PageTransition>
  );
}