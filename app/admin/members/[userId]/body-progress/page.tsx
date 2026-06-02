"use client";

import PageTransition from "@/components/PageTransition";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  getBodyProgressStatusUser,
  getBodyProgressUser,
  getApiErrorMessage,
  isApiError,
  updateBodyProgressUser,
  uploadBodyProgressUser,
} from "@/lib/api";

type Entry = {
  _id: string;
  recordedAt: string;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  photos: Array<{ kind: "front" | "side" | "back"; url: string; publicId: string }>;
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const pickPhotoUrl = (entry: Entry | null, kind: "front" | "side" | "back") => {
  if (!entry) return "";
  return entry.photos?.find((p) => p.kind === kind)?.url || "";
};

export default function AdminMemberBodyProgressPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [baseline, setBaseline] = useState<Entry | null>(null);
  const [latest, setLatest] = useState<Entry | null>(null);

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [recordedAt, setRecordedAt] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [chestCm, setChestCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [armCm, setArmCm] = useState("");
  const [thighCm, setThighCm] = useState("");

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [sideFile, setSideFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setRecordedAt("");
    setWeightKg("");
    setChestCm("");
    setWaistCm("");
    setHipsCm("");
    setArmCm("");
    setThighCm("");
    setFrontFile(null);
    setSideFile(null);
    setBackFile(null);
  };

  const load = async () => {
    if (!userId) return;

    setError("");
    setLoading(true);
    try {
      const [list, status] = await Promise.all([
        getBodyProgressUser(userId),
        getBodyProgressStatusUser(userId),
      ]);
      setEntries((list.entries || []) as Entry[]);
      setBaseline(status.baseline as Entry | null);
      setLatest(status.latest as Entry | null);
    } catch (e: unknown) {
      if (isApiError(e) && (e.status === 401 || e.status === 403)) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setError(getApiErrorMessage(e, "Failed to load member body progress"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, userId]);

  const currentStatusRows = useMemo(() => {
    const rows = [
      { label: "Weight (kg)", a: baseline?.weightKg ?? null, b: latest?.weightKg ?? null },
      { label: "Chest (cm)", a: baseline?.chestCm ?? null, b: latest?.chestCm ?? null },
      { label: "Waist (cm)", a: baseline?.waistCm ?? null, b: latest?.waistCm ?? null },
      { label: "Hips (cm)", a: baseline?.hipsCm ?? null, b: latest?.hipsCm ?? null },
      { label: "Arm (cm)", a: baseline?.armCm ?? null, b: latest?.armCm ?? null },
      { label: "Thigh (cm)", a: baseline?.thighCm ?? null, b: latest?.thighCm ?? null },
    ];
    return rows;
  }, [baseline, latest]);

  const startEdit = (entry: Entry) => {
    setEditingId(entry._id);
    setRecordedAt(entry.recordedAt ? new Date(entry.recordedAt).toISOString().slice(0, 10) : "");
    setWeightKg(entry.weightKg === null ? "" : String(entry.weightKg));
    setChestCm(entry.chestCm === null ? "" : String(entry.chestCm));
    setWaistCm(entry.waistCm === null ? "" : String(entry.waistCm));
    setHipsCm(entry.hipsCm === null ? "" : String(entry.hipsCm));
    setArmCm(entry.armCm === null ? "" : String(entry.armCm));
    setThighCm(entry.thighCm === null ? "" : String(entry.thighCm));
    setFrontFile(null);
    setSideFile(null);
    setBackFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");

    try {
      const form = new FormData();
      if (recordedAt) form.append("recordedAt", recordedAt);
      form.append("weightKg", weightKg);
      form.append("chestCm", chestCm);
      form.append("waistCm", waistCm);
      form.append("hipsCm", hipsCm);
      form.append("armCm", armCm);
      form.append("thighCm", thighCm);

      if (frontFile) form.append("front", frontFile);
      if (sideFile) form.append("side", sideFile);
      if (backFile) form.append("back", backFile);

      if (editingId) {
        await updateBodyProgressUser(userId, editingId, form);
      } else {
        await uploadBodyProgressUser(userId, form);
      }

      resetForm();
      await load();
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <main className="min-h-screen bg-black px-4 py-10 text-white">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-black uppercase tracking-tight">Member Body Progress</h1>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Member Body Progress
              </h1>
              <p className="mt-2 text-sm text-gray-400 break-all">
                User ID: {userId}
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-200 hover:bg-white/10"
            >
              Back
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-xl font-black uppercase tracking-tight">Current Status</h2>
            <p className="mt-1 text-sm text-gray-400">
              Baseline ({baseline ? formatDate(baseline.recordedAt) : "—"}) vs Latest (
              {latest ? formatDate(latest.recordedAt) : "—"})
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {(["front", "side", "back"] as const).map((kind) => (
                <div key={kind} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    {kind} (baseline / latest)
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/60">
                      {pickPhotoUrl(baseline, kind) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={`Baseline ${kind}`}
                          src={pickPhotoUrl(baseline, kind)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/60">
                      {pickPhotoUrl(latest, kind) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={`Latest ${kind}`}
                          src={pickPhotoUrl(latest, kind)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          No photo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-black/50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                <div>Measurement</div>
                <div>Baseline</div>
                <div>Latest</div>
              </div>
              {currentStatusRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-white/10 px-4 py-3 text-sm"
                >
                  <div className="text-gray-200">{row.label}</div>
                  <div className="text-gray-400">{row.a ?? "—"}</div>
                  <div className="text-gray-400">{row.b ?? "—"}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {editingId ? "Edit Entry" : "Add Entry"}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Admin can add or update member’s measurements and photos.
                </p>
              </div>
              {editingId ? (
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-200 hover:bg-black/60"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                  Date
                </label>
                <input
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                  Weight (kg)
                </label>
                <input
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-red-500/50"
                  placeholder="e.g. 75.5"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Chest (cm)", v: chestCm, s: setChestCm },
                { label: "Waist (cm)", v: waistCm, s: setWaistCm },
                { label: "Hips (cm)", v: hipsCm, s: setHipsCm },
                { label: "Arm (cm)", v: armCm, s: setArmCm },
                { label: "Thigh (cm)", v: thighCm, s: setThighCm },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    {f.label}
                  </label>
                  <input
                    value={f.v}
                    onChange={(e) => f.s(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-red-500/50"
                    placeholder="optional"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "Front photo", set: setFrontFile, kind: "front" },
                { label: "Side photo", set: setSideFile, kind: "side" },
                { label: "Back photo", set: setBackFile, kind: "back" },
              ].map((p) => (
                <div key={p.kind} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    {p.label}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => p.set(e.target.files?.[0] || null)}
                    className="mt-3 block w-full text-sm text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.2em] file:text-white hover:file:bg-white/20"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-white hover:bg-red-500 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Save Entry"}
              </button>
              <button
                onClick={load}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-gray-200 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-xl font-black uppercase tracking-tight">History</h2>
            <p className="mt-1 text-sm text-gray-400">Tap an entry to edit it.</p>

            {entries.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-gray-400">
                No entries for this member yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {entries.map((e) => (
                  <button
                    key={e._id}
                    onClick={() => startEdit(e)}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left hover:bg-black/55"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white">
                        {formatDate(e.recordedAt)}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Weight: {e.weightKg ?? "—"}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {(["front", "side", "back"] as const).map((kind) => (
                        <div
                          key={kind}
                          className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/60"
                        >
                          {pickPhotoUrl(e, kind) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={`${kind} preview`}
                              src={pickPhotoUrl(e, kind)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[11px] text-gray-500">
                              —
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </PageTransition>
  );
}

