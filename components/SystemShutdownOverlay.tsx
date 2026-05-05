"use client";

type SystemShutdownOverlayProps = {
  title: string;
  headline: string;
  message: string;
};

export default function SystemShutdownOverlay({
  title,
  headline,
  message,
}: SystemShutdownOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-8 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[80px] h-[280px] w-[280px] rounded-full bg-red-600/25 blur-3xl" />
        <div className="absolute right-[-120px] bottom-[80px] h-[300px] w-[300px] rounded-full bg-red-700/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.18),transparent_38%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(115deg,transparent_0%,transparent_44%,rgba(255,255,255,0.8)_45%,transparent_46%,transparent_100%)] [background-size:90px_90px]" />
      </div>

      <section className="relative w-full max-w-xl overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.06] p-7 text-center shadow-[0_0_90px_rgba(220,38,38,0.20)] backdrop-blur-2xl sm:p-10">
        <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-red-500/10 via-transparent to-white/5" />

        <div className="relative">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.25)]">
            <span className="text-5xl">🔒</span>
          </div>

          <p className="mx-auto mt-7 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.35em] text-red-300">
            {title}
          </p>

          <h1 className="mt-7 text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-6xl">
            {headline}
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-8 text-white/70 sm:text-lg">
            {message}
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/35 px-5 py-5">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/35">
              Maintenance Mode Active
            </p>
            <p className="mt-2 text-sm font-semibold text-white/65">
              Member access, QR scanning, account dashboard, payments, and bookings are currently locked.
            </p>
          </div>

          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.4em] text-red-300/70">
            Coming Back Soon
          </p>
        </div>
      </section>
    </div>
  );
}