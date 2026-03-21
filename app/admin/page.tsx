"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

type UserType = {
  _id: string;
  name: string;
  email: string;
  role: string;
  membershipStatus?: string;
  membershipPlan?: string;
  membershipStartDate?: string | null;
  membershipEndDate?: string | null;
  totalDays?: number;
  remainingDays?: number;
  attendanceCount?: number;
  lastCheckIn?: string | null;
};

type MembershipFormType = {
  userId: string;
  membershipStatus: string;
  membershipPlan: string;
  membershipStartDate: string;
  membershipEndDate: string;
  totalDays: string;
  remainingDays: string;
};

type PaymentType = {
  _id: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

type BookingType = {
  _id: string;
  userName: string;
  userEmail: string;
  bookingType: string;
  bookingName: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [bookings, setBookings] = useState<BookingType[]>([]);
const [bookingsLoading, setBookingsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [error, setError] = useState("");

  const [membershipForm, setMembershipForm] = useState<MembershipFormType>({
    userId: "",
    membershipStatus: "active",
    membershipPlan: "1 Month",
    membershipStartDate: "",
    membershipEndDate: "",
    totalDays: "",
    remainingDays: "",
  });

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const meRes = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const meData = await meRes.json();

        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        if (meData.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setCurrentUser(meData);

        const usersRes = await fetch("http://localhost:5000/api/auth/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const usersData = await usersRes.json();

        if (usersRes.ok) {
          setUsers(usersData);
        }

        const paymentsRes = await fetch(
          "http://localhost:5000/api/payments/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const paymentsData = await paymentsRes.json();

        if (paymentsRes.ok) {
          setPayments(paymentsData);
        }
      } catch (error) {
        console.error("Admin fetch error:", error);
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
        setPaymentsLoading(false);
        setBookingsLoading(false);
      }

      const bookingsRes = await fetch("http://localhost:5000/api/bookings/all", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const bookingsData = await bookingsRes.json();

if (bookingsRes.ok) {
  setBookings(bookingsData);
}
    };

    fetchAdminData();
  }, [router]);

  const handleMembershipUpdate = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    if (
      !membershipForm.userId ||
      !membershipForm.membershipStatus ||
      !membershipForm.membershipPlan
    ) {
      setError("Please fill user ID, status, and plan");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const res = await fetch("http://localhost:5000/api/auth/membership", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: membershipForm.userId,
          membershipStatus: membershipForm.membershipStatus,
          membershipPlan: membershipForm.membershipPlan,
          membershipStartDate: membershipForm.membershipStartDate || null,
          membershipEndDate: membershipForm.membershipEndDate || null,
          totalDays: membershipForm.totalDays
            ? Number(membershipForm.totalDays)
            : 0,
          remainingDays: membershipForm.remainingDays
            ? Number(membershipForm.remainingDays)
            : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update membership");
        return;
      }

      setSuccessMessage("Membership updated successfully ✅");

      const usersRes = await fetch("http://localhost:5000/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const usersData = await usersRes.json();

      if (usersRes.ok) {
        setUsers(usersData);
      }
    } catch (err) {
      setError("Something went wrong while updating membership");
    }
  };

  const handleSelectUser = (user: UserType) => {
    setMembershipForm({
      userId: user._id,
      membershipStatus: user.membershipStatus || "inactive",
      membershipPlan: user.membershipPlan || "No Plan",
      membershipStartDate: user.membershipStartDate
        ? new Date(user.membershipStartDate).toISOString().split("T")[0]
        : "",
      membershipEndDate: user.membershipEndDate
        ? new Date(user.membershipEndDate).toISOString().split("T")[0]
        : "",
      totalDays: user.totalDays !== undefined ? String(user.totalDays) : "",
      remainingDays:
        user.remainingDays !== undefined ? String(user.remainingDays) : "",
    });

    setSuccessMessage("");
    setError("");
  };

  const handleBookingStatusUpdate = async (
  bookingId: string,
  status: "approved" | "cancelled"
) => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("No token found");
    return;
  }

  try {
    setError("");

    const res = await fetch("http://localhost:5000/api/bookings/status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookingId,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to update booking");
      return;
    }

    const bookingsRes = await fetch("http://localhost:5000/api/bookings/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const bookingsData = await bookingsRes.json();

    if (bookingsRes.ok) {
      setBookings(bookingsData);
    }
  } catch (err) {
    setError("Something went wrong while updating booking");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const paidPayments = useMemo(
    () => payments.filter((payment) => payment.status === "paid"),
    [payments]
  );

  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.status === "pending"),
    [payments]
  );

  const totalRevenue = useMemo(
    () =>
      paidPayments.reduce((sum, payment) => {
        return sum + payment.amount;
      }, 0),
    [paidPayments]
  );

  const activeMembers = useMemo(
    () => users.filter((user) => user.membershipStatus === "active").length,
    [users]
  );

  const expiredMembers = useMemo(
    () => users.filter((user) => user.membershipStatus === "expired").length,
    [users]
  );

  const totalMembers = useMemo(() => users.length, [users]);

const todaysPayments = useMemo(() => {
  const today = new Date().toDateString();

  return payments.filter(
    (payment) => new Date(payment.createdAt).toDateString() === today
  ).length;
}, [payments]);

const todaysCheckIns = useMemo(() => {
  const today = new Date().toDateString();

  return users.filter(
    (user) =>
      user.lastCheckIn &&
      new Date(user.lastCheckIn).toDateString() === today
  ).length;
}, [users]);

const filteredUsers = useMemo(() => {
  return users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      user.membershipStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [users, searchTerm, statusFilter]);

const totalBookings = useMemo(() => bookings.length, [bookings]);

const pendingBookings = useMemo(
  () => bookings.filter((booking) => booking.status === "pending").length,
  [bookings]
);

const approvedBookings = useMemo(
  () => bookings.filter((booking) => booking.status === "approved").length,
  [bookings]
);

const cancelledBookings = useMemo(
  () => bookings.filter((booking) => booking.status === "cancelled").length,
  [bookings]
);

  if (loading) {
    return (
      <PageTransition>
        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 shadow-2xl backdrop-blur">
            Loading admin panel...
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-140px] top-[60px] h-[340px] w-[340px] rounded-full bg-red-600/20 blur-3xl animate-pulse" />
          <div className="absolute right-[-120px] top-[140px] h-[280px] w-[280px] rounded-full bg-red-500/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.08]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.18),transparent_35%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Gym Ravana Control Core
                </p>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                  Admin
                  <span className="block text-red-500">Revenue Dashboard</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                  Control memberships, monitor user activity, and track live
                  revenue performance from one futuristic admin system.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Home
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Member Dashboard
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>

            {currentUser && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
                <p className="text-sm text-gray-300">
                  Logged in as{" "}
                  <span className="font-bold text-white">{currentUser.name}</span>{" "}
                  • <span className="text-blue-400">{currentUser.role}</span>
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-[28px] border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-6 shadow-2xl">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-green-300">
      Total Revenue
    </p>
    <p className="mt-4 text-4xl font-black text-green-400">
      LKR {totalRevenue.toLocaleString()}
    </p>
    <p className="mt-2 text-sm text-green-200/80">
      From successful paid transactions
    </p>
  </div>

  <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-400">
      Total Members
    </p>
    <p className="mt-4 text-4xl font-black text-white">
      {totalMembers}
    </p>
    <p className="mt-2 text-sm text-gray-400">
      All registered users
    </p>
  </div>

  <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-400">
      Paid Payments
    </p>
    <p className="mt-4 text-4xl font-black text-white">
      {paidPayments.length}
    </p>
    <p className="mt-2 text-sm text-gray-400">
      Completed membership purchases
    </p>
  </div>

  <div className="rounded-[28px] border border-yellow-500/20 bg-yellow-500/10 p-6 shadow-2xl">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-yellow-300">
      Pending Payments
    </p>
    <p className="mt-4 text-4xl font-black text-yellow-400">
      {pendingPayments.length}
    </p>
    <p className="mt-2 text-sm text-yellow-200/80">
      Awaiting completion
    </p>
  </div>

  <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-400">
      Active Members
    </p>
    <p className="mt-4 text-4xl font-black text-white">
      {activeMembers}
    </p>
    <p className="mt-2 text-sm text-gray-400">
      Members with active access
    </p>
  </div>

  <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-400">
      Expired Members
    </p>
    <p className="mt-4 text-4xl font-black text-white">
      {expiredMembers}
    </p>
    <p className="mt-2 text-sm text-gray-400">
      Members needing renewal
    </p>
  </div>

  <div className="rounded-[28px] border border-blue-500/20 bg-blue-500/10 p-6 shadow-2xl">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-blue-300">
      Today’s Payments
    </p>
    <p className="mt-4 text-4xl font-black text-blue-400">
      {todaysPayments}
    </p>
    <p className="mt-2 text-sm text-blue-200/80">
      Payments created today
    </p>
  </div>

  <div className="rounded-[28px] border border-purple-500/20 bg-purple-500/10 p-6 shadow-2xl">
    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-purple-300">
      Today’s Check-Ins
    </p>
    <p className="mt-4 text-4xl font-black text-purple-400">
      {todaysCheckIns}
    </p>
    <p className="mt-2 text-sm text-purple-200/80">
      Members checked in today
    </p>
  </div>
</section>

          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-8">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Membership Control
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Update Member Plan
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="User ID"
                    value={membershipForm.userId}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        userId: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />

                  <select
                    value={membershipForm.membershipStatus}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        membershipStatus: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="expired">expired</option>
                  </select>

                  <select
                    value={membershipForm.membershipPlan}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        membershipPlan: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="No Plan">No Plan</option>
                  </select>

                  <input
                    type="date"
                    value={membershipForm.membershipStartDate}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        membershipStartDate: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />

                  <input
                    type="date"
                    value={membershipForm.membershipEndDate}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        membershipEndDate: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />

                  <input
                    type="number"
                    placeholder="Total Days"
                    value={membershipForm.totalDays}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        totalDays: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />

                  <input
                    type="number"
                    placeholder="Remaining Days"
                    value={membershipForm.remainingDays}
                    onChange={(e) =>
                      setMembershipForm({
                        ...membershipForm,
                        remainingDays: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />
                </div>

                <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-stretch">
  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-gray-300 xl:min-w-[260px]">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
      Update Preview
    </p>
    <p className="mt-2">
      User ID:{" "}
      <span className="font-semibold text-white">
        {membershipForm.userId || "Not selected"}
      </span>
    </p>
    <p className="mt-1">
      Status:{" "}
      <span className="font-semibold text-yellow-400">
        {membershipForm.membershipStatus}
      </span>
    </p>
    <p className="mt-1">
      Plan:{" "}
      <span className="font-semibold text-white">
        {membershipForm.membershipPlan}
      </span>
    </p>
    <p className="mt-1">
      Total / Remaining:{" "}
      <span className="font-semibold text-green-400">
        {membershipForm.totalDays || "0"} / {membershipForm.remainingDays || "0"}
      </span>
    </p>
  </div>

  <div className="flex flex-wrap items-center gap-3">
    <button
      onClick={handleMembershipUpdate}
      className="h-12 rounded-xl bg-red-600 px-6 text-sm font-bold uppercase tracking-[0.15em] text-white transition duration-300 hover:bg-red-700"
    >
      Update Membership
    </button>

    <button
      onClick={() => {
        setMembershipForm({
          userId: "",
          membershipStatus: "active",
          membershipPlan: "1 Month",
          membershipStartDate: "",
          membershipEndDate: "",
          totalDays: "",
          remainingDays: "",
        });
        setSuccessMessage("");
        setError("");
      }}
      className="h-12 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-bold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
    >
      Clear Form
    </button>
  </div>
</div>

{successMessage && (
  <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm font-semibold text-green-300">
    {successMessage}
  </div>
)}

                {successMessage && (
                  <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm font-semibold text-green-300">
                    {successMessage}
                  </div>
                )}
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Revenue Feed
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Latest Payments
                </h2>

                {paymentsLoading ? (
                  <p className="mt-6 text-gray-400">Loading payments...</p>
                ) : payments.length === 0 ? (
                  <p className="mt-6 text-gray-400">No payments found.</p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {payments.slice(0, 8).map((payment) => (
  <div
    key={payment._id}
    className="group rounded-[24px] border border-white/10 bg-black/40 p-4 transition duration-300 hover:border-red-500/20 hover:bg-black/55"
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-base font-black uppercase tracking-[0.08em] text-white">
          {payment.userName}
        </p>
        <p className="mt-1 text-sm text-gray-400 break-all">
          {payment.userEmail}
        </p>
      </div>

      <div
        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
          payment.status === "paid"
            ? "border border-green-500/20 bg-green-500/10 text-green-400"
            : payment.status === "pending"
            ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
            : "border border-red-500/20 bg-red-500/10 text-red-400"
        }`}
      >
        {payment.status}
      </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Plan
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {payment.planName}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Amount
        </p>
        <p className="mt-2 text-sm font-semibold text-green-400">
          LKR {payment.amount.toLocaleString()}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Date
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {new Date(payment.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  </div>
))}
                  </div>
                )}
              </div>
            </section>

            

            <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                Member Database
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                All Users
              </h2>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <input
    type="text"
    placeholder="Search by name or email..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full sm:max-w-sm rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full sm:w-auto rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500"
  >
    <option value="all">All</option>
    <option value="active">Active</option>
    <option value="expired">Expired</option>
    <option value="inactive">Inactive</option>
  </select>
</div>

              <div className="mt-6 space-y-4">
                {filteredUsers.map((user) => (
  <div
    key={user._id}
    className="group rounded-[24px] border border-white/10 bg-black/40 p-4 transition duration-300 hover:border-red-500/20 hover:bg-black/55"
  >
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-base font-black uppercase tracking-[0.08em] text-white">
          {user.name}
        </p>
        <p className="mt-1 text-sm text-gray-400 break-all">{user.email}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
          {user.role}
        </span>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
            user.membershipStatus === "active"
              ? "border border-green-500/20 bg-green-500/10 text-green-400"
              : user.membershipStatus === "expired"
              ? "border border-red-500/20 bg-red-500/10 text-red-400"
              : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {user.membershipStatus || "inactive"}
        </span>
      </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          User ID
        </p>
        <p className="mt-2 break-all text-sm font-semibold text-white">
          {user._id}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Plan
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {user.membershipPlan || "No Plan"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Total / Remaining
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {user.totalDays ?? 0} /{" "}
          <span className="text-green-400">{user.remainingDays ?? 0}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Attendance
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {user.attendanceCount ?? 0}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2 xl:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Last Check-In
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          {user.lastCheckIn
            ? new Date(user.lastCheckIn).toLocaleDateString()
            : "N/A"}
        </p>
      </div>
    </div>

    <div className="mt-4">
      <button
        onClick={() => handleSelectUser(user)}
        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
      >
        Select This User
      </button>
    </div>
  </div>
))}
              </div>
            </section>
            <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
    Booking Management
  </p>
  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
    All Bookings
  </h2>

  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
      Total Bookings
    </p>
    <p className="mt-2 text-3xl font-black text-white">
      {totalBookings}
    </p>
  </div>

  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300">
      Pending
    </p>
    <p className="mt-2 text-3xl font-black text-yellow-400">
      {pendingBookings}
    </p>
  </div>

  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
      Approved
    </p>
    <p className="mt-2 text-3xl font-black text-green-400">
      {approvedBookings}
    </p>
  </div>

  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
      Cancelled
    </p>
    <p className="mt-2 text-3xl font-black text-red-400">
      {cancelledBookings}
    </p>
  </div>
</div>

  {bookingsLoading ? (
    <p className="mt-6 text-gray-400">Loading bookings...</p>
  ) : bookings.length === 0 ? (
    <p className="mt-6 text-gray-400">No bookings found.</p>
  ) : (
    <div className="mt-6 space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking._id}
          className="rounded-[24px] border border-white/10 bg-black/40 p-4 transition duration-300 hover:border-red-500/20 hover:bg-black/55"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                {booking.userName}
              </p>
              <p className="mt-1 break-all text-sm text-gray-400">
                {booking.userEmail}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                {booking.bookingType}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                  booking.status === "approved"
                    ? "border border-green-500/20 bg-green-500/10 text-green-400"
                    : booking.status === "cancelled"
                    ? "border border-red-500/20 bg-red-500/10 text-red-400"
                    : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Booking Name
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {booking.bookingName}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Date
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {booking.bookingDate}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Time
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {booking.bookingTime}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
  <button
    onClick={() => handleBookingStatusUpdate(booking._id, "approved")}
    disabled={booking.status === "approved"}
    className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition duration-300 ${
      booking.status === "approved"
        ? "cursor-not-allowed bg-green-900/40 text-green-300/60"
        : "bg-green-600 hover:bg-green-700"
    }`}
  >
    {booking.status === "approved" ? "Approved" : "Approve"}
  </button>

  <button
    onClick={() => handleBookingStatusUpdate(booking._id, "cancelled")}
    disabled={booking.status === "cancelled"}
    className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition duration-300 ${
      booking.status === "cancelled"
        ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
        : "bg-red-600 hover:bg-red-700"
    }`}
  >
    {booking.status === "cancelled" ? "Cancelled" : "Cancel"}
  </button>
</div>
          </div>
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