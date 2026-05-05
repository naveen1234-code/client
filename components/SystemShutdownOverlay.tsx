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
  const headlineWords = headline.trim().split(" ");
  const firstWord = headlineWords[0] || "SYSTEM";
  const remainingHeadline =
    headlineWords.slice(1).join(" ") || "TEMPORARILY SHUT DOWN";

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-y-auto bg-black px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.25),transparent_36%),radial-gradient(circle_at_bottom,rgba(127,29,29,0.28),transparent_42%)]" />

        <div className="absolute left-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute right-[-120px] bottom-[80px] h-[280px] w-[280px] rounded-full bg-red-700/20 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.09]">
          <div className="absolute -left-10 top-20 rotate-[-28deg] text-7xl font-black uppercase tracking-[0.12em] text-white/20">
            GYM RAVANA
          </div>
          <div className="absolute -right-24 top-1/2 rotate-[-28deg] text-7xl font-black uppercase tracking-[0.12em] text-white/20">
            SYSTEM LOCKED
          </div>
          <div className="absolute bottom-16 left-4 rotate-[-28deg] text-6xl font-black uppercase tracking-[0.12em] text-white/20">
            DIGITAL ACCESS
          </div>
        </div>

        <div className="absolute inset-0 bg-black/35" />
      </div>

      <section className="relative my-auto w-full max-w-[420px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.07] px-6 py-8 text-center shadow-[0_0_80px_rgba(220,38,38,0.22)] backdrop-blur-2xl">
        <div className="absolute inset-0 rounded-[34px] bg-gradient-to-br from-red-500/12 via-white/[0.03] to-black/30" />

        <div className="relative">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 shadow-[0_0_45px_rgba(239,68,68,0.22)]">
            <span className="text-4xl">🔒</span>
          </div>

          <p className="mx-auto mt-6 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.34em] text-red-300">
            {title}
          </p>

          <h1 className="mt-7 text-4xl font-black uppercase leading-[1.15] tracking-tight sm:text-5xl">
            <span className="block text-white">{firstWord}</span>
            <span className="mt-2 block text-red-500">{remainingHeadline}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-sm text-base leading-8 text-white/70">
            {message}
          </p>

          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.4em] text-white/35">
            Coming Soon
          </p>

          <div className="mt-6 rounded-[26px] border border-white/10 bg-black/35 px-5 py-5 shadow-inner">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/40">
              Maintenance Mode Active
            </p>

            <p className="mt-3 text-sm font-semibold leading-7 text-white/65">
              Member access, QR scanning, dashboard, payments, and bookings are
              currently locked.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}