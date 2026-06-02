"use client";

import PageTransition from "@/components/PageTransition";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { getToken } from "@/lib/auth";
import { initOfflineQueue, queueRequest, retryQueuedRequests } from "@/lib/offlineQueue";

type UserType = {
  name: string;
  email: string;
  membershipStatus: string;
  membershipPlan: string;
  remainingDays: number;
  attendanceCount: number;
  lastCheckIn: string | null;
  isInsideGym?: boolean;
  lastEntryAt?: string | null;
  lastExitAt?: string | null;
};

type AccessMode = "entry" | "exit";
type DoorCommandStatus =
  | "pending"
  | "claimed"
  | "unlocked"
  | "busy"
  | "failed"
  | "rejected_door_open"
  | "rejected_unknown_action"
  | "duplicate_ignored"
  | "restarting"
  | "online"
  | "completed"
  | "expired";

type DoorCommandStatusResponse = {
  success?: boolean;
  status?: DoorCommandStatus | string;
  message?: string;
  user?: UserType;
  command?: {
    id?: string;
    status?: string;
    deviceMessage?: string;
  };
};

export default function CheckInPage() {
  const router = useRouter();
  

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRunningRef = useRef(false);
  const scanLockRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unlockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AccessMode>("entry");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [doorSessionId, setDoorSessionId] = useState<string | null>(null);
  const [doorCommandId, setDoorCommandId] = useState<string | null>(null);
const [doorUnlockStatus, setDoorUnlockStatus] = useState<string>("");
  const [scannerStarted, setScannerStarted] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [scannerPulse, setScannerPulse] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [cameraPreWarmed, setCameraPreWarmed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);

  const fetchUser = async () => {
    const token = getToken();

    console.log("Auth State at Scanner Trigger:", token ? "Token found" : "No token");

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
        localStorage.removeItem("userRole");
        router.push("/login");
        return;
      }

      setUser(data);
    } catch {
      setError("Failed to load your member profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
  const handler = (e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e);
  };

  window.addEventListener("beforeinstallprompt", handler as EventListener);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler as EventListener);
  };
}, []);

  useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const modeFromUrl = params.get("mode");

  if (modeFromUrl === "entry" || modeFromUrl === "exit") {
    setMode(modeFromUrl);
  }
}, []);

  useEffect(() => {
    let pulseInterval: NodeJS.Timeout | null = null;

    if (scannerStarted) {
      setScannerPulse(true);
      pulseInterval = setInterval(() => {
        setScannerPulse((prev) => !prev);
      }, 900);
    } else {
      setScannerPulse(false);
    }

    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
    };
  }, [scannerStarted]);

  // Background camera pre-warm on app load
  useEffect(() => {
    const preWarmCamera = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
          // Request camera permission and initialize stream in background
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          
          // Stop the stream immediately to release camera but keep permission granted
          stream.getTracks().forEach(track => track.stop());
          
          setCameraPreWarmed(true);
          console.log("Camera pre-warmed successfully");
        }
      } catch (err) {
        console.log("Camera pre-warm failed:", err);
        // Don't show error, just mark as not pre-warmed
        setCameraPreWarmed(false);
      }
    };

    preWarmCamera();
  }, []);

  // Initialize offline queue and monitor network status
  useEffect(() => {
    const initOffline = async () => {
      await initOfflineQueue();
      
      // Check initial online status
      setIsOnline(navigator.onLine);
      
      // Monitor online/offline events
      const handleOnline = async () => {
        setIsOnline(true);
        setSyncingOffline(true);
        console.log("Network restored, syncing offline requests...");
        await retryQueuedRequests();
        setSyncingOffline(false);
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        console.log("Network lost, requests will be queued");
      };
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    };
    
    initOffline();
  }, []);

  const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const isFinalSuccessStatus = (status: string) => {
  return status === "unlocked" || status === "completed";
};

const isFinalFailureStatus = (status: string) => {
  return [
    "busy",
    "failed",
    "expired",
    "rejected_door_open",
    "rejected_unknown_action",
  ].includes(status);
};

