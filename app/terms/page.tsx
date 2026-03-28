import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,120,60,0.22),_transparent_35%),linear-gradient(135deg,_#160505_0%,_#2a0909_45%,_#3d0d0d_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-300">
              Gym Ravana Rules
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-wide md:text-5xl">
              Terms & Conditions
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              Please read the gym rules carefully before submitting your membership application.
            </p>
          </div>

          <div className="flex items-center gap-3">
  <a
    href="/register"
    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-orange-400"
  >
    Back to Register
  </a>

  <a
    href="/"
    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/20"
  >
    Back to Home
  </a>
</div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          <img
            src="/gym-ravana-terms.jpeg"
            alt="Gym Ravana Terms and Conditions"
            className="w-full object-contain"
          />
        </div>
      </div>
    </main>
  );
}