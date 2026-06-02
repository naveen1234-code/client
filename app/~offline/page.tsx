export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 shadow-[0_0_45px_rgba(234,179,8,0.22)]">
          <span className="text-4xl">📡</span>
        </div>

        <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-white">
          You're Offline
        </h1>

        <p className="mb-6 text-base leading-7 text-white/70">
          No internet connection detected. Your scans will be saved and synced automatically when you're back online.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Offline Mode Active
          </p>
          <p className="mt-2 text-sm text-white/65">
            The app will continue to work. Scans are queued locally.
          </p>
        </div>
      </div>
    </div>
  );
}
