"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

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

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [showTermsPopup, setShowTermsPopup] = useState(false);
const [termsAccepted, setTermsAccepted] = useState(false);
const [showAccessAppPopup, setShowAccessAppPopup] = useState(false);
const [turnstileToken, setTurnstileToken] = useState("");

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
  (window as typeof window & {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
  }).onTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    setError("");
  };

  (window as typeof window & {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
  }).onTurnstileExpired = () => {
    setTurnstileToken("");
  };

  (window as typeof window & {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
  }).onTurnstileError = () => {
    setTurnstileToken("");
    setError("Bot protection failed. Please try again.");
  };

  return () => {
    delete (window as typeof window & {
      onTurnstileSuccess?: (token: string) => void;
      onTurnstileExpired?: () => void;
      onTurnstileError?: () => void;
    }).onTurnstileSuccess;

    delete (window as typeof window & {
      onTurnstileSuccess?: (token: string) => void;
      onTurnstileExpired?: () => void;
      onTurnstileError?: () => void;
    }).onTurnstileExpired;

    delete (window as typeof window & {
      onTurnstileSuccess?: (token: string) => void;
      onTurnstileExpired?: () => void;
      onTurnstileError?: () => void;
    }).onTurnstileError;
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-black">
      <div className="mx-auto max-w-5xl rounded-md bg-white p-4 shadow-lg sm:p-8">
        <form className="border border-black p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-[0.2em]">GYM</h1>
              <h2 className="text-3xl font-black tracking-[0.2em]">RAVANA</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.4em]">
                Not Only Body
              </p>
              <p className="mt-3 text-base font-semibold">No:69/F Siriwardana Road Ragama</p>
              <p className="text-base font-semibold">Tell: 077 50 33333</p>
              <h3 className="mt-5 text-xl font-bold uppercase underline">
                Membership Application Form
              </h3>
            </div>

            <div className="border border-black p-3 text-sm">
              <p className="font-semibold">For official use only</p>
              <label className="mt-2 block font-bold uppercase">Membership No:</label>
              <input
                name="membershipNo"
                value={formData.membershipNo}
                onChange={handleChange}
                className="mt-2 w-full border-b border-black bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="border border-black p-3">
              <label className="block text-sm font-bold">Date:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-2 w-full bg-transparent outline-none"
              />
            </div>
            <div />
          </div>

          <div className="mt-4 grid grid-cols-2 border border-black text-center text-sm font-bold md:grid-cols-4">
            <label className="border-r border-b border-black p-2 md:border-b-0">
              <input
                type="checkbox"
                name="powerTraining"
                checked={formData.powerTraining}
                onChange={handleChange}
                className="mr-2"
              />
              Power Training
            </label>

            <label className="border-b border-black p-2 md:border-b-0 md:border-r border-black">
              <input
                type="checkbox"
                name="fatBurning"
                checked={formData.fatBurning}
                onChange={handleChange}
                className="mr-2"
              />
              Fat Burning
            </label>

            <label className="border-r border-black p-2">
              <input
                type="checkbox"
                name="zumba"
                checked={formData.zumba}
                onChange={handleChange}
                className="mr-2"
              />
              Zumba
            </label>

            <label className="p-2">
              <input
                type="checkbox"
                name="yoga"
                checked={formData.yoga}
                onChange={handleChange}
                className="mr-2"
              />
              Yoga
            </label>
          </div>

          <section className="mt-6">
            <h4 className="border border-black bg-neutral-100 p-2 text-center text-lg font-bold">
              General Information
            </h4>

            <div className="border-x border-b border-black">
              <div className="grid border-b border-black md:grid-cols-[260px_1fr]">
                <div className="border-r border-black p-2 font-semibold">NIC/Passport</div>
                <input
                  name="nicPassport"
                  value={formData.nicPassport}
                  onChange={handleChange}
                  className="p-2 outline-none"
                />
              </div>

              <div className="grid border-b border-black md:grid-cols-[260px_1fr]">
                <div className="border-r border-black p-2 font-semibold">Age</div>
                <input
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="p-2 outline-none"
                />
              </div>

              <div className="grid border-b border-black md:grid-cols-[260px_1fr]">
                <div className="border-r border-black p-2 font-semibold">
                  Full Name / Rev / Dr / Mr / Mrs / Miss
                </div>

                <div className="grid gap-2 p-2 md:grid-cols-[1fr_160px]">
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="outline-none"
                  />

                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="outline-none"
                  >
                    <option value="">Select title</option>
                    <option value="Rev">Rev</option>
                    <option value="Dr">Dr</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-[260px_1fr_120px_1fr]">
                <div className="border-r border-b border-black p-2 font-semibold">
                  Date of Birth
                </div>

                <div className="grid grid-cols-3 border-b border-black">
                  <input
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    placeholder="DD"
                    className="border-r border-black p-2 text-center outline-none"
                  />
                  <input
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    placeholder="MM"
                    className="border-r border-black p-2 text-center outline-none"
                  />
                  <input
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    placeholder="YYYY"
                    className="p-2 text-center outline-none"
                  />
                </div>

                <div className="border-r border-b border-black p-2 text-center font-semibold">
                  Sex
                </div>

                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="border-b border-black p-2 outline-none"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h4 className="border border-black bg-neutral-100 p-2 text-center text-lg font-bold">
              Contact Information
            </h4>

            <div className="border-x border-b border-black">
              <div className="grid border-b border-black md:grid-cols-2">
                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Home Address</div>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="border-r border-black p-2 outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Home Number</div>
                  <input
                    name="homeNumber"
                    value={formData.homeNumber}
                    onChange={handleChange}
                    className="p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid border-b border-black md:grid-cols-2">
                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Facebook ID</div>
                  <input
                    name="facebookId"
                    value={formData.facebookId}
                    onChange={handleChange}
                    className="border-r border-black p-2 outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Mobile Number</div>
                  <input
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    className="p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2">
                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Insta ID</div>
                  <input
                    name="instaId"
                    value={formData.instaId}
                    onChange={handleChange}
                    className="border-r border-black p-2 outline-none"
                  />
                </div>

                <div />
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h4 className="border border-black bg-neutral-100 p-2 text-center text-lg font-bold">
              Professional Details
            </h4>

            <div className="grid border-x border-b border-black md:grid-cols-2">
              <div className="grid md:grid-cols-[180px_1fr]">
                <div className="border-r border-black p-2 font-semibold">Company</div>
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="border-r border-black p-2 outline-none"
                />
              </div>

              <div className="grid md:grid-cols-[180px_1fr]">
                <div className="border-r border-black p-2 font-semibold">Profession</div>
                <input
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="p-2 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h4 className="border border-black bg-neutral-100 p-2 text-center text-lg font-bold">
              Bio Data
            </h4>

            <div className="border-x border-b border-black">
              <div className="grid border-b border-black md:grid-cols-2">
                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Weight</div>
                  <input
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="border-r border-black p-2 outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-[180px_1fr]">
                  <div className="border-r border-black p-2 font-semibold">Height</div>
                  <input
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-[350px_1fr]">
                <div className="border-r border-black p-3 text-center font-semibold leading-6">
                  If you have any type of illnesses or injuries
                  <br />
                  please mention here.
                </div>

                <textarea
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleChange}
                  rows={5}
                  className="p-2 outline-none"
                />
              </div>
            </div>
          </section>
    <section className="mt-6">
            <h4 className="border border-black bg-neutral-100 p-2 text-center text-lg font-bold">
              Payment Details
            </h4>

            <div className="border-x border-b border-black">
              <textarea
                name="payment"
                value={formData.payment}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 outline-none"
                placeholder="Enter payment details..."
              />
            </div>
          </section>

          <section className="mt-6 border border-black p-3 text-sm leading-6">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                We are not responsible for injuries caused by exercises not recommended by the
                instructor.
              </li>
              <li>Cash is non-refundable.</li>
              <li>You must follow all GYM RAVANA rules and regulations.</li>
              <li>Management decisions are final.</li>
            </ul>
          </section>

          <section className="mt-6 text-center font-semibold">
            <p>I certify that the above information is accurate to the best of my knowledge.</p>
          </section>

          <section className="mt-6 border border-black p-4">
            <h4 className="mb-4 text-center text-lg font-bold">System Login Details</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-black p-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-black p-3 outline-none"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 border border-red-600 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 border border-green-600 bg-green-50 p-3 text-sm font-semibold text-green-700">
              {success}
            </div>
          )}

          <section className="mt-8 border border-black p-4">
            <h4 className="mb-4 text-center text-lg font-bold">Member Signature</h4>

            <div className="border border-black bg-white">
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                backgroundColor="white"
                canvasProps={{
                  className: "h-40 w-full",
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveSignature}
                className="rounded border border-black px-4 py-2 text-sm font-bold transition hover:bg-black hover:text-white"
              >
                Save Signature
              </button>

              <button
                type="button"
                onClick={handleClearSignature}
                className="rounded border border-black px-4 py-2 text-sm font-bold transition hover:bg-black hover:text-white"
              >
                Clear Signature
              </button>
            </div>

            {formData.memberSignature && (
              <p className="mt-3 text-sm font-semibold text-green-700">
                Signature saved successfully
              </p>
            )}
          </section>

          <div className="mt-8 border border-black p-4">
  <h4 className="mb-3 text-center text-lg font-bold">Bot Protection</h4>

  <div
    className="cf-turnstile"
    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    data-callback="onTurnstileSuccess"
    data-expired-callback="onTurnstileExpired"
    data-error-callback="onTurnstileError"
  />

  <p className="mt-3 text-center text-sm text-neutral-700">
    Please complete the security check before submitting the form.
  </p>
</div>

          <button
  type="button"
  onClick={handleSubmit}
  disabled={loading}
  className="mt-8 w-full border border-black bg-black py-4 text-lg font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
>
  {loading ? "Submitting..." : "Submit Membership Form"}
</button>
        </form>
      </div>

      {showTermsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-black bg-white p-4 shadow-2xl sm:p-6">
            <h3 className="text-center text-2xl font-black uppercase tracking-wide text-black">
              Terms & Conditions Agreement
            </h3>

            <p className="mt-3 text-center text-sm font-semibold text-neutral-700">
              Please review the Gym Ravana Terms & Conditions before final submission.
            </p>

            <div className="mt-5 rounded-xl border border-black bg-neutral-50 p-4 text-center">
  <p className="text-base font-bold text-black">
    By continuing, you confirm that you have read, understood, and agreed to the
    Gym Ravana Terms & Conditions.
  </p>
  <p className="mt-3 text-sm leading-6 text-neutral-700">
    Please open the full terms page if you want to review every rule before final submission.
  </p>
</div>

            <div className="mt-5 flex flex-col gap-4">
              <button
  type="button"
  onClick={() => window.open("/terms", "_blank", "noopener,noreferrer")}
  className="inline-flex items-center justify-center border border-black px-4 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
>
  Open Full Terms Page
</button>

              <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-black">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>I have read and agree to the Gym Ravana Terms & Conditions.</span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowTermsPopup(false);
                  setTermsAccepted(false);
                }}
                className="border border-black px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmTermsAndSubmit}
                disabled={loading}
                className="bg-black px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Agree & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showAccessAppPopup && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-lg rounded-2xl border border-black bg-white p-5 shadow-2xl sm:p-6">
      <h3 className="text-center text-2xl font-black uppercase tracking-wide text-black">
        Registration Successful
      </h3>

      <p className="mt-3 text-center text-sm font-semibold text-neutral-700">
        Your Gym Ravana account has been created successfully.
      </p>

      <div className="mt-5 rounded-xl border border-black bg-neutral-50 p-4 text-center">
        <p className="text-base font-black uppercase tracking-wide text-black">
          Install Access App
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          For easier gym entry, install the Access App on your phone home screen after login.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setShowAccessAppPopup(false);
            router.push("/login");
          }}
          className="border border-black px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
        >
          Go to Login
        </button>

        <button
          type="button"
          onClick={() => setShowAccessAppPopup(false)}
          className="bg-black px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
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