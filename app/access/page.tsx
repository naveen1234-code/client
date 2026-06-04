"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import PageTransition from "@/components/PageTransition";
import Image from 'next/image';

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
  height?: string;
  weight?: string;
  healthMetrics?: {
    targetWeight?: number;
    bmi?: number;
    beforeAfterMeasurements?: {
      before?: {
        weight?: number;
        chest?: number;
        waist?: number;
        leftArm?: number;
        rightArm?: number;
        leftLeg?: number;
        rightLeg?: number;
        timestamp?: string;
      };
      after?: {
        weight?: number;
        chest?: number;
        waist?: number;
        leftArm?: number;
        rightArm?: number;
        leftLeg?: number;
        rightLeg?: number;
        timestamp?: string;
      };
    };
    beforeAfterPhotos?: {
      before?: {
        front?: { url?: string; publicId?: string; timestamp?: string };
        back?: { url?: string; publicId?: string; timestamp?: string };
        side?: { url?: string; publicId?: string; timestamp?: string };
      };
      after?: {
        front?: { url?: string; publicId?: string; timestamp?: string };
        back?: { url?: string; publicId?: string; timestamp?: string };
        side?: { url?: string; publicId?: string; timestamp?: string };
      };
    };
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
    height: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [checklist, setChecklist] = useState({
  workout: false,
  meals: false,
  stretching: false,
});

  // Health metrics state
  const [healthModal, setHealthModal] = useState<{
    type: string;
    isOpen: boolean;
  }>({ type: "", isOpen: false });
  const [metricValue, setMetricValue] = useState("");
  const [metricQuality, setMetricQuality] = useState("good");
  const [loggingMetric, setLoggingMetric] = useState(false);

  // Full measurement form state (simplified to 5 key metrics)

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

  // Before/after measurements state
  const [measurementForms, setMeasurementForms] = useState({
    before: { weight: "", chest: "", waist: "", leftArm: "", rightArm: "", leftLeg: "", rightLeg: "" },
    after: { weight: "", chest: "", waist: "", leftArm: "", rightArm: "", leftLeg: "", rightLeg: "" },
  });

  // Target weight state
  const [targetWeight, setTargetWeight] = useState("");

  // Before/after photos state
  const [expandedPhoto, setExpandedPhoto] = useState<{ url: string; type: string; view: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Manual BMI States
  const [manualBMI, setManualBMI] = useState<{ bmi: number; category: string } | null>(null);
  const [bmiWeight, setBmiWeight] = useState("");
  const [bmiHeight, setBmiHeight] = useState("");
  const [bmiAge, setBmiAge] = useState("");

  // Manual Body Fat States (Navy Seal Formula)
  const [bfGender, setBfGender] = useState<"male" | "female">("male");
  const [bfHeight, setBfHeight] = useState("");
  const [bfNeck, setBfNeck] = useState("");
  const [bfWaist, setBfWaist] = useState("");
  const [bfHip, setBfHip] = useState("");
  const [manualBF, setManualBF] = useState<number | null>(null);

  // --- MANUAL CALCULATION HANDLERS ---
  const handleCalculateBMI = () => {
    const w = parseFloat(bmiWeight);
    const h = parseFloat(bmiHeight) / 100; // convert cm to meters
    if (!w || !h || h <= 0) return;

    const score = w / (h * h);
    let cat = "Normal Weight";
    if (score < 18.5) cat = "Underweight";
    else if (score >= 25 && score < 30) cat = "Overweight";
    else if (score >= 30) cat = "Obese";

    setManualBMI({ bmi: Math.round(score * 10) / 10, category: cat });
  };

  const handleCalculateBodyFat = () => {
    const h = parseFloat(bfHeight);
    const n = parseFloat(bfNeck);
    const w = parseFloat(bfWaist);
    const hp = parseFloat(bfHip);

    if (!h || !n || !w || (bfGender === "female" && !hp)) return;

    let bodyFat = 0;
    if (bfGender === "male") {
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.221 * Math.log10(h)) - 450;
    }

    setManualBF(bodyFat > 0 ? Math.round(bodyFat * 10) / 10 : 0);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const token = getToken();

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
        localStorage.removeItem("userRole");
        router.push("/login");
        return;
      }

      setUser(userData);
      setProfileForm({
        fullName: userData.fullName || "",
        mobileNumber: userData.mobileNumber || "",
        fitnessGoals: userData.fitnessGoals || "",
        height: userData.height || "",
      });
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPicture(true);
      setError("");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
    if (!token) return;

    try {
      setSavingTraining(true);
      setError("");

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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Welcome Back,</p>
          <h1 className="text-2xl font-bold text-white">{user?.name || "Member"} 👋</h1>
        </div>
        <div className="relative">
          <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-green-500 bg-gray-800">
            {user?.profilePicture ? (
              <Image 
  src={user.profilePicture || "/fallback-avatar.png"} 
  alt="Profile" 
  width={120} 
  height={120} 
  className="h-full w-full object-cover rounded-full"
  priority
/>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0B0B0F] bg-green-500" />
        </div>
      </div>

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

  const renderMeasurementInput = (type: "before" | "after", field: string, label: string) => {
    const currentValue = user?.healthMetrics?.beforeAfterMeasurements?.[type]?.[field as keyof typeof measurementForms.before] || "";

    return (
      <div className="relative">
        <input
          type="number"
          step="0.1"
          value={measurementForms[type][field as keyof typeof measurementForms.before] ?? currentValue ?? ""}
          onChange={(e) => {
            const newForms = { ...measurementForms };
            newForms[type][field as keyof typeof measurementForms.before] = e.target.value;
            setMeasurementForms(newForms);
          }}
          className="peer w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-transparent focus:border-red-500/50 focus:outline-none"
          placeholder={label}
          id={`${type}-${field}-input`}
        />
        <label
          htmlFor={`${type}-${field}-input`}
          className="absolute left-4 top-3 -translate-y-1/2 text-xs text-gray-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-red-400"
        >
          {label}
        </label>
      </div>
    );
  };

  const handleSaveMeasurement = async (type: "before" | "after") => {
    const token = getToken();
    if (!token) return;

    const measurements = measurementForms[type];
    const hasValues = Object.values(measurements).some(v => v !== "");

    if (!hasValues) return;

    try {
      setSavingMeasurement(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/before-after-measurements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          measurements: Object.fromEntries(
            Object.entries(measurements).map(([k, v]) => [k, v ? parseFloat(v) : 0])
          ),
          targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
          bmi: manualBMI?.bmi || undefined,
        }),
      });

      if (res.ok) {
        await fetchUserData();
        setMeasurementForms({
          ...measurementForms,
          [type]: { weight: "", chest: "", waist: "", leftArm: "", rightArm: "", leftLeg: "", rightLeg: "" },
        });
      }
    } catch (error) {
      console.error("Failed to save measurements:", error);
    } finally {
      setSavingMeasurement(false);
    }
  };

  const handleDeleteMeasurement = async (type: "before" | "after") => {
    const token = getToken();
    if (!token) return;

    if (!confirm(`Are you sure you want to delete all ${type} measurements?`)) return;

    try {
      setSavingMeasurement(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/before-after-measurements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          measurements: {},
          targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
          bmi: manualBMI?.bmi || undefined,
        }),
      });

      if (res.ok) {
        await fetchUserData();
        setMeasurementForms({
          ...measurementForms,
          [type]: { weight: "", chest: "", waist: "", leftArm: "", rightArm: "", leftLeg: "", rightLeg: "" },
        });
      }
    } catch (error) {
      console.error("Failed to delete measurements:", error);
    } finally {
      setSavingMeasurement(false);
    }
  };

  const renderPhotoUpload = (type: "before" | "after", view: "front" | "back" | "side", label: string) => {
    const photo = user?.healthMetrics?.beforeAfterPhotos?.[type]?.[view];

    return (
      <div className="relative">
        {photo?.url ? (
          <div
            className="aspect-square cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/40"
            onClick={() => setExpandedPhoto({ url: photo.url || "", type, view })}
          >
            <img src={photo.url} alt={`${type} ${view}`} className="h-full w-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePhoto(type, view);
              }}
              className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-black/40 transition hover:border-red-500/30">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, type, view)}
              disabled={uploadingPhoto}
              className="hidden"
            />
            <div className="text-center">
              <span className="text-2xl">📷</span>
              <p className="mt-1 text-xs text-gray-400">{label}</p>
            </div>
          </label>
        )}
      </div>
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after", view: "front" | "back" | "side") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) return;

    try {
      setUploadingPhoto(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/before-after-photos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            view,
            url: base64String,
            publicId: `temp-${Date.now()}`,
          }),
        });

        if (res.ok) {
          await fetchUserData();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload photo:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (type: "before" | "after", view: "front" | "back" | "side") => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/before-after-photos/${type}/${view}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchUserData();
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  const calculateProgressPercentage = () => {
    const before = user?.healthMetrics?.beforeAfterMeasurements?.before;
    const after = user?.healthMetrics?.beforeAfterMeasurements?.after;
    const targetWeightVal = user?.healthMetrics?.targetWeight || 0;

    if (!before || !after || !before.weight || !after.weight) return 0;

    const beforeWeight = before.weight;
    const afterWeight = after.weight;

    const denominator = beforeWeight - targetWeightVal;
    if (denominator === 0) {
      return 0;
    }

    const progress = ((beforeWeight - afterWeight) / denominator) * 100;
    return Math.max(0, Math.min(100, progress));
  };

const renderHealthTab = () => (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Health & Progress</h1>
          <p className="text-sm text-gray-400">Track your fitness journey manually</p>
        </div>
        
        {/* Action Controls for Modal and AI Features */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setHealthModal({ isOpen: true, type: 'weight' })} 
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition"
          >
            + Log Metric
          </button>
          
          <button 
            onClick={handleGenerateAIAudit}
            disabled={loadingAiAudit}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loadingAiAudit ? "Analyzing Profile..." : "🤖 Run AI Audit"}
          </button>
        </div>
      </div>

      {/* AI Audit View Display */}
      {aiAudit && (
        <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-3xl text-purple-300">
          <h4 className="font-bold mb-2 text-purple-200 flex items-center gap-2">
            <span>✨</span> AI Coach Analysis
          </h4>
          <p className="text-xs leading-relaxed whitespace-pre-line">{aiAudit}</p>
        </div>
      )}

      {/* Metric Radial Gauges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#111116] p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">BMI Performance</p>
          <div className="relative h-28 w-28 flex items-center justify-center">
            <svg className="absolute inset-0 h-full w-full transform -rotate-90 overflow-visible">
              <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <circle
                cx="56" cy="56" r="48" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${(2 * Math.PI * 48) - (Math.min(manualBMI?.bmi || 0, 40) / 40) * (2 * Math.PI * 48)}`}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-xl font-black text-white">{manualBMI ? manualBMI.bmi : "--"}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Score</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111116] p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Body Fat %</p>
          <div className="relative h-28 w-28 flex items-center justify-center">
            <svg className="absolute inset-0 h-full w-full transform -rotate-90 overflow-visible">
              <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
              <circle
                cx="56" cy="56" r="48" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${(2 * Math.PI * 48) - (Math.min(manualBF || 0, 50) / 50) * (2 * Math.PI * 48)}`}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-xl font-black text-white">{manualBF !== null ? `${manualBF}%` : "--"}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Navy Seal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculators Block */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#111116] p-5 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-red-500">BMI Configuration</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number" placeholder="Weight (kg)" value={bmiWeight}
              onChange={(e) => setBmiWeight(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
            <input
              type="number" placeholder="Height (cm)" value={bmiHeight}
              onChange={(e) => setBmiHeight(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <input
            type="number" placeholder="Age" value={bmiAge}
            onChange={(e) => setBmiAge(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleCalculateBMI}
            className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-700"
          >
            Calculate BMI Parameters
          </button>
          {manualBMI && (
            <p className="text-center text-[11px] text-gray-400">
              Classification: <span className="text-red-400 font-bold">{manualBMI.category}</span>
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111116] p-5 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-red-500">Body Fat Parameters</h4>
          <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <button onClick={() => setBfGender("male")} className={`flex-1 py-1 text-xs font-bold rounded-md transition ${bfGender === "male" ? "bg-red-600 text-white" : "text-gray-400"}`}>Male</button>
            <button onClick={() => setBfGender("female")} className={`flex-1 py-1 text-xs font-bold rounded-md transition ${bfGender === "female" ? "bg-red-600 text-white" : "text-gray-400"}`}>Female</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Height (cm)" value={bfHeight} onChange={(e) => setBfHeight(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none" />
            <input type="number" placeholder="Neck (cm)" value={bfNeck} onChange={(e) => setBfNeck(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Waist (cm)" value={bfWaist} onChange={(e) => setBfWaist(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none" />
            <input type="number" placeholder="Hip (cm)" value={bfGender === "male" ? "" : bfHip} onChange={(e) => setBfHip(e.target.value)} disabled={bfGender === "male"} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white disabled:opacity-30 focus:outline-none" />
          </div>
          <button onClick={handleCalculateBodyFat} className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-700">
            Calculate Fat Metrics
          </button>
        </div>
      </div>

      {/* Measurement Matrix Tracking */}
      <div className="rounded-3xl border border-white/10 bg-[#111116] p-5">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Measurement Matrix Tracking</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-red-400 uppercase tracking-widest border-b border-white/5 pb-1">Initial Points</h4>
            <div className="space-y-2">
              {renderMeasurementInput("before", "weight", "Weight (kg)")}
              {renderMeasurementInput("before", "chest", "Chest (cm)")}
              {renderMeasurementInput("before", "waist", "Waist (cm)")}
              {renderMeasurementInput("before", "leftArm", "L. Arm (cm)")}
              {renderMeasurementInput("before", "rightArm", "R. Arm (cm)")}
              {renderMeasurementInput("before", "leftLeg", "L. Leg (cm)")}
              {renderMeasurementInput("before", "rightLeg", "R. Leg (cm)")}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={() => handleSaveMeasurement("before")} className="w-full rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition">Save Initial</button>
              <button onClick={() => handleDeleteMeasurement("before")} className="w-full rounded-xl border border-white/10 py-2 text-xs font-bold text-gray-400 hover:bg-white/5 transition">Clear</button>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black text-green-400 uppercase tracking-widest border-b border-white/5 pb-1">Current Progress</h4>
            <div className="space-y-2">
              {renderMeasurementInput("after", "weight", "Weight (kg)")}
              {renderMeasurementInput("after", "chest", "Chest (cm)")}
              {renderMeasurementInput("after", "waist", "Waist (cm)")}
              {renderMeasurementInput("after", "leftArm", "L. Arm (cm)")}
              {renderMeasurementInput("after", "rightArm", "R. Arm (cm)")}
              {renderMeasurementInput("after", "leftLeg", "L. Leg (cm)")}
              {renderMeasurementInput("after", "rightLeg", "R. Leg (cm)")}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={() => handleSaveMeasurement("after")} className="w-full rounded-xl bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700 transition">Save Current</button>
              <button onClick={() => handleDeleteMeasurement("after")} className="w-full rounded-xl border border-white/10 py-2 text-xs font-bold text-gray-400 hover:bg-white/5 transition">Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Photo Section Integrated & Dark Mode Styled */}
      <div className="mt-4 pt-6 border-t border-white/10">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Progress Photos Portfolio</h3>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Before Section */}
          <div className="space-y-3 bg-[#111116] border border-white/5 rounded-2xl p-4">
            <h4 className="text-xs font-black text-red-400 uppercase tracking-widest border-b border-white/5 pb-2">Before Transformation</h4>
            <div className="grid grid-cols-3 gap-3">
              {renderPhotoUpload("before", "front", "Front View")}
              {renderPhotoUpload("before", "side", "Side View")}
              {renderPhotoUpload("before", "back", "Back View")}
            </div>
          </div>

          {/* After Section */}
          <div className="space-y-3 bg-[#111116] border border-white/5 rounded-2xl p-4">
            <h4 className="text-xs font-black text-green-400 uppercase tracking-widest border-b border-white/5 pb-2">After Transformation</h4>
            <div className="grid grid-cols-3 gap-3">
              {renderPhotoUpload("after", "front", "Front View")}
              {renderPhotoUpload("after", "side", "Side View")}
              {renderPhotoUpload("after", "back", "Back View")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Training</h1>
        <p className="text-sm text-gray-400">Track your daily habits</p>
      </div>

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

      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Daily Checklist</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏋️</span>
              <span className="text-sm font-semibold text-white">Workout Completed</span>
            </div>
            <input 
  type="checkbox" 
  className="h-5 w-5 accent-red-500" 
  checked={checklist.workout}
  onChange={(e) => setChecklist({ ...checklist, workout: e.target.checked })}
/>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🥗</span>
              <span className="text-sm font-semibold text-white">Healthy Meals</span>
            </div>
            <input 
  type="checkbox" 
  className="h-5 w-5 accent-red-500" 
  checked={checklist.meals}
  onChange={(e) => setChecklist({ ...checklist, meals: e.target.checked })}
/>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🧘</span>
              <span className="text-sm font-semibold text-white">Stretching</span>
            </div>
            <input 
  type="checkbox" 
  className="h-5 w-5 accent-red-500" 
  checked={checklist.stretching}
  onChange={(e) => setChecklist({ ...checklist, stretching: e.target.checked })}
/>
          </div>
        </div>
      </div>

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
              Height (cm)
            </label>
            <input
              type="number"
              value={profileForm.height}
              onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
              placeholder="Enter your height in cm"
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

      {user?.role === "admin" && (
        <button
          onClick={() => router.push("/admin")}
          className="flex w-full items-center justify-between rounded-3xl border border-red-500/30 bg-red-500/10 p-4 transition hover:bg-red-500/20"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <span className="font-semibold text-red-400">Go to Admin Panel</span>
          </div>
          <span className="text-red-400">→</span>
        </button>
      )}

      <button
        onClick={() => {
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
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-100px] top-[-100px] h-[300px] w-[300px] rounded-full bg-red-600/10 blur-3xl" />
          <div className="absolute right-[-100px] bottom-[-100px] h-[300px] w-[300px] rounded-full bg-red-600/5 blur-3xl" />
        </div>

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

        {healthModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#16161F] p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Log {healthModal.type}</p>
                <button
                  onClick={() => setHealthModal({ type: "", isOpen: false })}
                  className="text-gray-400 transition hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                {healthModal.type === "sleep" && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Sleep Quality
                    </label>
                    <select
                      value={metricQuality}
                      onChange={(e) => setMetricQuality(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-red-500/50 focus:outline-none"
                    >
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
                    placeholder="Enter value"
                  />
                </div>
                <button
                  onClick={handleLogMetric}
                  disabled={loggingMetric}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loggingMetric ? "Logging..." : "Log Metric"}
                </button>
              </div>
            </div>
          </div>
        )}

        {expandedPhoto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-3xl">
              <button
                onClick={() => setExpandedPhoto(null)}
                className="absolute -top-12 right-0 text-white text-4xl hover:text-red-400 transition"
              >
                ×
              </button>
              <img
                src={expandedPhoto.url}
                alt="Expanded photo"
                className="w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        )}
      </main>
    </PageTransition>
  );
}