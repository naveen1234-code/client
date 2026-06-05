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

  // --- NEW DIGITAL WORKOUT CARD STATES ---
  type WorkoutItem = {
    id: string;
    exercise: string;
    sets: number;
    reps: number;
    weight: string;
    isCompleted?: boolean;
  };

  const [workoutRoutine, setWorkoutRoutine] = useState<WorkoutItem[]>([
    { id: "1", exercise: "Bench Press", sets: 4, reps: 10, weight: "60kg", isCompleted: false },
    { id: "2", exercise: "Squats", sets: 4, reps: 12, weight: "80kg", isCompleted: false },
    { id: "3", exercise: "Pullups", sets: 3, reps: 8, weight: "BW", isCompleted: false },
  ]);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  // --- REST HUD TIMER STATES ---
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // --- 1RM CALCULATOR STATES ---
  const [ormWeight, setOrmWeight] = useState("");
  const [ormReps, setOrmReps] = useState("");
  const [calculatedOrm, setCalculatedOrm] = useState<number | null>(null);

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

  const fetchSavedRoutine = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/routine`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.routine && data.routine.length > 0) {
          setWorkoutRoutine(data.routine);
        }
      }
    } catch (err) {
      console.error("Error pulling routine:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchSavedRoutine(); // This tells the app to load your exercises on refresh
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerSeconds]);

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

  const renderHomeTab = () => {
    // 1. Dynamic Time-Zone Logic (Asia/Colombo)
    const colomboTimeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo", hour12: false });
    const currentHour = new Date(colomboTimeString).getHours();
    
    let greeting = "Late Night Hustle";
    let greetingEmoji = "🌙";
    
    if (currentHour >= 5 && currentHour < 12) {
      greeting = "Morning Grind";
      greetingEmoji = "🌅";
    } else if (currentHour >= 12 && currentHour < 17) {
      greeting = "Afternoon Session";
      greetingEmoji = "⚡";
    }

    return (
      <div className="space-y-6 pb-24">
        {/* Dynamic Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">{greeting} {greetingEmoji}</p>
            <h2 className="text-2xl font-black text-white">{user?.name || "Member"}</h2>
          </div>
          <div className="relative">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-700 bg-black shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]">
              {user?.profilePicture ? (
                <Image 
                  src={user.profilePicture || "/fallback-avatar.png"} 
                  alt="Profile" 
                  width={120} 
                  height={120} 
                  // FIX 1: Removed grayscale classes. Now full color by default!
                  className="h-full w-full object-cover rounded-full transition-all duration-500"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl">👤</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0B0B0F] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
        </div>

        {/* 2. The Carbon Fiber VIP Access Card */}
        <button
          onClick={() => router.push("/check-in")}
          className="group relative w-full overflow-hidden rounded-3xl bg-[#0a0a0c] border border-white/5 text-left shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all active:scale-[0.98]"
        >
          {/* Custom inline style for the continuous infinite sweep animation */}
          <style>{`
            @keyframes continuousSweep {
              0% { transform: translateX(-150%) skewX(-30deg); }
              50%, 100% { transform: translateX(150%) skewX(-30deg); }
            }
          `}</style>

          {/* Carbon Fiber CSS Pattern Overlay */}
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
          
          {/* FIX 2: The Continuous Chrome Sweeping Effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" 
            style={{ animation: 'continuousSweep 3s linear infinite' }}
          />

          <div className="relative z-10 flex flex-col justify-between p-7 space-y-6">
            {/* Top Row */}
            <div className="flex items-start justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tier Status</p>
                <p className="text-sm font-bold text-gray-300">{user?.membershipPlan || "Standard Access"}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
                  user?.membershipStatus === "active" ? "bg-green-500/10 text-green-400" : 
                  user?.membershipStatus === "expired" ? "bg-red-500/10 text-red-400" : 
                  "bg-yellow-500/10 text-yellow-400"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${user?.membershipStatus === "active" ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></span>
                  {user?.membershipStatus}
                </span>
                <p className="mt-1 text-[10px] font-mono tracking-wider text-gray-600">
                  {user?._id?.slice(-8) || "--------"}
                </p>
              </div>
            </div>

            {/* Center: Deliberate Metallic Scanner */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0a0a0c] border border-gray-600/30 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05),0_0_20px_rgba(0,0,0,0.5)]">
                {/* Slow breathing pulse */}
                <div className="absolute inset-0 rounded-full border border-gray-400/20 animate-[pulse_3s_ease-in-out_infinite]" />
                {/* Metallic Fingerprint/Scan Icon */}
                <svg className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              {/* FIX 3: Clear pulsating "PRESS HERE TO SCAN" label */}
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white animate-pulse">Press Here To Scan</p>
            </div>
          </div>
        </button>

        {/* 3. High-Tech Command Center (Quick Actions) - Optimized for all screens */}
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-600 pl-1">Command Center</p>
          <div className="flex flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button 
              onClick={() => setActiveTab("training")}
              className="flex flex-1 min-w-[40%] items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[#121216] py-3 text-xs font-bold text-gray-400 hover:bg-[#1a1a20] hover:text-white transition-colors shadow-lg"
            >
              <span className="text-blue-400">💧</span> Water
            </button>
            <button 
              onClick={() => setActiveTab("health")}
              className="flex flex-1 min-w-[40%] items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[#121216] py-3 text-xs font-bold text-gray-400 hover:bg-[#1a1a20] hover:text-white transition-colors shadow-lg"
            >
              <span className="text-red-400">⚖️</span> Weight
            </button>
            <button 
              onClick={() => setActiveTab("health")}
              className="flex flex-1 min-w-[40%] items-center justify-center gap-2 rounded-2xl border border-white/5 bg-[#121216] py-3 text-xs font-bold text-gray-400 hover:bg-[#1a1a20] hover:text-white transition-colors shadow-lg"
            >
              <span className="text-purple-400">🤖</span> AI Coach
            </button>
          </div>
        </div>

        {/* FIX 4: Swapped System Telemetry to be ABOVE Daily Objectives */}
        {/* HUD Dashboard Dials */}
        <div className="rounded-3xl border border-white/5 bg-[#0e0e12] p-5 shadow-lg">
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">System Telemetry</p>
          
          <div className="flex items-center justify-around">
            {/* Dial 1: Remaining Days */}
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24">
                {/* Tick marks behind the circle */}
                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#1f1f2e" strokeWidth="2" strokeDasharray="4 6" fill="none" />
                </svg>
                {/* Glowing Progress */}
                <svg className="h-full w-full transform -rotate-90 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]">
                  <circle cx="48" cy="48" r="40" stroke="#111" strokeWidth="6" fill="none" />
                  <circle
                    cx="48" cy="48" r="40" stroke="#22c55e" strokeWidth="6" fill="none"
                    strokeDasharray={`${(user?.remainingDays || 0) / (user?.totalDays || 1) * 251} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-black text-white leading-none">{user?.remainingDays || 0}</span>
                </div>
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Days Left</p>
            </div>

            {/* Dial 2: Attendance */}
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24">
                {/* Tick marks behind the circle */}
                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#1f1f2e" strokeWidth="2" strokeDasharray="4 6" fill="none" />
                </svg>
                {/* Glowing Progress */}
                <svg className="h-full w-full transform -rotate-90 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                  <circle cx="48" cy="48" r="40" stroke="#111" strokeWidth="6" fill="none" />
                  <circle
                    cx="48" cy="48" r="40" stroke="#3b82f6" strokeWidth="6" fill="none"
                    strokeDasharray={`${Math.min((user?.attendanceCount || 0) / 30 * 251, 251)} 251`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-black text-white leading-none">{user?.attendanceCount || 0}</span>
                </div>
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Visits</p>
            </div>
          </div>
        </div>

        {/* Gamified Daily Quests */}
        <div className="rounded-3xl border border-white/5 bg-[#0e0e12] p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Daily Objectives</p>
            <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-sm">
              {Object.values(checklist).filter(Boolean).length}/3 Complete
            </span>
          </div>
          <div className="space-y-2">
            {[
              { id: 'workout', label: 'Complete Daily Training', icon: '🏋️‍♂️', color: 'text-red-400' },
              { id: 'meals', label: 'Log Nutrition / Macros', icon: '🥩', color: 'text-orange-400' },
              { id: 'stretching', label: 'Recovery & Mobility', icon: '🧘‍♂️', color: 'text-blue-400' }
            ].map((quest) => (
              <label key={quest.id} className={`flex cursor-pointer items-center justify-between rounded-xl border border-white/5 p-3 transition-colors ${checklist[quest.id as keyof typeof checklist] ? 'bg-green-900/10 border-green-500/20' : 'bg-[#141419] hover:bg-[#1a1a20]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${quest.color}`}>{quest.icon}</span>
                  <span className={`text-xs font-bold ${checklist[quest.id as keyof typeof checklist] ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                    {quest.label}
                  </span>
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded border ${checklist[quest.id as keyof typeof checklist] ? 'border-green-500 bg-green-500' : 'border-gray-600 bg-transparent'}`}>
                  {checklist[quest.id as keyof typeof checklist] && <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                {/* Hidden input to reuse existing state logic */}
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={checklist[quest.id as keyof typeof checklist]}
                  onChange={(e) => setChecklist({ ...checklist, [quest.id]: e.target.checked })}
                />
              </label>
            ))}
          </div>
        </div>

      </div>
    );
  };

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

  const renderTrainingTab = () => {
    // Session Volume Aggregator Logic
    const totalVolume = workoutRoutine.reduce((total, item) => {
      if (item.isCompleted) {
        const numericWeight = parseFloat(item.weight.replace(/[^0-9.]/g, "")) || 0;
        return total + (item.sets * item.reps * numericWeight);
      }
      return total;
    }, 0);

    // 1RM Calculation Logic
    const handleCalculate1RM = () => {
      const w = parseFloat(ormWeight);
      const r = parseFloat(ormReps);
      if (!w || !r) return;
      // Epley Formula implementation
      const orm = w * (1 + r / 30);
      setCalculatedOrm(Math.round(orm * 10) / 10);
    };

    return (
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Hub</h1>
          <p className="text-sm text-gray-400">Manage your routines and real-time workout telemetry</p>
        </div>

        {/* ================= HUD REST TIMER BAR ================= */}
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏱️</span>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Tactical Rest HUD</p>
            </div>
            {timerSeconds > 0 && (
              <span className="text-xs font-mono text-red-400 animate-pulse bg-red-500/10 px-2 py-0.5 rounded-sm">
                Rest Active
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="w-24 text-center border-r border-white/10 pr-2">
              <p className="font-mono text-3xl font-black text-white">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider mt-0.5">Countdown</p>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-2">
              {[45, 60, 90].map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => {
                    setTimerSeconds(seconds);
                    setTimerActive(true);
                  }}
                  className="py-2 text-xs font-mono font-bold rounded-xl border border-white/5 bg-neutral-900 text-gray-300 hover:text-white hover:border-red-500/40 transition active:scale-95"
                >
                  {seconds}s
                </button>
              ))}
            </div>
            
            {timerSeconds > 0 && (
              <button
                onClick={() => {
                  setTimerActive(!timerActive);
                }}
                className={`p-2.5 rounded-xl text-xs font-bold uppercase ${timerActive ? 'bg-amber-600' : 'bg-green-600'} text-white`}
              >
                {timerActive ? "Pause" : "Resume"}
              </button>
            )}
          </div>
        </div>

        {/* ================= DIGITAL WORKOUT CHART MODULE ================= */}
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white tracking-widest uppercase">Digital Routine Card</h3>
              <p className="text-[11px] text-gray-400">Ditch the notebook. Edit and track sets instantly.</p>
            </div>
            <button
              onClick={async () => {
                setIsSavingRoutine(true);
                try {
                  const token = getToken();
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/routine`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ routine: workoutRoutine }),
                  });
                  setSuccessMessage("Routine Chart synced successfully! ✅");
                  setTimeout(() => setSuccessMessage(""), 3000);
                } catch (err) {
                  console.error("Failed to save routine", err);
                  setError("Could not establish cloud save matrix.");
                } finally {
                  setIsSavingRoutine(false);
                }
              }}
              disabled={isSavingRoutine}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
            >
              {isSavingRoutine ? "Saving..." : "Save Chart"}
            </button>
          </div>

          {/* Volume Tracker Overlay */}
          <div className="mb-4 rounded-xl bg-neutral-900/60 border border-white/5 p-3 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Logged Session Volume:</span>
            <span className="text-sm font-mono font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]">
              {totalVolume} kg Moved
            </span>
          </div>

          {/* Exercise Table Stack */}
          <div className="space-y-3">
            {workoutRoutine.map((item, index) => (
              <div 
                key={item.id} 
                className={`flex flex-col gap-2 rounded-2xl border p-3 transition-all duration-300 ${
                  item.isCompleted ? 'border-green-500/30 bg-green-950/10 opacity-70' : 'border-white/5 bg-black/40'
                }`}
              >
                {/* Top Row Configuration */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.isCompleted || false}
                    onChange={(e) => {
                      const updated = [...workoutRoutine];
                      updated[index].isCompleted = e.target.checked;
                      setWorkoutRoutine(updated);
                    }}
                    className="h-5 w-5 rounded border-white/20 bg-black text-red-600 focus:ring-0 focus:ring-offset-0 accent-red-600"
                  />
                  <input
                    type="text"
                    value={item.exercise}
                    placeholder="Exercise Name"
                    onChange={(e) => {
                      const updated = [...workoutRoutine];
                      updated[index].exercise = e.target.value;
                      setWorkoutRoutine(updated);
                    }}
                    className="w-full bg-transparent text-sm font-bold text-white placeholder-neutral-600 focus:outline-none focus:border-b focus:border-red-500/50"
                  />
                  <button
                    onClick={() => {
                      setWorkoutRoutine(workoutRoutine.filter((_, i) => i !== index));
                    }}
                    className="text-neutral-500 hover:text-red-400 text-sm px-1 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Sub Matrix Data Fields (Sets * Reps @ Weight) */}
                <div className="grid grid-cols-3 gap-2 pl-8 text-xs">
                  <div className="flex items-center bg-neutral-900/80 rounded-lg px-2 border border-white/5">
                    <span className="text-[10px] text-neutral-500 mr-1 font-bold uppercase">Sets:</span>
                    <input
                      type="number"
                      value={item.sets || ""}
                      placeholder="0"
                      onChange={(e) => {
                        const updated = [...workoutRoutine];
                        updated[index].sets = parseInt(e.target.value) || 0;
                        setWorkoutRoutine(updated);
                      }}
                      className="w-full bg-transparent text-white font-mono focus:outline-none text-center"
                    />
                  </div>
                  
                  <div className="flex items-center bg-neutral-900/80 rounded-lg px-2 border border-white/5">
                    <span className="text-[10px] text-neutral-500 mr-1 font-bold uppercase">Reps:</span>
                    <input
                      type="number"
                      value={item.reps || ""}
                      placeholder="0"
                      onChange={(e) => {
                        const updated = [...workoutRoutine];
                        updated[index].reps = parseInt(e.target.value) || 0;
                        setWorkoutRoutine(updated);
                      }}
                      className="w-full bg-transparent text-white font-mono focus:outline-none text-center"
                    />
                  </div>

                  <div className="flex items-center bg-neutral-900/80 rounded-lg px-2 border border-white/5">
                    <span className="text-[10px] text-neutral-500 mr-1 font-bold uppercase">Wt:</span>
                    <input
                      type="text"
                      value={item.weight}
                      placeholder="eg. 60kg"
                      onChange={(e) => {
                        const updated = [...workoutRoutine];
                        updated[index].weight = e.target.value;
                        setWorkoutRoutine(updated);
                      }}
                      className="w-full bg-transparent text-white font-mono focus:outline-none text-xs text-center"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Row Creation Link */}
            <button
              onClick={() => {
                setWorkoutRoutine([
                  ...workoutRoutine,
                  { id: Date.now().toString(), exercise: "", sets: 0, reps: 0, weight: "" }
                ]);
              }}
              className="w-full rounded-xl border border-dashed border-white/10 bg-transparent py-2.5 text-xs font-semibold text-neutral-400 transition hover:border-red-500/30 hover:text-white"
            >
              + Add Custom Exercise
            </button>
          </div>
        </div>

        {/* ================= 1-REP MAX CALCULATOR MATRIX ================= */}
        <div className="rounded-3xl border border-white/10 bg-[#16161F] p-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-3">1RM Combat Calculator</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="number"
              placeholder="Weight (kg)"
              value={ormWeight}
              onChange={(e) => setOrmWeight(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
            <input
              type="number"
              placeholder="Reps Done"
              value={ormReps}
              onChange={(e) => setOrmReps(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={handleCalculate1RM}
            className="w-full rounded-xl bg-neutral-900 border border-white/10 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:border-red-500/40"
          >
            Compute Max Capacity
          </button>
          {calculatedOrm !== null && (
            <p className="text-center text-xs text-gray-400 mt-3 bg-black/30 py-2 rounded-xl border border-white/5">
              Estimated Max Single Lift: <span className="text-red-400 font-mono font-black text-sm ml-1">{calculatedOrm} kg</span>
            </p>
          )}
        </div>

        {/* ================= LEGACY HABITS METRICS SECTIONS ================= */}
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

        {/* Global Habits Save Controls */}
        <button
          onClick={handleSaveTraining}
          disabled={savingTraining || (dailyHydration === 0 && dailySleep === 0)}
          className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingTraining ? "Saving..." : "Save Habit Tracking Data"}
        </button>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Hero Avatar Section */}
      <div className="relative flex flex-col items-center justify-center pt-8 pb-4">
        {/* Ambient Glow Behind Avatar */}
        <div className="absolute top-0 h-40 w-full bg-gradient-to-b from-red-600/10 via-red-900/5 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Glowing Avatar Wrapper */}
          <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-red-500 via-[#1a1a20] to-black p-1 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
            <div className="h-full w-full overflow-hidden rounded-full border-2 border-[#0B0B0F] bg-[#111116]">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" 
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">👤</div>
              )}
            </div>
            
            {/* Upload Button */}
            <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-[#0B0B0F] bg-red-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={uploadingPicture}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Name and Status Badge */}
        <div className="mt-5 text-center relative z-10">
          <h2 className="text-2xl font-black text-white tracking-wide">{user?.name || "VIP Member"}</h2>
          <p className="text-xs font-mono text-gray-400 mt-1">{user?.email}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
              {user?.role || "Member"} Clearance
            </span>
          </div>
        </div>
      </div>

      {/* 2. Identity & Biometrics Card */}
      <div className="rounded-3xl border border-white/5 bg-[#0e0e12] p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Carbon Fiber Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 mb-6">
          <div className="h-3 w-1 rounded-full bg-red-500" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Identity & Protocol</h3>
        </div>

        <div className="relative z-10 space-y-5">
          {/* Input Group: Full Name */}
          <div className="group">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors group-focus-within:text-red-400">
              Full Legal Name
            </label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              className="w-full rounded-2xl border border-white/5 bg-[#141419] px-4 py-3.5 text-sm font-bold text-white transition-all placeholder:text-gray-600 focus:border-red-500/50 focus:bg-[#1a1a20] focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="Enter your full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Input Group: Phone */}
            <div className="group">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors group-focus-within:text-red-400">
                Mobile Comms
              </label>
              <input
                type="tel"
                value={profileForm.mobileNumber}
                onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
                className="w-full rounded-2xl border border-white/5 bg-[#141419] px-4 py-3.5 text-sm font-bold text-white transition-all placeholder:text-gray-600 focus:border-red-500/50 focus:bg-[#1a1a20] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="Phone number"
              />
            </div>

            {/* Input Group: Height */}
            <div className="group">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors group-focus-within:text-red-400">
                Height (cm)
              </label>
              <input
                type="number"
                value={profileForm.height}
                onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                className="w-full rounded-2xl border border-white/5 bg-[#141419] px-4 py-3.5 text-sm font-bold text-white transition-all placeholder:text-gray-600 focus:border-red-500/50 focus:bg-[#1a1a20] focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="Height"
              />
            </div>
          </div>

          {/* Input Group: Goals */}
          <div className="group">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors group-focus-within:text-red-400">
              Primary Directive (Goals)
            </label>
            <textarea
              value={profileForm.fitnessGoals}
              onChange={(e) => setProfileForm({ ...profileForm, fitnessGoals: e.target.value })}
              className="w-full rounded-2xl border border-white/5 bg-[#141419] px-4 py-3.5 text-sm font-bold text-white transition-all placeholder:text-gray-600 focus:border-red-500/50 focus:bg-[#1a1a20] focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
              rows={3}
              placeholder="What are we building towards?"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 relative group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10">{savingProfile ? "Syncing Data..." : "Update Protocol"}</span>
          </button>
        </div>
      </div>

      {/* 3. System Actions Area */}
      <div className="space-y-3">
        {user?.role === "admin" && (
          <button
            onClick={() => router.push("/admin")}
            className="group flex w-full items-center justify-between rounded-2xl border border-amber-500/20 bg-[#16110b] p-4 transition-all hover:bg-amber-500/10 hover:border-amber-500/40 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.95 11.95 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-amber-500">Command Override</span>
                <span className="block text-[10px] text-amber-500/70 uppercase tracking-wider mt-0.5">Access Admin Panel</span>
              </div>
            </div>
            <span className="text-amber-500/50 group-hover:translate-x-1 group-hover:text-amber-500 transition-all">→</span>
          </button>
        )}

        <button
          onClick={() => {
            const deferredPrompt = (window as any).deferredPrompt;
            if (deferredPrompt) {
              deferredPrompt.prompt();
            }
          }}
          className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#0e0e12] p-4 transition-all hover:bg-[#141419] hover:border-white/10 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-white">Install Application</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Add to Home Screen</span>
            </div>
          </div>
          <span className="text-gray-600 group-hover:translate-x-1 group-hover:text-white transition-all">→</span>
        </button>

        <button
          onClick={handleLogout}
          className="group flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#0e0e12] p-4 transition-all hover:bg-red-950/20 hover:border-red-500/30 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500 group-hover:scale-110 group-hover:bg-red-500/20 transition-all">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-red-500">Terminate Session</span>
              <span className="block text-[10px] text-red-500/70 uppercase tracking-wider mt-0.5">Secure Logout</span>
            </div>
          </div>
          <span className="text-red-500/50 group-hover:translate-x-1 group-hover:text-red-500 transition-all">→</span>
        </button>
      </div>
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