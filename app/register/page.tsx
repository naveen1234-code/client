"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

type RegistrationStep = {
  id: number;
  title: string;
  subtitle: string;
};

const REGISTRATION_STEPS: RegistrationStep[] = [
  {
    id: 1,
    title: "Identity",
    subtitle: "Basic profile and login details",
  },
  {
    id: 2,
    title: "Contact",
    subtitle: "Phone, address, and social details",
  },
  {
    id: 3,
    title: "Training",
    subtitle: "Programs, health, and body details",
  },
  {
    id: 4,
    title: "Finish",
    subtitle: "Payment, signature, and security",
  },
];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:bg-black/70";

const selectClass =
  "w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-sm text-white outline-none transition focus:border-red-500 focus:bg-black/70";

const labelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400";

const sectionCardClass =
  "rounded-[30px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur sm:p-7";

export default function RegisterPage() {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    membershipNo: "",
    powerTraining: false,
    fatBurning: false,
    zumba: false,
    yoga: false,
    nicPassport: "",
    age: "",
    fullName: "",
    title: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    sex: "",
    address: "",
    homeNumber: "",
    mobileNumber: "",
    facebookId: "",
    instaId: "",
    company: "",
    profession: "",
    weight: "",
    height: "",
    medicalNotes: "",
    payment: "",
    email: "",
    password: "",
    memberSignature: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAccessAppPopup, setShowAccessAppPopup] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const currentStepData = useMemo(
    () =>
      REGISTRATION_STEPS.find((step) => step.id === currentStep) ||
      REGISTRATION_STEPS[0],
    [currentStep]
  );

  const progressPercent = useMemo(() => {
    return Math.round((currentStep / REGISTRATION_STEPS.length) * 100);
  }, [currentStep]);

  useEffect(() => {
    const existingScript = document.getElementById("cf-turnstile-script");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "cf-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    (
      window as typeof window & {
        onTurnstileSuccess?: (token: string) => void;
        onTurnstileExpired?: () => void;
        onTurnstileError?: () => void;
      }
    ).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
      setError("");
    };

    (
      window as typeof window & {
        onTurnstileSuccess?: (token: string) => void;
        onTurnstileExpired?: () => void;
        onTurnstileError?: () => void;
      }
    ).onTurnstileExpired = () => {
      setTurnstileToken("");
    };

    (
      window as typeof window & {
        onTurnstileSuccess?: (token: string) => void;
        onTurnstileExpired?: () => void;
        onTurnstileError?: () => void;
      }
    ).onTurnstileError = () => {
      setTurnstileToken("");
      setError("Bot protection failed. Please try again.");
    };

    return () => {
      delete (
        window as typeof window & {
          onTurnstileSuccess?: (token: string) => void;
          onTurnstileExpired?: () => void;
          onTurnstileError?: () => void;
        }
      ).onTurnstileSuccess;

      delete (
        window as typeof window & {
          onTurnstileSuccess?: (token: string) => void;
          onTurnstileExpired?: () => void;
          onTurnstileError?: () => void;
        }
      ).onTurnstileExpired;

      delete (
        window as typeof window & {
          onTurnstileSuccess?: (token: string) => void;
          onTurnstileExpired?: () => void;
          onTurnstileError?: () => void;
        }
      ).onTurnstileError;
    };
  }, []);

  useEffect(() => {
    const savedForm = sessionStorage.getItem("gymRavanaRegisterForm");
    const savedTermsAccepted = sessionStorage.getItem("gymRavanaTermsAccepted");

    if (savedForm) {
      setFormData(JSON.parse(savedForm));
    }

    if (savedTermsAccepted === "true") {
      setTermsAccepted(true);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("gymRavanaRegisterForm", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("gymRavanaTermsAccepted", String(termsAccepted));
  }, [termsAccepted]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSignature = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError("Please add member signature");
      return;
    }

    const signatureDataUrl = signatureRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    setFormData((prev) => ({
      ...prev,
      memberSignature: signatureDataUrl,
    }));

    setError("");
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }

    setFormData((prev) => ({
      ...prev,
      memberSignature: "",
    }));
  };

  const validateStepBeforeNext = () => {
    setError("");

    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setError("Please enter your full name.");
        return false;
      }

      if (!formData.email.trim()) {
        setError("Please enter your email address.");
        return false;
      }

      if (!formData.password.trim()) {
        setError("Please create a password.");
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStepBeforeNext()) {
      scrollToTop();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, REGISTRATION_STEPS.length));
    setError("");
    scrollToTop();
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
    scrollToTop();
  };

  const submitRegistration = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Registration failed");
        return;
      }

      setSuccess("Member registered successfully");
      sessionStorage.removeItem("gymRavanaRegisterForm");
      sessionStorage.removeItem("gymRavanaTermsAccepted");
      setShowAccessAppPopup(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setError("");

    if (!formData.memberSignature) {
      setError("Please save your signature before submitting.");
      scrollToTop();
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the bot protection check before submitting.");
      scrollToTop();
      return;
    }

    setShowTermsPopup(true);
  };

  const handleConfirmTermsAndSubmit = async () => {
    if (!termsAccepted) {
      setError("You must agree to the Terms & Conditions before submitting.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the bot protection check before submitting.");
      return;
    }

    setShowTermsPopup(false);
    await submitRegistration();
  };

  const trainingOptions = [
    {
      name: "powerTraining",
      title: "Power Training",
      description: "Strength, muscle building, and performance training.",
      active: formData.powerTraining,
    },
    {
      name: "fatBurning",
      title: "Fat Burning",
      description: "Weight control, conditioning, and calorie-focused workouts.",
      active: formData.fatBurning,
    },
    {
      name: "zumba",
      title: "Zumba",
      description: "High-energy dance fitness and cardio sessions.",
      active: formData.zumba,
    },
    {
      name: "yoga",
      title: "Yoga",
      description: "Mobility, calm breathing, flexibility, and recovery.",
      active: formData.yoga,
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-140px] top-[80px] h-[340px] w-[340px] rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute right-[-120px] top-[180px] h-[280px] w-[280px] rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-[-140px] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.16),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:34px_34px] opacity-[0.18]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6">
        <section className="rounded-[34px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Gym Ravana Registration
              </p>

              <h1 className="mt-5 text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-6xl">
                Start Your
                <span className="block text-red-500">Membership</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                Complete your Gym Ravana application in a modern step-by-step flow.
                Your final application PDF will still be generated in the official formal format.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-300">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Digital Form
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Secure Verification
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Official PDF
                </span>
              </div>
            </div>

            <div className="rounded-[30px] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-red-300">
                    Step {currentStep} of {REGISTRATION_STEPS.length}
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase text-white">
                    {currentStepData.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    {currentStepData.subtitle}
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-xl font-black text-red-400">
                  {progressPercent}%
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-red-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {REGISTRATION_STEPS.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (step.id <= currentStep) {
                        setCurrentStep(step.id);
                        setError("");
                        scrollToTop();
                      }
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      step.id === currentStep
                        ? "border-red-500/40 bg-red-500/15 text-white"
                        : step.id < currentStep
                          ? "border-green-500/20 bg-green-500/10 text-green-300"
                          : "border-white/10 bg-black/30 text-gray-500"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                      {String(step.id).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-xs font-bold">{step.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-semibold text-green-300">
            {success}
          </div>
        )}

        <form className="space-y-6">
          {currentStep === 1 && (
            <section className={sectionCardClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    Identity & Account
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                    Tell Us Who You Are
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    These details create your Gym Ravana member account and official application record.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Back Home
                </button>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Title</label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Select title</option>
                    <option value="Rev">Rev</option>
                    <option value="Dr">Dr</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>NIC / Passport</label>
                  <input
                    name="nicPassport"
                    value={formData.nicPassport}
                    onChange={handleChange}
                    placeholder="NIC or passport number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Age"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Application Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Membership No</label>
                  <input
                    name="membershipNo"
                    value={formData.membershipNo}
                    onChange={handleChange}
                    placeholder="For official use if needed"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1fr_1fr_1fr]">
                <div>
                  <label className={labelClass}>Birth Day</label>
                  <input
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    placeholder="DD"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Birth Month</label>
                  <input
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    placeholder="MM"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Birth Year</label>
                  <input
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    placeholder="YYYY"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Sex</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </section>
          )}
  {currentStep === 2 && (
            <section className={sectionCardClass}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Contact Details
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  How We Contact You
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-400">
                  Add your phone number and address correctly so Gym Ravana can send important
                  membership and system updates.
                </p>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Home Address</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your home address"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Mobile Number</label>
                  <input
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="0771234567"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs leading-6 text-red-300">
                    Recommended: SMS alerts, access notices, and membership updates use this number.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Home Number</label>
                  <input
                    name="homeNumber"
                    value={formData.homeNumber}
                    onChange={handleChange}
                    placeholder="Home phone number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Facebook ID</label>
                  <input
                    name="facebookId"
                    value={formData.facebookId}
                    onChange={handleChange}
                    placeholder="Facebook profile / ID"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Instagram ID</label>
                  <input
                    name="instaId"
                    value={formData.instaId}
                    onChange={handleChange}
                    placeholder="@username"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-7 rounded-[24px] border border-red-500/20 bg-red-500/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-300">
                  Contact Accuracy
                </p>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  Please double-check your mobile number. After registration, Gym Ravana may use it
                  for membership activation messages, system updates, and important gym notices.
                </p>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section className={sectionCardClass}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Training & Health Profile
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Choose Your Focus
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-400">
                  Select your training interests and add body / health details for your application.
                </p>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {trainingOptions.map((item) => (
                  <label
                    key={item.name}
                    className={`group cursor-pointer rounded-[24px] border p-5 transition duration-300 ${
                      item.active
                        ? "border-red-500/50 bg-red-500/15 shadow-[0_0_30px_rgba(239,68,68,0.18)]"
                        : "border-white/10 bg-black/30 hover:border-red-500/30 hover:bg-red-500/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name={item.name}
                      checked={item.active}
                      onChange={handleChange}
                      className="sr-only"
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black uppercase tracking-tight text-white">
                          {item.title}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-gray-400">
                          {item.description}
                        </p>
                      </div>

                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                          item.active
                            ? "border-red-400 bg-red-500 text-white"
                            : "border-white/20 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Company</label>
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company / workplace"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Profession</label>
                  <input
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="Profession"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Weight</label>
                  <input
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Weight"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Height</label>
                  <input
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Height"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Illnesses / Injuries / Medical Notes</label>
                  <textarea
                    name="medicalNotes"
                    value={formData.medicalNotes}
                    onChange={handleChange}
                    rows={6}
                    placeholder="If you have any type of illnesses or injuries, please mention here."
                    className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:bg-black/70"
                  />
                </div>
              </div>

              <div className="mt-7 rounded-[24px] border border-yellow-500/20 bg-yellow-500/10 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-300">
                  Health Notice
                </p>
                <p className="mt-3 text-sm leading-7 text-yellow-100/90">
                  Mention any injuries or medical concerns clearly. This helps the gym understand
                  your condition before training.
                </p>
              </div>
            </section>
          )}

          {currentStep === 4 && (
            <section className={sectionCardClass}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Final Step
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Payment, Signature & Security
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-400">
                  Complete the final confirmation details before submitting your official application.
                </p>
              </div>

              <div className="mt-7 rounded-[26px] border border-white/10 bg-black/30 p-5">
                <label className={labelClass}>Payment Details</label>
                <textarea
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter payment details..."
                  className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500 focus:bg-black/70"
                />
              </div>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-black/30 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-400">
                  Important Rules
                </p>

                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-300">
                  <li>
                    We are not responsible for injuries caused by exercises not recommended by the
                    instructor.
                  </li>
                  <li>Cash is non-refundable.</li>
                  <li>You must follow all GYM RAVANA rules and regulations.</li>
                  <li>Management decisions are final.</li>
                </ul>

                <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-7 text-gray-200">
                  I certify that the above information is accurate to the best of my knowledge.
                </p>
              </div>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-black/30 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-400">
                      Member Signature
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Sign inside the box and press Save Signature before submitting.
                    </p>
                  </div>

                  {formData.memberSignature && (
                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-green-300">
                      Signature Saved
                    </span>
                  )}
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="black"
                    backgroundColor="white"
                    canvasProps={{
                      className: "h-44 w-full",
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSaveSignature}
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-red-700"
                  >
                    Save Signature
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-black/30 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-400">
                  Bot Protection
                </p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white p-4">
                  <div
                    className="cf-turnstile"
                    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    data-callback="onTurnstileSuccess"
                    data-expired-callback="onTurnstileExpired"
                    data-error-callback="onTurnstileError"
                  />
                </div>

                <p className="mt-3 text-sm leading-7 text-gray-400">
                  Please complete the security check before submitting the form.
                </p>

                {turnstileToken && (
                  <p className="mt-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
                    Security check completed.
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="rounded-[30px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">
                  Registration Progress
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  Step {currentStep} of {REGISTRATION_STEPS.length}:{" "}
                  <span className="font-bold text-white">{currentStepData.title}</span>
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Back
                  </button>
                )}

                {currentStep < REGISTRATION_STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-red-700"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Submitting..." : "Submit Membership Form"}
                  </button>
                )}
              </div>
            </div>
          </section>
          </form>
      </div>

      {showTermsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-7">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
              Final Agreement
            </p>

            <h3 className="mt-4 text-center text-3xl font-black uppercase tracking-tight text-white">
              Terms & Conditions
            </h3>

            <p className="mt-4 text-center text-sm leading-7 text-gray-300">
              Please confirm that you have read, understood, and agreed to the Gym Ravana
              Terms & Conditions before final submission.
            </p>

            <div className="mt-6 rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 text-center">
              <p className="text-base font-black uppercase tracking-wide text-white">
                Official Confirmation
              </p>

              <p className="mt-3 text-sm leading-7 text-gray-300">
                By continuing, you confirm that the information you entered is accurate and
                that you agree to follow Gym Ravana rules and regulations.
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <button
                type="button"
                onClick={() => window.open("/terms", "_blank", "noopener,noreferrer")}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Open Full Terms Page
              </button>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm font-semibold leading-6 text-gray-200">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I have read and agree to the Gym Ravana Terms & Conditions.
                </span>
              </label>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowTermsPopup(false);
                  setTermsAccepted(false);
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmTermsAndSubmit}
                disabled={loading}
                className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Agree & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccessAppPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#090909] p-6 shadow-2xl sm:p-7">
            <div className="text-center">
              <p className="inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-green-300">
                Registration Complete
              </p>

              <h3 className="mt-5 text-3xl font-black uppercase tracking-tight text-white">
                Welcome To Gym Ravana
              </h3>

              <p className="mt-4 text-sm font-semibold leading-7 text-gray-300">
                Your Gym Ravana account has been created successfully. Your official
                application PDF has been generated and submitted to the system.
              </p>
            </div>

            <div className="mt-6 rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 text-center">
              <p className="text-base font-black uppercase tracking-wide text-white">
                Install Access App
              </p>

              <p className="mt-3 text-sm leading-7 text-gray-300">
                For easier gym entry and exit, login and install the Gym Ravana Access App
                on your phone home screen.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setShowAccessAppPopup(false);
                  router.push("/login");
                }}
                className="rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
              >
                Go To Login
              </button>

              <button
                type="button"
                onClick={() => setShowAccessAppPopup(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}