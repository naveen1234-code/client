"use client";
import PageTransition from "@/components/PageTransition";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

type UserType = {
  name: string;
  email: string;
  membershipStatus: string;
  membershipPlan: string;
  remainingDays: number;
  attendanceCount: number;
  lastCheckIn: string | null;
};

export default function CheckInPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scannerStarted, setScannerStarted] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
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
          router.push("/login");
          return;
        }

        setUser(data);
      } catch (err) {
        setError("Failed to load your member profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerStarted) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        setScannerStarted(false);
      }
    } catch (err) {
      console.log("Scanner stop warning:", err);
    }
  };

  const handleCheckIn = async (scannedValue: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setMessage("");
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scannedQrValue: scannedValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Check-in failed");
        return;
      }

      setUser(data.user);
      setMessage(data.message || "Check-in successful ✅");
      setSuccessState(true);
      setRedirecting(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1800);
    } catch (err) {
      setError("Something went wrong during check-in.");
    }
  };

  const startScanner = async () => {
    try {
      setError("");
      setMessage("");
      setHasScanned(false);
      setSuccessState(false);
      setRedirecting(false);

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
        },
        async (decodedText) => {
          if (hasScanned) return;

          setHasScanned(true);
          await stopScanner();
          await handleCheckIn(decodedText);
        },
        () => {}
      );

      setScannerStarted(true);
    } catch (err) {
      setError("Camera failed to start. Please allow camera access.");
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [scannerStarted]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl">
          <p className="text-lg tracking-wide text-gray-300">
            Loading scanner...
          </p>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[60px] h-[220px] w-[220px] rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/2 h-[240px] w-[240px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
              Gym Ravana Entry System
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Scan. Enter.
              <span className="block text-red-500">Train Hard.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
              Scan the official GYM RAVANA wall QR to mark today’s attendance and
              update your active membership usage instantly.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/40 hover:bg-red-500/10"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[30px] border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-5 shadow-2xl backdrop-blur sm:p-7">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Live QR Scanner
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Open the camera, point it at the printed wall QR, and your
                  check-in will process automatically.
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${
                  scannerStarted
                    ? "border border-green-500/30 bg-green-500/10 text-green-400"
                    : "border border-white/10 bg-white/5 text-gray-300"
                }`}
              >
                {scannerStarted ? "Camera Live" : "Scanner Idle"}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/70 p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.14),transparent_45%)]" />

              <div className="relative mb-4 rounded-[24px] border border-red-500/20 bg-black p-3 shadow-[0_0_60px_rgba(255,0,0,0.08)]">
                <div
                  id="reader"
                  className="min-h-[320px] overflow-hidden rounded-[20px] border border-white/10 bg-black"
                />
              </div>

              <div className="relative flex flex-col gap-3 sm:flex-row">
                {!scannerStarted ? (
                  <button
  onClick={startScanner}
  className="w-full rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(255,0,0,0.4)] transition duration-300 hover:scale-[1.01] hover:bg-red-700"
>
  Start Camera Scanner
</button>
                ) : (
                  <button
                    onClick={stopScanner}
                    className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Stop Scanner
                  </button>
                )}

                
              </div>

              {(message || error) && (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-4 transition-all duration-500 ${
                    error
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : "border-green-500/30 bg-green-500/10 text-green-300"
                  }`}
                >
                  <p className="text-sm font-semibold tracking-wide">
                    {error || message}
                  </p>
                  {redirecting && !error && (
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-green-200/80">
                      Redirecting to dashboard...
                    </p>
                  )}
                </div>
              )}

              {successState && !error && (
                <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-4 text-green-300 shadow-[0_0_40px_rgba(34,197,94,0.12)]">
                  <p className="text-lg font-bold uppercase tracking-[0.18em]">
                    Entry Approved ✅
                  </p>
                  <p className="mt-2 text-sm text-green-200/90">
                    Camera closed automatically. Your visit is now recorded.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Member Snapshot
              </p>

              {user ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                      {user.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{user.email}</p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Membership Plan
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">
                        {user.membershipPlan}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Status
                      </p>
                      <p className="mt-2 text-xl font-bold text-yellow-400">
                        {user.membershipStatus}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Remaining Days
                      </p>
                      <p className="mt-2 text-3xl font-black text-green-400">
                        {user.remainingDays}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Attendance Count
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {user.attendanceCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Last Check-In
                      </p>
                      <p className="mt-2 text-base font-semibold text-white">
                        {user.lastCheckIn
                          ? new Date(user.lastCheckIn).toLocaleDateString()
                          : "Not checked in yet"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No member data found.</p>
              )}
            </div>

            <div className="rounded-[30px] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-6 shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Entry Rule
              </p>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                One successful scan counts as one gym visit for the day. The
                system prevents multiple check-ins on the same date and reduces
                your remaining subscription days automatically.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
    </PageTransition>

  );
}