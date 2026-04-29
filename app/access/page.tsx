"use client";

import PageTransition from "@/components/PageTransition";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserType = {
  name: string;
  email: string;
  role: string;
  membershipStatus: string;
  membershipPlan: string;
  remainingDays: number;
  attendanceCount: number;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function AccessPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [error, setError] = useState("");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installHelpTitle, setInstallHelpTitle] = useState("");
  const [installHelpSteps, setInstallHelpSteps] = useState<string[]>([]);

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
      } catch {
        setError("Failed to load access app");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const detectInstallGuide = () => {
  const ua = navigator.userAgent.toLowerCase();

  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isSafari =
    /safari/.test(ua) &&
    !/chrome|crios|android|edg|opr|opera/.test(ua);

  const isAndroid = /android/.test(ua);
  const isSamsung = /samsungbrowser/.test(ua);

  if (isIOS && isSafari) {
    return {
      title: "Install on iPhone / Safari",
      steps: [
        "Tap the Share button in Safari.",
        "Scroll down and tap Add to Home Screen.",
        "Tap Add to install the Gym Ravana Access App.",
      ],
    };
  }

  if (isAndroid && isSamsung) {
    return {
      title: "Install on Samsung Internet",
      steps: [
        "Tap the browser menu.",
        "Tap Add page to.",
        "Choose Home screen.",
        "Tap Add to install the Gym Ravana Access App.",
      ],
    };
  }

  if (isAndroid) {
    return {
      title: "Install on Android",
      steps: [
        "Open the browser menu.",
        "Tap Install App or Add to Home Screen.",
        "Confirm to install the Gym Ravana Access App.",
      ],
    };
  }

  return {
    title: "Install Access App",
    steps: [
      "Open your browser menu.",
      "Choose Install App or Add to Home Screen.",
      "Confirm to place Gym Ravana Access App on your phone.",
    ],
  };
};

  const handleInstallApp = async () => {
    if (installPrompt) {
      setShowInstallHelp(false);
      await installPrompt.prompt();

      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setInstallPrompt(null);
      }

      return;
    }

    const guide = detectInstallGuide();
    setInstallHelpTitle(guide.title);
    setInstallHelpSteps(guide.steps);
    setShowInstallHelp(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl">
          Loading access app...
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[100px] h-[260px] w-[260px] rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute right-[-80px] top-[140px] h-[220px] w-[220px] rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.12),transparent_35%)]" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="text-center">
              <p className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
                Gym Ravana Access App
              </p>

              <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Quick Member Access
              </h1>

              <p className="mt-3 text-sm text-gray-400 sm:text-base">
                Fast gym entry and exit from your phone. Use this screen daily,
                and open the full account page only when you need more details.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300">
                {error}
              </div>
            )}

            {user && (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                      Member
                    </p>
                    <p className="mt-2 text-xl font-black text-white">{user.name}</p>
                    <p className="mt-1 break-all text-sm text-gray-400">
                      {user.email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                      Membership Status
                    </p>
                    <p className="mt-2 text-xl font-black text-yellow-400">
                      {user.membershipStatus}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">{user.membershipPlan}</p>
                  </div>

                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-green-300">
                      Remaining Days
                    </p>
                    <p className="mt-2 text-4xl font-black text-green-400">
                      {user.remainingDays}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-300">
                      Attendance Count
                    </p>
                    <p className="mt-2 text-4xl font-black text-blue-400">
                      {user.attendanceCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <button
                    onClick={() => router.push("/check-in?mode=entry")}
                    className="w-full rounded-2xl bg-red-600 px-6 py-5 text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(255,0,0,0.25)] transition duration-300 hover:scale-[1.01] hover:bg-red-700"
                  >
                    Entry Scan
                  </button>

                  <button
                    onClick={() => router.push("/check-in?mode=exit")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-base font-black uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Exit Scan
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleInstallApp}
                    className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
                  >
                    Install App
                  </button>

                  <button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    View Full Account
                  </button>

                  <button
                    onClick={handleLogout}
                    className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Easy Daily Use
                  </p>
                  <p className="mt-2 text-sm leading-7 text-gray-300">
                    For the easiest experience, install this access app once and
                    open it from your phone home screen every time you come to the gym.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {showInstallHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-2xl">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                {installHelpTitle}
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-300">
                Follow these quick steps to install the Gym Ravana Access App on your phone.
              </p>

              <div className="mt-5 space-y-3">
                {installHelpSteps.map((step, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
                  >
                    <span className="mr-2 font-black text-red-400">{index + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowInstallHelp(false)}
                className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  );
}