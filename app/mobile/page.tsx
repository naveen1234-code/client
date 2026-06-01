"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

type UserType = {
  _id: string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  membershipStatus: string;
  membershipPlan: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  totalDays: number;
  remainingDays: number;
  attendanceCount: number;
  lastCheckIn: string | null;
  profilePicture?: string;
  mobileNumber?: string;
  fitnessGoals?: string;
  healthMetrics?: {
    weightLogs: Array<{ weight: number; date: string }>;
    bodyFatLogs: Array<{ bodyFat: number; date: string }>;
    muscleMassLogs: Array<{ muscleMass: number; date: string }>;
    hydrationLogs: Array<{ amount: number; date: string }>;
    sleepLogs: Array<{ quality: string; hours: number; date: string }>;
    progressPhotos: Array<{ url: string; date: string }>;
    measurementHistory?: Array<{
      timestamp: string;
      weight: number;
      bodyFat: number;
      muscleMass: number;
      chest: number;
      shoulders: number;
      waist: number;
      hips: number;
      leftBicep: number;
      rightBicep: number;
      leftThigh: number;
      rightThigh: number;
    }>;
  };
};

type TabType = "home" | "health" | "training" | "profile";

export default function MobileDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    mobileNumber: "",
    fitnessGoals: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Health metrics state
  const [healthModal, setHealthModal] = useState<{
    type: string;
    isOpen: boolean;
  }>({ type: "", isOpen: false });
  const [metricValue, setMetricValue] = useState("");
  const [metricQuality, setMetricQuality] = useState("good");
  const [loggingMetric, setLoggingMetric] = useState(false);

  // Full measurement form state
  const [measurementForm, setMeasurementForm] = useState({
    weight: "",
    bodyFat: "",
    muscleMass: "",
    chest: "",
    shoulders: "",
    waist: "",
    hips: "",
    leftBicep: "",
    rightBicep: "",
    leftThigh: "",
    rightThigh: "",
  });
  const [savingMeasurement, setSavingMeasurement] = useState(false);

  // AI Health Audit state
  const [aiAudit, setAiAudit] = useState<string | null>(null);
  const [loadingAiAudit, setLoadingAiAudit] = useState(false);

  // Training tab state
  const [dailyHydration, setDailyHydration] = useState(0);
  const [dailySleep, setDailySleep] = useState(0);
  const [savingTraining, setSavingTraining] = useState(false);

  // Profile picture upload state
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      setUser(userData);
      setProfileForm({
        fullName: userData.fullName || "",
        mobileNumber: userData.mobileNumber || "",
        fitnessGoals: userData.fitnessGoals || "",
      });
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPicture(true);
      setError("");

      // For now, we'll use a placeholder URL. In production, you'd upload to Cloudinary/S3
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile-picture`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePicture: base64String }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Failed to upload profile picture");
          return;
        }

        setSuccessMessage("Profile picture updated successfully ✅");
        await fetchUserData();
        setTimeout(() => setSuccessMessage(""), 3000);
      };

      reader.readAsDataURL(file);
    } catch {
      setError("Something went wrong while uploading profile picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setSavingProfile(true);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update profile");
        return;
      }

      setSuccessMessage("Profile updated successfully ✅");
      await fetchUserData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Something went wrong while updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogMetric = async () => {
    const token = localStorage.getItem("token");
    if (!token || !metricValue) return;

    try {
      setLoggingMetric(true);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/health-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: healthModal.type,
          value: metricValue,
          additionalData: healthModal.type === "sleep" ? { quality: metricQuality } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to log metric");
        return;
      }

      setSuccessMessage("Metric logged successfully ✅");
      setHealthModal({ type: "", isOpen: false });
      setMetricValue("");
      await fetchUserData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Something went wrong while logging metric");
    } finally {
      setLoggingMetric(false);
    }
  };

  const handleSaveFullMeasurement = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setSavingMeasurement(true);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/measurement-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: parseFloat(measurementForm.weight) || 0,
          bodyFat: parseFloat(measurementForm.bodyFat) || 0,
          muscleMass: parseFloat(measurementForm.muscleMass) || 0,
          chest: parseFloat(measurementForm.chest) || 0,
          shoulders: parseFloat(measurementForm.shoulders) || 0,
          waist: parseFloat(measurementForm.waist) || 0,
          hips: parseFloat(measurementForm.hips) || 0,
          leftBicep: parseFloat(measurementForm.leftBicep) || 0,
          rightBicep: parseFloat(measurementForm.rightBicep) || 0,
          leftThigh: parseFloat(measurementForm.leftThigh) || 0,
          rightThigh: parseFloat(measurementForm.rightThigh) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to save measurements");
        return;
      }

      setSuccessMessage("Measurements saved successfully ✅");
      setMeasurementForm({
        weight: "",
        bodyFat: "",
        muscleMass: "",
        chest: "",
        shoulders: "",
        waist: "",
        hips: "",
        leftBicep: "",
        rightBicep: "",
        leftThigh: "",
        rightThigh: "",
      });
      await fetchUserData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Something went wrong while saving measurements");
    } finally {
      setSavingMeasurement(false);
    }
  };

  const handleProgressPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/progress`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to upload progress photo");
        return;
      }

      setSuccessMessage("Progress photo uploaded successfully ✅");
      await fetchUserData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Something went wrong while uploading progress photo");
    }
  };

  const handleGenerateAIAudit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingAiAudit(true);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/ai-coach`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to generate AI audit");
        return;
      }

      setAiAudit(data.audit);
    } catch {
      setError("Something went wrong while generating AI audit");
    } finally {
      setLoadingAiAudit(false);
    }
  };

  const handleSaveTraining = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setSavingTraining(true);
      setError("");

      // Log hydration
      if (dailyHydration > 0) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/health-metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "hydration",
            value: dailyHydration.toString(),
          }),
        });
      }

      // Log sleep
      if (dailySleep > 0) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/health-metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "sleep",
            value: dailySleep.toString(),
            additionalData: { quality: "good" },
          }),
        });
      }

      setSuccessMessage("Training data saved successfully ✅");
      setDailyHydration(0);
      setDailySleep(0);
      await fetchUserData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Something went wrong while saving training data");
    } finally {
      setSavingTraining(false);
    }
  };

  const renderHomeTab = () => (
    <div className="space-y-6 pb-24">
      {/* Header with greeting and profile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Welcome Back,</p>
          <h1 className="text-2xl font-bold text-white">{user?.name || "Member"} 👋</h1>
        </div>
        <div className="relative">
          <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-green-500 bg-gray-800">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0B0B0F] bg-green-500" />
        </div>
      </div>

      {/* Access Card */}
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent p-6 shadow-lg shadow-red-500/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
          Your Access Key
        </p>
        <div className="mt-4 flex items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-6">
          <div className="text-center">
            <div className="mb-2 text-4xl">📱</div>
            <p className="text-sm text-gray-400">Scan QR at gym entrance</p>
            <p className="mt-2 text-xs text-gray-500">Member ID: {user?._id?.slice(-8)}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => router.push("/check-in")}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Scan Entry
          </button>
          <button
            onClick={() => router.push("/check-in")}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10"
          >
            Scan Exit
          </button>
        </div>
      </div>

      {/* Daily Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
          <div className="relative h-24 w-24">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#1f1f2e" strokeWidth="8" fill="none" />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#22c55e"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(user?.remainingDays || 0) / (user?.totalDays || 1) * 251} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user?.remainingDays || 0}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-gray-400">Remaining Days</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
          <div className="relative h-24 w-24">
            <svg className="h-full w-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#1f1f2e" strokeWidth="8" fill="none" />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#3b82f6"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${Math.min((user?.attendanceCount || 0) / 30 * 251, 251)} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user?.attendanceCount || 0}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-gray-400">Attendance</p>
        </div>
      </div>

      {/* Membership Status */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Membership Status
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-white">{user?.membershipPlan || "No Plan"}</p>
            <p className="text-sm text-gray-400">
              {user?.membershipEndDate
                ? `Expires: ${new Date(user.membershipEndDate).toLocaleDateString()}`
                : "No expiration date"}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              user?.membershipStatus === "active"
                ? "bg-green-500/20 text-green-400"
                : user?.membershipStatus === "expired"
                ? "bg-red-500/20 text-red-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {user?.membershipStatus}
          </span>
        </div>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Health & Progress</h1>
        <p className="text-sm text-gray-400">Track your fitness journey</p>
      </div>

      {/* Body Metrics Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-[#16161F] p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {user?.healthMetrics?.weightLogs?.[0]?.weight || "--"}
          </p>
          <p className="text-xs text-gray-400">Weight (kg)</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#16161F] p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {user?.healthMetrics?.bodyFatLogs?.[0]?.bodyFat || "--"}
          </p>
          <p className="text-xs text-gray-400">Body Fat %</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#16161F] p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {user?.healthMetrics?.muscleMassLogs?.[0]?.muscleMass || "--"}
          </p>
          <p className="text-xs text-gray-400">Muscle (kg)</p>
        </div>
      </div>

      {/* Full Measurement Form */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Full Body Measurements</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.weight}
              onChange={(e) => setMeasurementForm({ ...measurementForm, weight: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Body Fat %</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.bodyFat}
              onChange={(e) => setMeasurementForm({ ...measurementForm, bodyFat: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Muscle Mass (kg)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.muscleMass}
              onChange={(e) => setMeasurementForm({ ...measurementForm, muscleMass: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Chest (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.chest}
              onChange={(e) => setMeasurementForm({ ...measurementForm, chest: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Shoulders (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.shoulders}
              onChange={(e) => setMeasurementForm({ ...measurementForm, shoulders: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Waist (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.waist}
              onChange={(e) => setMeasurementForm({ ...measurementForm, waist: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Hips (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.hips}
              onChange={(e) => setMeasurementForm({ ...measurementForm, hips: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Left Bicep (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.leftBicep}
              onChange={(e) => setMeasurementForm({ ...measurementForm, leftBicep: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Right Bicep (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.rightBicep}
              onChange={(e) => setMeasurementForm({ ...measurementForm, rightBicep: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Left Thigh (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.leftThigh}
              onChange={(e) => setMeasurementForm({ ...measurementForm, leftThigh: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Right Thigh (cm)</label>
            <input
              type="number"
              step="0.1"
              value={measurementForm.rightThigh}
              onChange={(e) => setMeasurementForm({ ...measurementForm, rightThigh: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none text-sm"
              placeholder="0"
            />
          </div>
        </div>
        <button
          onClick={handleSaveFullMeasurement}
          disabled={savingMeasurement}
          className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingMeasurement ? "Saving..." : "Save Measurements"}
        </button>
      </div>

      {/* Before & After Image Comparison */}
      {user?.healthMetrics?.progressPhotos && user.healthMetrics.progressPhotos.length >= 2 && (
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
          <p className="mb-4 text-sm font-semibold text-gray-400">Before & After Comparison</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">Earliest Photo</p>
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <img
                  src={user.healthMetrics.progressPhotos[0].url}
                  alt="Before"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {new Date(user.healthMetrics.progressPhotos[0].date).toLocaleDateString()}
              </p>
              {user.healthMetrics.measurementHistory?.[0] && (
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p>Weight: {user.healthMetrics.measurementHistory[0].weight} kg</p>
                  <p>Body Fat: {user.healthMetrics.measurementHistory[0].bodyFat}%</p>
                  <p>Waist: {user.healthMetrics.measurementHistory[0].waist} cm</p>
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">Latest Photo</p>
              <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <img
                  src={user.healthMetrics.progressPhotos[user.healthMetrics.progressPhotos.length - 1].url}
                  alt="After"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {new Date(user.healthMetrics.progressPhotos[user.healthMetrics.progressPhotos.length - 1].date).toLocaleDateString()}
              </p>
              {user.healthMetrics.measurementHistory?.[user.healthMetrics.measurementHistory.length - 1] && (
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p>Weight: {user.healthMetrics.measurementHistory[user.healthMetrics.measurementHistory.length - 1].weight} kg</p>
                  <p>Body Fat: {user.healthMetrics.measurementHistory[user.healthMetrics.measurementHistory.length - 1].bodyFat}%</p>
                  <p>Waist: {user.healthMetrics.measurementHistory[user.healthMetrics.measurementHistory.length - 1].waist} cm</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Health Engine Audit */}
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-red-400">🤖 AI HEALTH ENGINE AUDIT</p>
          <button
            onClick={handleGenerateAIAudit}
            disabled={loadingAiAudit}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAiAudit ? "Analyzing..." : "Generate Audit"}
          </button>
        </div>
        {loadingAiAudit ? (
          <div className="space-y-3">
            <div className="h-4 animate-pulse rounded bg-white/10" />
            <div className="h-4 animate-pulse rounded bg-white/10" />
            <div className="h-4 animate-pulse rounded bg-white/10" />
          </div>
        ) : aiAudit ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="whitespace-pre-wrap text-sm text-gray-300">{aiAudit}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Click "Generate Audit" to get personalized AI fitness feedback based on your measurement history.</p>
        )}
      </div>

      {/* Progress Photo Upload */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Upload Progress Photo</p>
        <label className="flex w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/40 px-4 py-8 transition hover:border-red-500/30">
          <div className="text-center">
            <span className="text-3xl">📸</span>
            <p className="mt-2 text-sm text-gray-400">Tap to upload photo</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleProgressPhotoUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Progress Photos Grid */}
      {user?.healthMetrics?.progressPhotos && user.healthMetrics.progressPhotos.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-400">Progress Photos</p>
          <div className="grid grid-cols-3 gap-3">
            {user.healthMetrics.progressPhotos.slice(0, 6).map((photo, index) => (
              <div key={index} className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#16161F]">
                <img src={photo.url} alt={`Progress ${index + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Training</h1>
        <p className="text-sm text-gray-400">Track your daily habits</p>
      </div>

      {/* Hydration Tracker */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💧</span>
            <div>
              <p className="font-semibold text-white">Daily Hydration</p>
              <p className="text-xs text-gray-400">Goal: 8 glasses (2L)</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-400">{dailyHydration} / 8</p>
        </div>
        <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
            style={{ width: `${Math.min((dailyHydration / 8) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDailyHydration(Math.max(0, dailyHydration - 1))}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-blue-500/30 hover:bg-blue-500/10"
          >
            -1 Glass
          </button>
          <button
            onClick={() => setDailyHydration(Math.min(8, dailyHydration + 1))}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            +1 Glass
          </button>
        </div>
      </div>

      {/* Sleep Tracker */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">😴</span>
          <div>
            <p className="font-semibold text-white">Sleep Hours</p>
            <p className="text-xs text-gray-400">Log your daily sleep</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-400">Hours slept today</label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={dailySleep}
            onChange={(e) => setDailySleep(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>0h</span>
            <span className="text-lg font-bold text-purple-400">{dailySleep}h</span>
            <span>12h</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs text-gray-400">
            {dailySleep < 6
              ? "⚠️ Low sleep - aim for 7-9 hours for optimal recovery"
              : dailySleep >= 7 && dailySleep <= 9
              ? "✅ Optimal sleep range for muscle recovery"
              : dailySleep > 9
              ? "💤 Extended sleep - ensure you're maintaining consistency"
              : "Track your sleep to optimize recovery"}
          </p>
        </div>
      </div>

      {/* Daily Checklist */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Daily Checklist</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏋️</span>
              <span className="text-sm font-semibold text-white">Workout Completed</span>
            </div>
            <input type="checkbox" className="h-5 w-5 accent-red-500" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🥗</span>
              <span className="text-sm font-semibold text-white">Healthy Meals</span>
            </div>
            <input type="checkbox" className="h-5 w-5 accent-red-500" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🧘</span>
              <span className="text-sm font-semibold text-white">Stretching</span>
            </div>
            <input type="checkbox" className="h-5 w-5 accent-red-500" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveTraining}
        disabled={savingTraining || (dailyHydration === 0 && dailySleep === 0)}
        className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {savingTraining ? "Saving..." : "Save Daily Training Data"}
      </button>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm text-gray-400">Manage your account</p>
      </div>

      {/* Profile Picture Upload */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Profile Picture</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-red-500 bg-gray-800">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">
                  👤
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
              <span className="text-sm">📷</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={uploadingPicture}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="font-semibold text-white">{user?.name || "Member"}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Account Details Form */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Account Details</p>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Full Name
            </label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-gray-400 placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Phone Number
            </label>
            <input
              type="tel"
              value={profileForm.mobileNumber}
              onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Fitness Goals
            </label>
            <textarea
              value={profileForm.fitnessGoals}
              onChange={(e) => setProfileForm({ ...profileForm, fitnessGoals: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none resize-none"
              rows={3}
              placeholder="Describe your fitness goals"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* PWA Install Button */}
      <button
        onClick={() => {
          // Trigger PWA install prompt if available
          const deferredPrompt = (window as any).deferredPrompt;
          if (deferredPrompt) {
            deferredPrompt.prompt();
          }
        }}
        className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-[#16161F] p-4 transition hover:border-red-500/30"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📲</span>
          <span className="font-semibold text-white">Install App</span>
        </div>
        <span className="text-gray-400">→</span>
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-between rounded-3xl border border-red-500/30 bg-red-500/10 p-4 transition hover:bg-red-500/20"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚪</span>
          <span className="font-semibold text-red-400">Logout</span>
        </div>
        <span className="text-red-400">→</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0B0F] text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#0B0B0F] text-white">
        {/* Background Effects */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-red-600/10 blur-3xl" />
          <div className="absolute right-[-100px] bottom-[-100px] h-[300px] w-[300px] rounded-full bg-red-600/5 blur-3xl" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0B0F]/80 backdrop-blur-lg px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              <span className="text-red-500">GYM</span>
              <span className="text-white">RAVANA</span>
            </h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Desktop View
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 py-6">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300">
              {successMessage}
            </div>
          )}

          {activeTab === "home" && renderHomeTab()}
          {activeTab === "health" && renderHealthTab()}
          {activeTab === "training" && renderTrainingTab()}
          {activeTab === "profile" && renderProfileTab()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B0B0F]/95 backdrop-blur-lg">
          <div className="flex justify-around px-2 py-2">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center px-4 py-2 transition ${
                activeTab === "home" ? "text-red-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl">🏠</span>
              <span className="mt-1 text-xs font-semibold">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("health")}
              className={`flex flex-col items-center px-4 py-2 transition ${
                activeTab === "health" ? "text-red-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl">❤️</span>
              <span className="mt-1 text-xs font-semibold">Health</span>
            </button>

            <button
              onClick={() => setActiveTab("training")}
              className={`flex flex-col items-center px-4 py-2 transition ${
                activeTab === "training" ? "text-red-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl">💪</span>
              <span className="mt-1 text-xs font-semibold">Training</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center px-4 py-2 transition ${
                activeTab === "profile" ? "text-red-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl">👤</span>
              <span className="mt-1 text-xs font-semibold">Profile</span>
            </button>
          </div>
        </nav>

        {/* Health Metric Modal */}
        {healthModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#16161F] p-6">
              <h2 className="mb-4 text-xl font-bold text-white">
                Log {healthModal.type === "weight" && "Weight"}
                {healthModal.type === "hydration" && "Hydration"}
                {healthModal.type === "sleep" && "Sleep"}
                {healthModal.type === "progressPhoto" && "Progress Photo"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-400">
                    {healthModal.type === "weight" && "Weight (kg)"}
                    {healthModal.type === "hydration" && "Amount (L)"}
                    {healthModal.type === "sleep" && "Hours"}
                    {healthModal.type === "progressPhoto" && "Photo URL"}
                  </label>
                  <input
                    type={healthModal.type === "progressPhoto" ? "url" : "number"}
                    step="0.1"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
                    placeholder="Enter value"
                  />
                </div>

                {healthModal.type === "sleep" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-400">
                      Sleep Quality
                    </label>
                    <select
                      value={metricQuality}
                      onChange={(e) => setMetricQuality(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-red-500/50 focus:outline-none"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setHealthModal({ type: "", isOpen: false })}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogMetric}
                    disabled={loggingMetric || !metricValue}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loggingMetric ? "Logging..." : "Log"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
