"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
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
    height: "", // Added height tracking here
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

  // Full measurement form state (simplified to 5 key metrics)
  const [measurementForm, setMeasurementForm] = useState({
    weight: "",
    chest: "",
    waist: "",
    arms: "",
    legs: "",
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

  // BMI data state (calculated dynamically)
  const [calculatedBMI, setCalculatedBMI] = useState<{ bmi: number; category: string } | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

 // Calculate BMI dynamically when weight or height changes
  useEffect(() => {
    // Fallback logic: check live typing input first, otherwise read what's already saved in MongoDB
    const savedWeight = user?.healthMetrics?.beforeAfterMeasurements?.after?.weight?.toString() || "";
    const currentWeight = measurementForms.after.weight || savedWeight;
    const currentHeight = user?.height || "";

    if (currentHeight && currentWeight) {
      const heightInMeters = parseFloat(currentHeight) / 100;
      const weight = parseFloat(currentWeight);
      
      if (heightInMeters > 0 && weight > 0) {
        const bmi = weight / (heightInMeters * heightInMeters);
        let category = "";
        if (bmi < 18.5) category = "Underweight";
        else if (bmi >= 18.5 && bmi < 25) category = "Normal";
        else if (bmi >= 25 && bmi < 30) category = "Overweight";
        else category = "Obese";
        
        setCalculatedBMI({ bmi: parseFloat(bmi.toFixed(1)), category });
      } else {
        setCalculatedBMI(null);
      }
    } else {
      setCalculatedBMI(null);
    }
  }, [measurementForms.after.weight, user]);

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
        height: userData.height || "", // Added height loading here
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

      // For now, we'll use a placeholder URL. In production, you'd upload to Cloudinary/S3
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

  const handleSaveFullMeasurement = async () => {
    const token = getToken();
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
          chest: parseFloat(measurementForm.chest) || 0,
          waist: parseFloat(measurementForm.waist) || 0,
          leftBicep: parseFloat(measurementForm.arms) || 0,
          rightBicep: parseFloat(measurementForm.arms) || 0,
          leftThigh: parseFloat(measurementForm.legs) || 0,
          rightThigh: parseFloat(measurementForm.legs) || 0,
          bodyFat: 0,
          muscleMass: 0,
          shoulders: 0,
          hips: 0,
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
        chest: "",
        waist: "",
        arms: "",
        legs: "",
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
    const token = getToken();
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

  const renderMeasurementInput = (type: "before" | "after", field: string, label: string) => {
    const currentValue = user?.healthMetrics?.beforeAfterMeasurements?.[type]?.[field as keyof typeof measurementForms.before] || "";
    const isBefore = type === "before";

    return (
      <div className="relative">
        <input
          type="number"
          step="0.1"
          value={measurementForms[type][field as keyof typeof measurementForms.before] || currentValue}
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
          bmi: calculatedBMI?.bmi || undefined,
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
          bmi: calculatedBMI?.bmi || undefined,
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
    const targetWeight = user?.healthMetrics?.targetWeight || 0;

    if (!before || !after || !before.weight || !after.weight) return 0;

    const beforeWeight = before.weight;
    const afterWeight = after.weight;

    // Calculate absolute deltas (After - Before)
    const weightDelta = afterWeight - beforeWeight;

    // Calculate target progress percentage: ((beforeWeight - afterWeight) / (beforeWeight - targetWeight)) * 100
    // Safety guard: if (beforeWeight - targetWeight) === 0, default to 0%
    const denominator = beforeWeight - targetWeight;
    if (denominator === 0) {
      return 0; // Default to 0% if target equals before weight
    }

    const progress = ((beforeWeight - afterWeight) / denominator) * 100;

    // Handle progress over 100% - cap at 100% for clean display
    return Math.max(0, Math.min(100, progress));
  };

const calculateBodyFatPercentage = () => {
    // Combine live input form state and database fallback values
    const savedWeight = user?.healthMetrics?.beforeAfterMeasurements?.after?.weight || 0;
    const weight = measurementForms.after.weight ? parseFloat(measurementForms.after.weight) : savedWeight;
    const height = parseFloat(user?.height || "0") || 0;

    if (weight === 0 || height === 0) return 0;

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // Standard baseline adult body fat estimation formula
    const bodyFat = (1.20 * bmi) + (0.23 * 30) - 16.2;

    return Math.max(0, Math.min(100, bodyFat));
  };

  const renderHealthTab = () => (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white">Health & Progress</h1>
        <p className="text-sm text-gray-400">Track your fitness journey</p>
      </div>

      {/* BMI Calculator */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">BMI Calculator</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{calculatedBMI?.bmi || "--"}</p>
            <p className="text-xs text-gray-400">BMI</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
            <p className="text-sm font-semibold text-red-400">{calculatedBMI?.category || "Calculating..."}</p>
          </div>
        </div>
      </div>

      {/* Target Weight */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Target Weight</p>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={targetWeight || user?.healthMetrics?.targetWeight || ""}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="peer w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-transparent focus:border-red-500/50 focus:outline-none"
              placeholder="Target Weight (kg)"
              id="target-weight-input"
            />
            <label
              htmlFor="target-weight-input"
              className="absolute left-4 top-3 -translate-y-1/2 text-xs text-gray-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-red-400"
            >
              Target Weight (kg)
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveMeasurement("after")}
              disabled={savingMeasurement}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingMeasurement ? "Saving..." : "Save Target"}
            </button>
          </div>
        </div>
      </div>

      {/* Before/After Measurements Table */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Before / After Measurements</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Before Column */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Before</p>
            <div className="space-y-2">
              {renderMeasurementInput("before", "weight", "Weight (kg)")}
              {renderMeasurementInput("before", "chest", "Chest (cm)")}
              {renderMeasurementInput("before", "waist", "Waist (cm)")}
              {renderMeasurementInput("before", "leftArm", "Left Arm (cm)")}
              {renderMeasurementInput("before", "rightArm", "Right Arm (cm)")}
              {renderMeasurementInput("before", "leftLeg", "Left Leg (cm)")}
              {renderMeasurementInput("before", "rightLeg", "Right Leg (cm)")}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleSaveMeasurement("before")}
                disabled={savingMeasurement}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingMeasurement ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => handleDeleteMeasurement("before")}
                disabled={savingMeasurement}
                className="flex-1 rounded-xl border border-red-600 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          {/* After Column */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">After</p>
            <div className="space-y-2">
              {renderMeasurementInput("after", "weight", "Weight (kg)")}
              {renderMeasurementInput("after", "chest", "Chest (cm)")}
              {renderMeasurementInput("after", "waist", "Waist (cm)")}
              {renderMeasurementInput("after", "leftArm", "Left Arm (cm)")}
              {renderMeasurementInput("after", "rightArm", "Right Arm (cm)")}
              {renderMeasurementInput("after", "leftLeg", "Left Leg (cm)")}
              {renderMeasurementInput("after", "rightLeg", "Right Leg (cm)")}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleSaveMeasurement("after")}
                disabled={savingMeasurement}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingMeasurement ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => handleDeleteMeasurement("after")}
                disabled={savingMeasurement}
                className="flex-1 rounded-xl border border-red-600 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Before/After Photo Gallery */}
      <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
        <p className="mb-4 text-sm font-semibold text-gray-400">Before / After Photos</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Before Photos */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Before</p>
            <div className="space-y-3">
              {renderPhotoUpload("before", "front", "Front")}
              {renderPhotoUpload("before", "back", "Back")}
              {renderPhotoUpload("before", "side", "Side")}
            </div>
          </div>
          {/* After Photos */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">After</p>
            <div className="space-y-3">
              {renderPhotoUpload("after", "front", "Front")}
              {renderPhotoUpload("after", "back", "Back")}
              {renderPhotoUpload("after", "side", "Side")}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
          <p className="mb-4 text-sm font-semibold text-gray-400">Progress</p>
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#ef4444"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(calculateProgressPercentage() / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-white">{calculateProgressPercentage().toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-6">
          <p className="mb-4 text-sm font-semibold text-gray-400">Body Fat</p>
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#ef4444"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(calculateBodyFatPercentage() / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-white">{calculateBodyFatPercentage().toFixed(0)}%</p>
              </div>
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

      {/* Admin Portal Gateway - Only visible for admin users */}
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

        {/* Photo Expansion Modal */}
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
