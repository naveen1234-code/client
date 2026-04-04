"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallGuide = {
  title: string;
  steps: string[];
};

export default function AccessPage() {
  const router = useRouter();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const ENTRY_SCAN_ROUTE = "/access/entry";
  const EXIT_SCAN_ROUTE = "/access/exit";
  const FULL_ACCOUNT_ROUTE = "/member";
  const LOGOUT_ROUTE = "/login";

  const checkStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;

    const iosStandalone =
      "standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    const mediaStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    return iosStandalone || mediaStandalone;
  }, []);

  useEffect(() => {
    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallHelp(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkStandalone]);

  const detectInstallGuide = useCallback((): InstallGuide => {
    if (typeof window === "undefined") {
      return {
        title: "Install this app",
        steps: [
          "Open this page in your mobile browser.",
          "Use the browser menu and choose the install option.",
        ],
      };
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIPhone =
      /iphone|ipad|ipod/.test(ua) &&
      /safari/.test(ua) &&
      !/crios|fxios|edgios/.test(ua);

    const isSamsungInternet =
      /samsungbrowser/.test(ua) && /android/.test(ua);

    const isAndroidChrome =
      /android/.test(ua) &&
      /chrome/.test(ua) &&
      !/edg|opr|opera|samsungbrowser/.test(ua);

    if (isIPhone) {
      return {
        title: "Install on iPhone Safari",
        steps: [
          "Tap the Share icon at the bottom of Safari.",
          "Scroll down and tap Add to Home Screen.",
          "Tap Add in the top-right corner.",
        ],
      };
    }

    if (isSamsungInternet) {
      return {
        title: "Install on Samsung Internet",
        steps: [
          "Tap the menu button in Samsung Internet.",
          "Tap Add page to.",
          "Choose Home screen.",
        ],
      };
    }

    if (isAndroidChrome) {
      return {
        title: "Install on Android Chrome",
        steps: [
          "Tap the browser menu in the top-right corner.",
          "Tap Install app or Add to Home screen.",
          "Confirm the install when prompted.",
        ],
      };
    }

    return {
      title: "Install this app",
      steps: [
        "Open your browser menu.",
        "Look for Install app or Add to Home screen.",
        "Confirm the install to place it on your phone.",
      ],
    };
  }, []);

  const installGuide = useMemo(() => detectInstallGuide(), [detectInstallGuide]);

  const handleInstallClick = async () => {
    if (isStandalone) return;

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      } catch {
        setShowInstallHelp(true);
      }
      return;
    }

    setShowInstallHelp(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("member");
      localStorage.removeItem("user");
      localStorage.removeItem("auth");
      sessionStorage.clear();
    } catch {}

    router.push(LOGOUT_ROUTE);
  };

  const ActionButton = ({
    label,
    onClick,
    variant = "default",
  }: {
    label: string;
    onClick: () => void;
    variant?: "default" | "primary" | "danger";
  }) => {
    const styles =
      variant === "primary"
        ? "bg-yellow-500 hover:bg-yellow-400 text-black"
        : variant === "danger"
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-white/10 hover:bg-white/15 text-white border border-white/10";

    return (
      <button
        onClick={onClick}
        className={`w-full rounded-2xl px-5 py-4 text-left text-base font-semibold transition duration-200 ${styles}`}
      >
        {label}
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-8">
        <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-500">
              Gym Ravana
            </p>
            <h1 className="mt-2 text-3xl font-bold">Member Access</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Quick access for scans, app install, account view, and logout.
            </p>
          </div>

          <div className="space-y-3">
            <ActionButton
              label="Entry Scan"
              variant="primary"
              onClick={() => router.push(ENTRY_SCAN_ROUTE)}
            />

            <ActionButton
              label="Exit Scan"
              onClick={() => router.push(EXIT_SCAN_ROUTE)}
            />

            <ActionButton
              label={isStandalone ? "App Installed" : "Install App"}
              onClick={handleInstallClick}
            />

            <ActionButton
              label="View Full Account"
              onClick={() => router.push(FULL_ACCOUNT_ROUTE)}
            />

            <ActionButton
              label="Logout"
              variant="danger"
              onClick={handleLogout}
            />
          </div>

          {!isStandalone && (
            <p className="mt-4 text-center text-xs text-zinc-500">
              Install this member app for faster access from your home screen.
            </p>
          )}
        </div>
      </div>

      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <h2 className="text-xl font-bold">{installGuide.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Since the direct install prompt is not available right now, follow
              these steps:
            </p>

            <div className="mt-4 rounded-2xl bg-white/5 p-4">
              <ol className="space-y-3 text-sm text-zinc-200">
                {installGuide.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-black">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => setShowInstallHelp(false)}
              className="mt-5 w-full rounded-2xl bg-yellow-500 px-4 py-3 font-semibold text-black transition hover:bg-yellow-400"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </main>
  );
}