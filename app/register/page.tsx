"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Registration failed");
        return;
      }

      setSuccess("Member registered successfully");

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-black">
      <div className="mx-auto max-w-5xl rounded-md bg-white p-4 shadow-lg sm:p-8">
        <form onSubmit={handleSubmit} className="border border-black p-4">
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

          <section className="mt-10 grid grid-cols-2 text-center">
            <div>
              <div className="mx-auto mt-10 w-40 border-t border-black"></div>
              <p className="mt-2">Instructor</p>
            </div>

            <div>
              <div className="mx-auto mt-10 w-40 border-t border-black"></div>
              <p className="mt-2">Member</p>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full border border-black bg-black py-4 text-lg font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Submitting..." : "Submit Membership Form"}
          </button>
        </form>
      </div>
    </main>
  );
}