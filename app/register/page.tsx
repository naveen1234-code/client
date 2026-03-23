"use client";
import PageTransition from "@/components/PageTransition";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Registration failed");
      } else {
        setMessage("Registration successful ✅ Redirecting to login...");
        setFormData({
          name: "",
          email: "",
          password: "",
        });

        setTimeout(() => {
          router.push("/login");
        }, 1000);
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
        <div className="absolute left-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute right-[-90px] top-[180px] h-[220px] w-[220px] rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-100px] left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[90vh] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT BRAND PANEL */}
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
            Join The Ravana System
          </div>

          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Create Your
            <span className="block text-red-500">GYM RAVANA</span>
            Member Account
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
            Register now to access your member dashboard, manage your
            subscription, view attendance, and use the gym check-in system with
            your account.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Account
              </p>
              <p className="mt-2 text-base font-bold text-white">
                Secure Member Login
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Dashboard
              </p>
              <p className="mt-2 text-base font-bold text-white">
                Membership Tracking
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Entry
              </p>
              <p className="mt-2 text-base font-bold text-white">
                QR Gym Check-In
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT REGISTER CARD */}
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
              New Member Signup
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Register Account
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              Fill in your details below to create your GYM RAVANA member
              account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
              />
            </div>

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
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Create your password"
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
              {loading ? "Creating Account..." : "Create Member Account"}
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
            <p className="text-sm text-gray-400">Already have an account?</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              Go to Login
            </button>
          </div>
        </section>
      </div>
    </main>
    </PageTransition>
  );
}