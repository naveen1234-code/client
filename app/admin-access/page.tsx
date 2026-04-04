"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

export default function AdminAccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        if (data.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        router.replace("/admin");
      } catch {
        setError("Failed to load admin access app.");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  return (
    <PageTransition>
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
          <p className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
            Gym Ravana Admin
          </p>

          <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white">
            Admin Access App
          </h1>

          <p className="mt-3 text-sm leading-7 text-gray-300">
            Loading secure admin dashboard...
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-gray-300">
              Verifying admin session...
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}