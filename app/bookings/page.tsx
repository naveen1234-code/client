"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

type BookingType = {
  _id: string;
  bookingType: string;
  bookingName: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
};

export default function BookingsPage() {
  const router = useRouter();

  const [bookingType, setBookingType] = useState("class");
  const [bookingName, setBookingName] = useState("Zumba");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("8:00 AM");

  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/bookings/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to load bookings");
      } else {
        setBookings(data);
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookingTypeChange = (value: string) => {
    setBookingType(value);

    if (value === "class") {
      setBookingName("Zumba");
      setBookingTime("8:00 AM");
    } else {
      setBookingName("Personal Trainer Session");
      setBookingTime("6:00 PM");
    }
  };

  const handleCreateBooking = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const res = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingType,
          bookingName,
          bookingDate,
          bookingTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to create booking");
        return;
      }

      setMessage("Booking created successfully ✅");
      setBookingDate("");
      fetchBookings();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
                Booking Center
              </p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Class & Trainer
                <span className="block text-red-500">Bookings</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                Reserve your class or personal training session directly from
                your member account.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Create Booking
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                Book Now
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Booking Type
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) => handleBookingTypeChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="class">Class Booking</option>
                    <option value="trainer">Trainer Booking</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Booking Name
                  </label>
                  <input
                    type="text"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Booking Time
                  </label>
                  <input
                    type="text"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />
                </div>

                <button
                  onClick={handleCreateBooking}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Booking..." : "Create Booking"}
                </button>

                {message && (
                  <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm font-semibold text-green-300">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Booking History
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                My Bookings
              </h2>

              {loading ? (
                <p className="mt-6 text-gray-400">Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="mt-6 text-gray-400">No bookings found yet.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4"
                    >
                      <p>
                        <span className="font-semibold text-gray-400">Type:</span>{" "}
                        {booking.bookingType}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Name:</span>{" "}
                        {booking.bookingName}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Date:</span>{" "}
                        {booking.bookingDate}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Time:</span>{" "}
                        {booking.bookingTime}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Status:</span>{" "}
                        <span className="text-yellow-400">{booking.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}