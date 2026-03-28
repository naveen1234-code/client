"use client";

import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

export default function PaymentsPage() {
  const router = useRouter();

  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        {/* background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.10),transparent_35%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.00)_45%,rgba(255,255,255,0.02)_100%)]" />

          {/* black closed-tape style stripes */}
          <div className="absolute -left-[20%] top-[12%] h-16 w-[140%] rotate-[-32deg] bg-black/90 shadow-[0_0_30px_rgba(0,0,0,0.55)] border-y border-white/10 animate-[tapeFloatA_7s_ease-in-out_infinite]" />
          <div className="absolute -left-[28%] top-[34%] h-16 w-[150%] rotate-[18deg] bg-black/85 shadow-[0_0_30px_rgba(0,0,0,0.55)] border-y border-white/10 animate-[tapeFloatB_8s_ease-in-out_infinite]" />
          <div className="absolute -left-[18%] top-[58%] h-16 w-[138%] rotate-[-18deg] bg-black/90 shadow-[0_0_30px_rgba(0,0,0,0.55)] border-y border-white/10 animate-[tapeFloatC_9s_ease-in-out_infinite]" />
          <div className="absolute -left-[26%] top-[80%] h-16 w-[148%] rotate-[26deg] bg-black/85 shadow-[0_0_30px_rgba(0,0,0,0.55)] border-y border-white/10 animate-[tapeFloatD_10s_ease-in-out_infinite]" />

          {/* repeating CLOSED text strips */}
          <div className="absolute -left-[20%] top-[12%] flex w-[140%] rotate-[-32deg] justify-around text-[28px] font-black uppercase tracking-[0.25em] text-white/12 animate-[tapeFloatA_7s_ease-in-out_infinite] sm:text-[34px]">
            <span>CLOSED</span>
            <span>CLOSED</span>
            <span>CLOSED</span>
            <span>CLOSED</span>
          </div>

          <div className="absolute -left-[28%] top-[34%] flex w-[150%] rotate-[18deg] justify-around text-[28px] font-black uppercase tracking-[0.25em] text-white/10 animate-[tapeFloatB_8s_ease-in-out_infinite] sm:text-[34px]">
            <span>LOCKED</span>
            <span>LOCKED</span>
            <span>LOCKED</span>
            <span>LOCKED</span>
          </div>

          <div className="absolute -left-[18%] top-[58%] flex w-[138%] rotate-[-18deg] justify-around text-[28px] font-black uppercase tracking-[0.25em] text-white/12 animate-[tapeFloatC_9s_ease-in-out_infinite] sm:text-[34px]">
            <span>CLOSED</span>
            <span>CLOSED</span>
            <span>CLOSED</span>
            <span>CLOSED</span>
          </div>

          <div className="absolute -left-[26%] top-[80%] flex w-[148%] rotate-[26deg] justify-around text-[28px] font-black uppercase tracking-[0.25em] text-white/10 animate-[tapeFloatD_10s_ease-in-out_infinite] sm:text-[34px]">
            <span>COMING SOON</span>
            <span>COMING SOON</span>
            <span>COMING SOON</span>
          </div>

          <div className="absolute left-[-100px] top-[120px] h-[260px] w-[260px] rounded-full bg-red-600/15 blur-3xl" />
          <div className="absolute right-[-80px] top-[160px] h-[220px] w-[220px] rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
        </div>

        {/* content */}
        <div className="relative mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
          <section className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur sm:p-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-4xl shadow-[0_0_40px_rgba(220,38,38,0.22)]">
              🔒
            </div>

            <p className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
              Payment Center Locked
            </p>

            <h1 className="mt-5 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
              Payments
              <span className="block text-red-500">Temporarily Unavailable</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              This feature is currently locked while we complete the final system setup.
              Please check back soon.
            </p>

            <p className="mt-4 text-sm font-bold uppercase tracking-[0.22em] text-gray-500">
              Coming Soon
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700"
              >
                Back to Dashboard
              </button>

              <button
                onClick={() => router.push("/access")}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
              >
                Open Access App
              </button>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}