const waitForDoorCommandResult = async (
  commandId: string,
  token: string
): Promise<DoorCommandStatusResponse> => {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/access/command-status/${commandId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: DoorCommandStatusResponse = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to check door unlock status.");
    }

    const status = String(data.status || "").toLowerCase();

    setDoorUnlockStatus(status);
    setMessage(data.message || "Unlocking door...");

    if (isFinalSuccessStatus(status)) {
      return data;
    }

    if (isFinalFailureStatus(status)) {
      throw new Error(data.message || "Unlock failed. Please scan again.");
    }

    await sleep(900);
  }

  throw new Error("Unlock failed. Please scan again.");
};

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRunningRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch (err) {
      console.log("Scanner stop warning:", err);
    } finally {
      scannerRunningRef.current = false;
      setScannerStarted(false);
    }
  };

  const handleAccessAction = async (scannedValue: string, action: "entry" | "exit") => {
  const token = getToken();

  if (!token) {
    router.push("/login");
    return;
  }

  try {
    // Clear verifying state when network request starts
    setVerifying(false);
    setMessage("");
    setError("");
    setDoorCommandId(null);
    setDoorUnlockStatus("");

    const endpoint =
      action === "entry"
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-in`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-out`;

    const body = JSON.stringify({
      scannedQrValue: scannedValue,
      accessPoint: "main-door",
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Try network request first
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
      });
    } catch (networkError) {
      // Network failed - queue request for offline sync
      console.log("Network error, queuing request for offline sync");
      await queueRequest(endpoint, "POST", headers, body);
      setMessage("Offline: Scan saved. Will sync when connection is restored.");
      setSuccessState(true);
      setRedirecting(true);
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      // Treat "Already checked in today" as success
      if (data.message && data.message.includes("Already checked in")) {
        setMessage("Welcome back! You've already checked in today.");
        setSuccessState(true);
        setRedirecting(true);
        redirectTimeoutRef.current = setTimeout(() => {
          router.push("/dashboard");
        }, 2200);
        return;
      }

      setError(data.message || `${action === "entry" ? "Entry" : "Exit"} failed`);

      unlockTimeoutRef.current = setTimeout(() => {
        scanLockRef.current = false;
      }, 1800);

      return;
    }

    if (data.doorSessionId) {
      setDoorSessionId(data.doorSessionId);
      console.log("Door Session ID:", data.doorSessionId);
    }

    if (!data.commandId) {
      throw new Error("Door command was not created. Please scan again.");
    }

    setDoorCommandId(data.commandId);
    setDoorUnlockStatus("pending");
    setMessage(data.message || "Unlocking door...");

    const finalResult = await waitForDoorCommandResult(data.commandId, token);

    if (finalResult.user) {
      setUser(finalResult.user);
    } else {
      await fetchUser();
    }

    setMessage(
      finalResult.message || "Check-in successful!"
    );

    setSuccessState(true);
    setRedirecting(true);

    redirectTimeoutRef.current = setTimeout(() => {
      router.push("/dashboard");
    }, 2200);
  } catch (err: any) {
    setError(
      err?.message || "Invalid code, please scan the Gym Entrance QR."
    );

    setSuccessState(false);
    setRedirecting(false);

    unlockTimeoutRef.current = setTimeout(() => {
      scanLockRef.current = false;
    }, 2200);
  }
};

  const startScanner = async () => {
    try {
      console.log("Starting scanner - Auth check:", getToken() ? "Token valid" : "No token");
      
      setError("");
      setMessage("");
      setSuccessState(false);
      setRedirecting(false);
      setVerifying(false);
      setDoorSessionId(null);
      setDoorCommandId(null);
setDoorUnlockStatus("");

      scanLockRef.current = false;

      if (scannerRef.current) {
        try {
          await stopScanner();
        } catch {}
      }

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (scanLockRef.current) return;

          const trimmedText = decodedText.trim();

          // Entry-only logic - only accept ENTRY QR
          if (trimmedText === "GYM_RAVANA_ENTRY") {
            scanLockRef.current = true;
            
            // Haptic feedback - vibrate immediately on successful decode
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            // Optimistic UI - show verifying status immediately
            setVerifying(true);
            setMessage("Verifying...");
            
            // UI pulse effect for visual confirmation
            setScanPulse(true);
            setTimeout(() => setScanPulse(false), 300);
            
            await stopScanner();
            await handleAccessAction(trimmedText, "entry");
          } else {
            setError("Invalid code, please scan the Gym Entrance QR.");
            scanLockRef.current = true;
            setTimeout(() => {
              scanLockRef.current = false;
            }, 2000);
          }
        },
        () => {}
      );

      scannerRunningRef.current = true;
      setScannerStarted(true);
    } catch {
      scanLockRef.current = false;
      setError("Camera failed to start. Please allow camera access.");
    }
  };

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (unlockTimeoutRef.current) clearTimeout(unlockTimeoutRef.current);
      stopScanner();
    };
  }, []);

  const handleInstallAccessApp = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    setDeferredPrompt(null);
    return;
  }

  setShowInstallHelp(true);
};

  const handleSwitchMode = async (newMode: AccessMode) => {
    if (scannerStarted) {
      await stopScanner();
    }

    setMode(newMode);
    setError("");
    setMessage("");
    setSuccessState(false);
    setRedirecting(false);
    setDoorSessionId(null);
    setDoorCommandId(null);
setDoorUnlockStatus("");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl">
          <p className="text-lg tracking-wide text-gray-300">Loading scanner...</p>
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
                Gym Ravana Access System
              </p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Scan QR
                <span className="block text-red-500">
                  Enter. Train.
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                {!isOnline && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                    Offline - Scans will sync when back online
                  </span>
                )}
                {" Scan the official ENTRY QR to access the gym, record attendance, and update membership usage."}
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/40 hover:bg-red-500/10"
            >
              Back to Dashboard
            </button>

            <button
  onClick={handleInstallAccessApp}
  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/40 hover:bg-red-500/10"
