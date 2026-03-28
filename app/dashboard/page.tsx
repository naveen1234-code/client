"use client";

import PageTransition from "@/components/PageTransition";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserType = {
  name: string;
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
};

type BookingType = {
  _id: string;
  bookingType: string;
  bookingName: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
};

type NotificationType = {
  _id: string;
  userId?: string | null;
  audience: "admin" | "member" | "all";
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [error, setError] = useState("");

  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [userRes, bookingsRes, notificationsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/my`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/my`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const userData = await userRes.json();
        const bookingsData = await bookingsRes.json();
        const notificationsData = await notificationsRes.json();

        if (!userRes.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        setUser(userData);

        if (bookingsRes.ok) {
          setBookings(bookingsData);
        }

        if (notificationsRes.ok) {
          setNotifications(notificationsData);
        }
      } catch {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
        setBookingsLoading(false);
        setNotificationsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
    return sortedNotifications.filter((item) => !item.isRead);
  }, [sortedNotifications]);

  const unreadNotificationCount = unreadNotifications.length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl">
          <p className="text-lg tracking-wide text-gray-300">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-140px] top-[100px] h-[280px] w-[280px] rounded-full bg-red-600/20 blur-3xl" />
          <div className="absolute right-[-80px] top-[160px] h-[220px] w-[220px] rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute bottom-[-100px] left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
                GYM RAVANA MEMBER DASHBOARD
              </p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Welcome Back,
                <span className="block text-red-500">{user?.name}</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                Track your membership, monitor attendance, and access the QR
                check-in system from one premium dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Notifications
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {unreadNotificationCount}
                  <span className="ml-2 text-xs font-semibold text-red-400">
                    Unread
                  </span>
                </p>
              </div>

              <button
  onClick={() => router.push("/access")}
  className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700"
>
  Open Access App
</button>

              <button
                onClick={() => router.push("/payments")}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
              >
                Payments
              </button>

              <button
                onClick={() => router.push("/bookings")}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
              >
                Bookings
              </button>

              {user?.role === "admin" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Admin Panel
                </button>
              )}

              <button
                onClick={() => router.push("/")}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
              >
                Home
              </button>

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">
              {error}
            </div>
          )}

          <section className="mb-8 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Alert Center
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Unread Notifications
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  Important unread updates for your account, bookings, payments,
                  and membership.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowNotificationHistory((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  {showNotificationHistory ? "Hide History" : "View History"}
                </button>

                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Mark All As Read
                </button>
              </div>
            </div>

            {notificationsLoading ? (
              <p className="mt-6 text-gray-400">Loading notifications...</p>
            ) : unreadNotifications.length === 0 ? (
              <p className="mt-6 text-gray-400">No unread notifications.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {unreadNotifications.slice(0, 6).map((item) => (
                  <div
                    key={item._id}
                    className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-4 transition duration-300"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                            {item.title}
                          </p>
                          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-300">
                            New
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-300">{item.message}</p>

                        <p className="mt-3 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleMarkNotificationRead(item._id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                      >
                        Mark Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showNotificationHistory && (
            <section className="mb-8 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Notification History
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  All Notifications
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  Full history of read and unread notifications.
                </p>
              </div>

              {notificationsLoading ? (
                <p className="mt-6 text-gray-400">Loading history...</p>
              ) : sortedNotifications.length === 0 ? (
                <p className="mt-6 text-gray-400">No notification history yet.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {sortedNotifications.map((item) => (
                    <div
                      key={item._id}
                      className={`rounded-[24px] border p-4 transition duration-300 ${
                        item.isRead
                          ? "border-white/10 bg-black/30"
                          : "border-red-500/20 bg-red-500/10"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                              {item.title}
                            </p>
                            {!item.isRead && (
                              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-300">
                                Unread
                              </span>
                            )}
                            {item.isRead && (
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                Read
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-gray-300">{item.message}</p>

                          <p className="mt-3 text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {!item.isRead && (
                          <button
                            onClick={() => handleMarkNotificationRead(item._id)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {user && (
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="space-y-8">
                <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-white/8 to-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                      Member Profile
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                      Account Overview
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Full Name
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">{user.name}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Email Address
                      </p>
                      <p className="mt-2 break-all text-lg font-bold text-white">
                        {user.email}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Role
                      </p>
                      <p className="mt-2 text-lg font-bold text-blue-400">{user.role}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Membership Status
                      </p>
                      <p className="mt-2 text-lg font-bold text-yellow-400">
                        {user.membershipStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
                  <div className="mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                      Membership Details
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                      Plan & Duration
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Current Plan
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {user.membershipPlan}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Total Days
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {user.totalDays}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Start Date
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">
                        {user.membershipStartDate
                          ? new Date(user.membershipStartDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        End Date
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">
                        {user.membershipEndDate
                          ? new Date(user.membershipEndDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-8">
                <div className="rounded-[30px] border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-6 shadow-2xl sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-green-400">
                    Remaining Access
                  </p>
                  <p className="mt-4 text-6xl font-black leading-none text-green-400">
                    {user.remainingDays}
                  </p>
                  <p className="mt-3 text-sm uppercase tracking-[0.18em] text-green-200/90">
                    Days Remaining
                  </p>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    Attendance Tracking
                  </p>

                  <div className="mt-5 grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Total Attendance
                      </p>
                      <p className="mt-2 text-3xl font-black text-white">
                        {user.attendanceCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Last Check-In
                      </p>
                      <p className="mt-2 text-lg font-bold text-white">
                        {user.lastCheckIn
                          ? new Date(user.lastCheckIn).toLocaleDateString()
                          : "Not checked in yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-6 shadow-2xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    Quick Action
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase text-white">
                    Ready to Enter?
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-gray-300">
                    Use the official wall QR at the gym entrance. One successful
                    scan will record your attendance and reduce one remaining day.
                  </p>

                  <button
                    onClick={() => router.push("/check-in")}
                    className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700"
                  >
                    Go to QR Check-In
                  </button>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    Booking Preview
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase text-white">
                    Recent Bookings
                  </h3>

                  {bookingsLoading ? (
                    <p className="mt-5 text-sm text-gray-400">Loading bookings...</p>
                  ) : bookings.length === 0 ? (
                    <p className="mt-5 text-sm text-gray-400">No bookings yet.</p>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {bookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking._id}
                          className="rounded-2xl border border-white/10 bg-black/40 p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">
                                {booking.bookingName}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                                {booking.bookingType}
                              </p>
                            </div>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
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

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Date
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white">
                                {booking.bookingDate}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Time
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white">
                                {booking.bookingTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => router.push("/bookings")}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                      >
                        View All Bookings
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}