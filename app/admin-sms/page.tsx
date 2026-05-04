"use client";

import PageTransition from "@/components/PageTransition";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SmsResultType = {
  success: boolean;
  message: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  failedMembers?: {
    id: string;
    name: string;
    phone: string;
    reason: string;
  }[];
};

export default function AdminSmsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [retryingFailed, setRetryingFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [result, setResult] = useState<SmsResultType | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
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
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }

          setError("Could not verify admin right now. Please try again.");
          return;
        }

        if (data.role !== "admin") {
          router.push("/dashboard");
          return;
        }
      } catch {
        setError("Failed to load SMS sender.");
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [router]);

  const handleSendSms = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!message.trim() || message.trim().length < 5) {
      setError("Please type a message with at least 5 characters.");
      return;
    }

    if (message.length > 300) {
      setError("Message is too long. Keep it under 300 characters.");
      return;
    }

    if (!confirmSend) {
      setError("Please tick the confirmation checkbox before sending.");
      return;
    }

    const confirmed = window.confirm(
      "This SMS will be sent to all members with phone numbers. Continue?"
    );

    if (!confirmed) return;

    try {
      setSending(true);
      setError("");
      setSuccessMessage("");
      setResult(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/bulk-member-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          confirm: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send SMS.");
        return;
      }

      setResult(data);
      setSuccessMessage(
        `SMS completed ✅ Sent: ${data.sent} / Failed: ${data.failed}`
      );
      setConfirmSend(false);
    } catch {
      setError("Something went wrong while sending SMS.");
    } finally {
      setSending(false);
    }
  };

  const handleRetryFailedSms = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/login");
    return;
  }

  if (!result?.failedMembers || result.failedMembers.length === 0) {
    setError("No failed members to retry.");
    return;
  }

  if (!message.trim() || message.trim().length < 5) {
    setError("Message is missing. Please keep the same message before retrying.");
    return;
  }

  const confirmed = window.confirm(
    `Retry SMS only for ${result.failedMembers.length} failed members?`
  );

  if (!confirmed) return;

  try {
    setRetryingFailed(true);
    setError("");
    setSuccessMessage("");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/retry-failed-member-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          confirm: true,
          memberIds: result.failedMembers.map((item) => item.id),
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to retry failed SMS.");
      return;
    }

    setResult(data);
    setSuccessMessage(
      `Retry completed ✅ Sent: ${data.sent} / Failed: ${data.failed}`
    );
  } catch {
    setError("Something went wrong while retrying failed SMS.");
  } finally {
    setRetryingFailed(false);
  }
};

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 shadow-2xl">
          Loading SMS sender...
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[80px] h-[280px] w-[280px] rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute right-[-100px] top-[140px] h-[240px] w-[240px] rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.14),transparent_35%)]" />
        </div>

        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <p className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
              Gym Ravana Admin Tool
            </p>

            <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              SMS Broadcast
            </h1>

            <p className="mt-4 text-sm leading-7 text-gray-300">
              Send one quick SMS to all current members who have a saved mobile number.
            </p>

            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm leading-7 text-yellow-100">
              This uses real SMS credits. Send only important gym updates, membership notices,
              access notices, or system update messages.
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-semibold text-green-300">
              {successMessage}
            </div>
          )}

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <label className="block text-[11px] font-bold uppercase tracking-[0.24em] text-red-400">
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
                setSuccessMessage("");
              }}
              maxLength={300}
              rows={7}
              placeholder="Example: Please keep an eye on SMS alerts for future gym updates, system updates, membership reminders, and access notifications. Thank you."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500"
            />

            <div className="mt-3 flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Final SMS will start with:{" "}
                <span className="font-bold text-white">GYM RAVANA:</span>
              </p>
              <p>{message.length}/300 characters</p>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={confirmSend}
                onChange={(e) => setConfirmSend(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                I understand this will send a real SMS to all members with saved phone numbers.
              </span>
            </label>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleSendSms}
                disabled={sending}
                className={`rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition ${
                  sending
                    ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {sending ? "Sending..." : "Send SMS To Members"}
              </button>

              <button
                onClick={() => router.push("/admin")}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Back To Admin
              </button>
            </div>
          </div>

          {result && (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-green-300">
                Send Result
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    Recipients
                  </p>
                  <p className="mt-2 text-3xl font-black text-white">
                    {result.totalRecipients}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
                    Sent
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-400">
                    {result.sent}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                    Failed
                  </p>
                  <p className="mt-2 text-3xl font-black text-red-400">
                    {result.failed}
                  </p>
                </div>
              </div>

{result.failedMembers && result.failedMembers.length > 0 && (
  <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-red-200">Failed members:</p>

      <button
        type="button"
        onClick={handleRetryFailedSms}
        disabled={retryingFailed}
        className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition ${
          retryingFailed
            ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {retryingFailed ? "Retrying..." : "Send Only To Failed"}
      </button>
    </div>

    <div className="mt-3 space-y-2 text-sm text-red-100">
      {result.failedMembers.slice(0, 20).map((item) => (
        <p key={`${item.id}-${item.phone}`}>
          {item.name} — {item.phone} — {item.reason}
        </p>
      ))}
    </div>
  </div>
)}
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}