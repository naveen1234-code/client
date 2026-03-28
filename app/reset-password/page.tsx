"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token") || "";
    setToken(tokenFromUrl);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to reset password");
      } else {
        setMessage("Password reset successfully ✅ Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch {
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
          <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
              Secure Password Reset
            </div>

            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Create a New
              <span className="block text-red-500">Member Password</span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              Set a new password for your account and continue using the Gym Ravana system.
            </p>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Reset Password
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                New Password
              </h2>
            </div>

            {!token ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300">
                Missing or invalid reset token.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-red-600 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            )}

            {message && (
              <div
                className={`mt-5 rounded-2xl border px-4 py-4 text-sm font-semibold ${
                  message.toLowerCase().includes("success")
                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {message}
              </div>
            )}
          </section>
        </div>
      </main>
    </PageTransition>
  );
}