>
  Install Access App
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
                    Open the camera, point it at the ENTRY QR, and your access will process automatically.
                  </p>
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] transition-all duration-500 ${
                    scannerStarted
                      ? scannerPulse
                        ? "border border-green-400/40 bg-green-500/15 text-green-300 shadow-[0_0_30px_rgba(34,197,94,0.22)]"
                        : "border border-green-500/25 bg-green-500/10 text-green-400"
                      : "border border-white/10 bg-white/5 text-gray-300"
                  }`}
                >
                  {scannerStarted ? "Camera Live" : "Scanner Idle"}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/70 p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.14),transparent_45%)]" />

                <div
                  className={`relative mb-4 rounded-[24px] border bg-black p-3 transition-all duration-500 ${
                    scannerStarted
                      ? "border-red-500/30 shadow-[0_0_60px_rgba(255,0,0,0.16)]"
                      : "border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.03)]"
                  }`}
                >
                  <div
                    id="reader"
                    className="min-h-[320px] overflow-hidden rounded-[20px] border border-white/10 bg-black"
                  />
                </div>

                <div className="relative flex flex-col gap-3 sm:flex-row">
                  {!scannerStarted && !redirecting ? (
                    <button
                      onClick={startScanner}
                      disabled={!isOnline && !cameraPreWarmed}
                      className={`w-full rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(255,0,0,0.4)] transition duration-300 hover:scale-[1.01] ${
                        !isOnline && !cameraPreWarmed
                          ? "cursor-not-allowed bg-gray-600 opacity-50"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {isOnline ? "Scan QR" : "Scan QR (Offline Mode)"}
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

                {redirecting && (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-green-300">
                    Scan locked. Processing successful access...
                  </p>
                )}

                {(message || error) && (
                  <div
                    className={`mt-5 rounded-2xl border px-4 py-4 transition-all duration-500 ${
                      error
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-green-500/30 bg-green-500/10 text-green-300"
                    }`}
                  >
                    <p className="text-sm font-semibold tracking-wide">{error || message}</p>
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
                      {message.includes("already checked in") ? "Welcome Back ✅" : "Check-in Successful ✅"}
                    </p>

                    {doorSessionId && (
  <p className="mt-2 text-xs text-gray-400">Session ID: {doorSessionId}</p>
)}

{doorCommandId && (
  <p className="mt-1 text-xs text-gray-400">Command ID: {doorCommandId}</p>
)}

{doorUnlockStatus && (
  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-200/80">
    Door Status: {doorUnlockStatus}
  </p>
)}

                    <p className="mt-2 text-sm text-green-200/90">
                      Camera closed automatically. Your access action is now recorded.
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
                          Current Presence
                        </p>
                        <p className="mt-2 text-xl font-bold text-blue-400">
                          {user.isInsideGym ? "Inside Gym" : "Outside Gym"}
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

                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                          Last Entry
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {user.lastEntryAt
                            ? new Date(user.lastEntryAt).toLocaleString()
                            : "No entry yet"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                          Last Exit
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {user.lastExitAt
                            ? new Date(user.lastExitAt).toLocaleString()
                            : "No exit yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No member data found.</p>
                )}
              </div>

              {showInstallHelp && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4">
    <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
        Access App
      </p>

      <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
        Install on Your Phone
      </h3>

      <p className="mt-4 text-sm leading-7 text-gray-300">
        For iPhone, open this page in Safari, tap Share, then choose “Add to Home Screen”.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300">
        <p>1. Open this page in Safari</p>
        <p>2. Tap the Share button</p>
        <p>3. Tap “Add to Home Screen”</p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setShowInstallHelp(false)}
          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
        >
          Got It
        </button>
      </div>
    </div>
  </div>
)}

              <div className="rounded-[30px] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-6 shadow-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Access Rule
                </p>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  Entry only works with an active membership, correct ENTRY QR, and if you are not already inside. A valid entry records attendance and reduces one remaining day only once per day.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}

