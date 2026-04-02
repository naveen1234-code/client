"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

type UserType = {
  _id: string;
  name: string;
  fullName?: string;
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
  applicationPdfUrl?: string;
  createdAt?: string;
  powerTraining?: boolean;
  fatBurning?: boolean;
  zumba?: boolean;
  yoga?: boolean;
  isInsideGym?: boolean;
  lastEntryAt?: string | null;
  lastExitAt?: string | null;
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

type ManualPaymentFormType = {
  userId: string;
  planName: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  notes: string;
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
  receiptNumber?: string;
  notes?: string;
  transactionId?: string;
  recordedByAdminName?: string;
  paidAt?: string | null;
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

type AccessLogType = {
  _id: string;
  userName: string;
  userEmail: string;
  action: "entry" | "exit";
  result: "granted" | "denied";
  reason?: string;
  accessPoint?: string;
  createdAt: string;
};

type AccessStatsType = {
  totalLogs: number;
  grantedLogs: number;
  deniedLogs: number;
  entryLogs: number;
  exitLogs: number;
  insideNow: number;
  lastGrantedAt?: string | null;
  lastDeniedAt?: string | null;
  latestActivity?: AccessLogType[];
};

const INITIAL_VISIBLE_COUNT = 5;

export default function AdminPage() {
  const router = useRouter();
  const currentDate = new Date();

  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogType[]>([]);
  const [insideMembers, setInsideMembers] = useState<UserType[]>([]);
  const [accessStats, setAccessStats] = useState<AccessStatsType | null>(null);
  const [showAdminInstallPopup, setShowAdminInstallPopup] = useState(false);

  const [statementMonth, setStatementMonth] = useState(currentDate.getMonth() + 1);
  const [statementYear, setStatementYear] = useState(currentDate.getFullYear());
  const [statementPayments, setStatementPayments] = useState<PaymentType[]>([]);
  const [statementTotalRevenue, setStatementTotalRevenue] = useState(0);
  const [statementTotalPayments, setStatementTotalPayments] = useState(0);

  const [membershipForm, setMembershipForm] = useState<MembershipFormType>({
    userId: "",
    membershipStatus: "active",
    membershipPlan: "1 Month",
    membershipStartDate: "",
    membershipEndDate: "",
    totalDays: "",
    remainingDays: "",
  });

  const [manualPaymentForm, setManualPaymentForm] = useState<ManualPaymentFormType>({
    userId: "",
    planName: "1 Month",
    amount: "",
    paymentMethod: "Cash",
    transactionId: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [statementLoading, setStatementLoading] = useState(false);
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false);
  const [forceExitLoadingId, setForceExitLoadingId] = useState<string | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [showAllAccessLogs, setShowAllAccessLogs] = useState(false);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState("");

  const setSectionRef = (key: string) => (el: HTMLElement | null) => {
    sectionsRef.current[key] = el;
  };

  const scrollToSection = (key: string) => {
    const target = sectionsRef.current[key];
    if (!target) return;

    setShowQuickMenu(false);

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setHighlightedSection(key);

    window.setTimeout(() => {
      setHighlightedSection((prev) => (prev === key ? "" : prev));
    }, 2000);
  };
  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
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
        setIsAdminVerified(true);

        const [
          usersRes,
          paymentsRes,
          bookingsRes,
          notificationsRes,
          accessLogsRes,
          insideMembersRes,
          accessStatsRes,
        ] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/logs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/inside`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = await usersRes.json();
        const paymentsData = await paymentsRes.json();
        const bookingsData = await bookingsRes.json();
        const notificationsData = await notificationsRes.json();
        const accessLogsData = await accessLogsRes.json();
        const insideMembersData = await insideMembersRes.json();
        const accessStatsData = await accessStatsRes.json();

        if (usersRes.ok) setUsers(usersData);
        if (paymentsRes.ok) setPayments(paymentsData);
        if (bookingsRes.ok) setBookings(bookingsData);
        if (notificationsRes.ok) setNotifications(notificationsData);
        if (accessLogsRes.ok) setAccessLogs(accessLogsData);
        if (insideMembersRes.ok) setInsideMembers(insideMembersData);
        if (accessStatsRes.ok) setAccessStats(accessStatsData);
      } catch (fetchError) {
        console.error("Admin fetch error:", fetchError);
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
        setPaymentsLoading(false);
        setBookingsLoading(false);
        setNotificationsLoading(false);
        setAccessLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  useEffect(() => {
  const alreadySeen = localStorage.getItem("gymRavanaAdminInstallPopupSeen");

  if (!alreadySeen) {
    setShowAdminInstallPopup(true);
  }
}, []);

  useEffect(() => {
    if (!isAdminVerified) return;

    const interval = window.setInterval(() => {
      refreshAccessLogs();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [isAdminVerified]);

  useEffect(() => {
    if (!isAdminVerified) return;
    fetchMonthlyStatement(statementYear, statementMonth);
  }, [isAdminVerified, statementYear, statementMonth]);


  const refreshUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const usersData = await usersRes.json();
    if (usersRes.ok) setUsers(usersData);
  };

  const refreshBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const bookingsData = await bookingsRes.json();
    if (bookingsRes.ok) setBookings(bookingsData);
  };

  const fetchMonthlyStatement = async (year: number, month: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setStatementLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/monthly-statement?year=${year}&month=${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to load monthly statement");
        return;
      }

      setStatementPayments(data.payments || []);
      setStatementTotalRevenue(data.totalRevenue || 0);
      setStatementTotalPayments(data.totalPayments || 0);
    } catch {
      setError("Something went wrong while loading monthly statement");
    } finally {
      setStatementLoading(false);
    }
  };

  const refreshAccessLogs = async () => {
    if (document.hidden) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [accessRes, insideRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/inside`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const accessData = await accessRes.json();
      const insideData = await insideRes.json();
      const statsData = await statsRes.json();

      if (accessRes.ok) setAccessLogs(accessData);
      if (insideRes.ok) setInsideMembers(insideData);
      if (statsRes.ok) setAccessStats(statsData);

      await refreshUsers();
    } catch (refreshError) {
      console.error("Failed to refresh access data", refreshError);
    }
  };

  const handleDownloadStatementPdf = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/monthly-statement-pdf?year=${statementYear}&month=${statementMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to download statement PDF");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `gym-ravana-statement-${statementYear}-${statementMonth}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setError("Something went wrong while downloading PDF");
    }
  };

  const handleCloseAdminInstallPopup = () => {
  localStorage.setItem("gymRavanaAdminInstallPopupSeen", "true");
  setShowAdminInstallPopup(false);
};

  const handleForceExit = async (userId: string, userName: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const confirmed = window.confirm(`Force exit ${userName}?`);
    if (!confirmed) return;

    try {
      setForceExitLoadingId(userId);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access/force-exit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          reason: "Member forgot to scan exit",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to force exit member");
        return;
      }

      await refreshAccessLogs();
      await refreshUsers();
    } catch {
      setError("Something went wrong while force exiting member");
    } finally {
      setForceExitLoadingId(null);
    }
  };

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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/membership`, {
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
          totalDays: membershipForm.totalDays ? Number(membershipForm.totalDays) : 0,
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
      await refreshUsers();
    } catch {
      setError("Something went wrong while updating membership");
    }
  };

  const handleManualPayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    if (
      !manualPaymentForm.userId ||
      !manualPaymentForm.planName ||
      !manualPaymentForm.amount ||
      !manualPaymentForm.paymentMethod
    ) {
      setError("Please fill user ID, plan, amount, and payment method");
      return;
    }

    try {
      setManualPaymentLoading(true);
      setError("");
      setSuccessMessage("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: manualPaymentForm.userId,
          planName: manualPaymentForm.planName,
          amount: Number(manualPaymentForm.amount),
          paymentMethod: manualPaymentForm.paymentMethod,
          transactionId: manualPaymentForm.transactionId,
          notes: manualPaymentForm.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to record manual payment");
        return;
      }

      setSuccessMessage(
        `Manual payment recorded successfully ✅ Receipt: ${data.payment?.receiptNumber || "Generated"}`
      );

      setManualPaymentForm({
        userId: "",
        planName: "1 Month",
        amount: "",
        paymentMethod: "Cash",
        transactionId: "",
        notes: "",
      });

      await refreshUsers();
      await fetchMonthlyStatement(statementYear, statementMonth);
    } catch {
      setError("Something went wrong while recording manual payment");
    } finally {
      setManualPaymentLoading(false);
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
      remainingDays: user.remainingDays !== undefined ? String(user.remainingDays) : "",
    });

    setManualPaymentForm((prev) => ({
      ...prev,
      userId: user._id,
      planName: user.membershipPlan || "1 Month",
    }));

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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/status`, {
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

      await refreshBookings();
    } catch {
      setError("Something went wrong while updating booking");
    }
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
    } catch (readError) {
      console.error("Failed to mark notification as read", readError);
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
    } catch (readAllError) {
      console.error("Failed to mark all notifications as read", readAllError);
    }
  };

  const handleToggleNotificationHistory = () => {
    setShowNotificationHistory((prev) => {
      const next = !prev;
      if (next) setVisibleHistoryCount(10);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [users]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [payments]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bookings]);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const sortedAccessLogs = useMemo(() => {
    return [...accessLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [accessLogs]);

  const paidPayments = useMemo(
    () => payments.filter((payment) => payment.status === "paid"),
    [payments]
  );

  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.status === "pending"),
    [payments]
  );

  const totalRevenue = useMemo(
    () => paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
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

  const inactiveMembers = useMemo(
    () => users.filter((user) => user.membershipStatus === "inactive").length,
    [users]
  );

  const totalMembers = useMemo(() => users.length, [users]);

  const todaysPayments = useMemo(() => {
    const today = new Date().toDateString();
    return payments.filter(
      (payment) => new Date(payment.createdAt).toDateString() === today
    ).length;
  }, [payments]);

  const todaysRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return paidPayments
      .filter((payment) => new Date(payment.createdAt).toDateString() === today)
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [paidPayments]);

  const todaysCheckIns = useMemo(() => {
    const today = new Date().toDateString();
    return users.filter(
      (user) =>
        user.lastCheckIn && new Date(user.lastCheckIn).toDateString() === today
    ).length;
  }, [users]);

  const membersInsideNow = useMemo(
    () => accessStats?.insideNow ?? insideMembers.length,
    [accessStats, insideMembers]
  );

  const todaysEntries = useMemo(() => {
    const today = new Date().toDateString();
    return accessLogs.filter(
      (log) =>
        log.action === "entry" &&
        log.result === "granted" &&
        new Date(log.createdAt).toDateString() === today
    ).length;
  }, [accessLogs]);

  const todaysExits = useMemo(() => {
    const today = new Date().toDateString();
    return accessLogs.filter(
      (log) =>
        log.action === "exit" &&
        log.result === "granted" &&
        new Date(log.createdAt).toDateString() === today
    ).length;
  }, [accessLogs]);

  const deniedAccessToday = useMemo(() => {
    const today = new Date().toDateString();
    return accessLogs.filter(
      (log) =>
        log.result === "denied" &&
        new Date(log.createdAt).toDateString() === today
    ).length;
  }, [accessLogs]);

  const insideMembersList = useMemo(() => insideMembers, [insideMembers]);

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

  const totalBookings = useMemo(() => bookings.length, [bookings]);

  const unreadNotifications = useMemo(
    () => sortedNotifications.filter((item) => !item.isRead),
    [sortedNotifications]
  );

  const unreadNotificationsCount = unreadNotifications.length;

  const notificationHistoryItems = useMemo(
    () => sortedNotifications.slice(0, visibleHistoryCount),
    [sortedNotifications, visibleHistoryCount]
  );

  const hasMoreNotificationHistory = useMemo(
    () => sortedNotifications.length > visibleHistoryCount,
    [sortedNotifications, visibleHistoryCount]
  );

  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((user) => {
      const displayName = (user.fullName || user.name || "").toLowerCase();
      const matchesSearch =
        displayName.includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || user.membershipStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedUsers, searchTerm, statusFilter]);

  const displayedUsers = useMemo(() => {
    return showAllUsers
      ? filteredUsers
      : filteredUsers.slice(0, INITIAL_VISIBLE_COUNT);
  }, [filteredUsers, showAllUsers]);

  const displayedStatementPayments = useMemo(() => {
    return showAllPayments
      ? statementPayments
      : statementPayments.slice(0, INITIAL_VISIBLE_COUNT);
  }, [statementPayments, showAllPayments]);

  const displayedBookings = useMemo(() => {
    return showAllBookings
      ? sortedBookings
      : sortedBookings.slice(0, INITIAL_VISIBLE_COUNT);
  }, [sortedBookings, showAllBookings]);

  const displayedAccessLogs = useMemo(() => {
    return showAllAccessLogs
      ? sortedAccessLogs
      : sortedAccessLogs.slice(0, INITIAL_VISIBLE_COUNT);
  }, [sortedAccessLogs, showAllAccessLogs]);

  const powerTrainingCount = useMemo(
    () => users.filter((user) => user.powerTraining).length,
    [users]
  );

  const fatBurningCount = useMemo(
    () => users.filter((user) => user.fatBurning).length,
    [users]
  );

  const zumbaCount = useMemo(
    () => users.filter((user) => user.zumba).length,
    [users]
  );

  const yogaCount = useMemo(
    () => users.filter((user) => user.yoga).length,
    [users]
  );
  const classStats = useMemo(
    () => [
      {
        title: "Power Training",
        count: powerTrainingCount,
        active: users.filter(
          (user) => user.powerTraining && user.membershipStatus === "active"
        ).length,
        style: "border-red-500/20 bg-red-500/10 text-red-300",
      },
      {
        title: "Fat Burning",
        count: fatBurningCount,
        active: users.filter(
          (user) => user.fatBurning && user.membershipStatus === "active"
        ).length,
        style: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
      },
      {
        title: "Zumba",
        count: zumbaCount,
        active: users.filter(
          (user) => user.zumba && user.membershipStatus === "active"
        ).length,
        style: "border-pink-500/20 bg-pink-500/10 text-pink-300",
      },
      {
        title: "Yoga",
        count: yogaCount,
        active: users.filter(
          (user) => user.yoga && user.membershipStatus === "active"
        ).length,
        style: "border-blue-500/20 bg-blue-500/10 text-blue-300",
      },
    ],
    [powerTrainingCount, fatBurningCount, zumbaCount, yogaCount, users]
  );

  const urgentAlerts = useMemo(() => {
    const items: {
      key: string;
      title: string;
      value: string;
      tone: string;
      sectionKey: string;
    }[] = [];

    if (expiredMembers > 0) {
      items.push({
        key: "expired-members",
        title: "Expired Members",
        value: `${expiredMembers} need renewal`,
        tone: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
        sectionKey: "latest-members",
      });
    }

    if (pendingBookings > 0) {
      items.push({
        key: "pending-bookings",
        title: "Pending Bookings",
        value: `${pendingBookings} waiting approval`,
        tone: "border-blue-500/20 bg-blue-500/10 text-blue-300",
        sectionKey: "latest-bookings",
      });
    }

    if (deniedAccessToday > 0) {
      items.push({
        key: "denied-access",
        title: "Denied Access Today",
        value: `${deniedAccessToday} denied scans`,
        tone: "border-red-500/20 bg-red-500/10 text-red-300",
        sectionKey: "access-history",
      });
    }

    if (membersInsideNow > 0) {
      items.push({
        key: "inside-members",
        title: "Members Inside",
        value: `${membersInsideNow} currently inside`,
        tone: "border-green-500/20 bg-green-500/10 text-green-300",
        sectionKey: "inside-members",
      });
    }

    if (unreadNotificationsCount > 0) {
      items.push({
        key: "unread-notifications",
        title: "Unread Notifications",
        value: `${unreadNotificationsCount} unread items`,
        tone: "border-pink-500/20 bg-pink-500/10 text-pink-300",
        sectionKey: "notifications",
      });
    }

    if (pendingPayments.length > 0) {
      items.push({
        key: "pending-payments",
        title: "Pending Payments",
        value: `${pendingPayments.length} payment records pending`,
        tone: "border-orange-500/20 bg-orange-500/10 text-orange-300",
        sectionKey: "monthly-statement",
      });
    }

    if (statementTotalPayments === 0) {
      items.push({
        key: "statement-empty",
        title: "No Payments This Month",
        value: "Selected month has no paid payments",
        tone: "border-white/10 bg-white/[0.04] text-gray-300",
        sectionKey: "monthly-statement",
      });
    }

    return items;
  }, [
    expiredMembers,
    pendingBookings,
    deniedAccessToday,
    membersInsideNow,
    unreadNotificationsCount,
    pendingPayments.length,
    statementTotalPayments,
  ]);

  const latestPaidPayment = useMemo(
  () =>
    [...paidPayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0] || null,
  [paidPayments]
);

const latestManualReceipt = useMemo(
  () =>
    [...paidPayments]
      .filter((payment) => payment.receiptNumber)
      .sort(
        (a, b) =>
          new Date(b.paidAt || b.createdAt).getTime() -
          new Date(a.paidAt || a.createdAt).getTime()
      )[0] || null,
  [paidPayments]
);

const manualReceiptCount = useMemo(
  () => paidPayments.filter((payment) => !!payment.receiptNumber).length,
  [paidPayments]
);

const topPlanName = useMemo(() => {
  const counts: Record<string, number> = {};

  paidPayments.forEach((payment) => {
    counts[payment.planName] = (counts[payment.planName] || 0) + 1;
  });

  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return topEntry ? `${topEntry[0]} (${topEntry[1]})` : "No paid plans yet";
}, [paidPayments]);

const topPaymentMethod = useMemo(() => {
  const counts: Record<string, number> = {};

  paidPayments.forEach((payment) => {
    counts[payment.paymentMethod] = (counts[payment.paymentMethod] || 0) + 1;
  });

  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return topEntry ? `${topEntry[0]} (${topEntry[1]})` : "No payment data";
}, [paidPayments]);

const peakEntryHourLabel = useMemo(() => {
  const hourCounts: Record<number, number> = {};

  accessLogs
    .filter((log) => log.action === "entry" && log.result === "granted")
    .forEach((log) => {
      const hour = new Date(log.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

  const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  if (!topHour) return "No entry data yet";

  const hour = Number(topHour[0]);
  const count = topHour[1];

  const formatted =
    hour === 0
      ? "12 AM"
      : hour < 12
        ? `${hour} AM`
        : hour === 12
          ? "12 PM"
          : `${hour - 12} PM`;

  return `${formatted} (${count})`;
}, [accessLogs]);

const retentionRate = useMemo(() => {
  if (totalMembers === 0) return "0%";
  const retained = activeMembers;
  return `${Math.round((retained / totalMembers) * 100)}%`;
}, [activeMembers, totalMembers]);

const monthlyGrowthLabel = useMemo(() => {
  if (totalMembers === 0) return "0 new this month";

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const newThisMonth = users.filter((user) => {
    if (!user.createdAt) return false;
    const created = new Date(user.createdAt);
    return (
      created.getMonth() === currentMonth &&
      created.getFullYear() === currentYear
    );
  }).length;

  return `${newThisMonth} new this month`;
}, [users, totalMembers]);

const applicationPdfCount = useMemo(
  () => users.filter((user) => !!user.applicationPdfUrl).length,
  [users]
);

const integrationStatusCards = useMemo(
  () => [
    {
      title: "QR Access",
      value: "Ready",
      subtitle: `${accessStats?.grantedLogs ?? 0} granted logs`,
      style: "border-green-500/20 bg-green-500/10 text-green-300",
    },
    {
      title: "Payment System",
      value: "Ready",
      subtitle: `${paidPayments.length} paid records`,
      style: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    },
    {
      title: "Receipt Engine",
      value: "Ready",
      subtitle: `${manualReceiptCount} receipts recorded`,
      style: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    },
    {
      title: "Notifications",
      value: "Ready",
      subtitle: `${notifications.length} total alerts`,
      style: "border-pink-500/20 bg-pink-500/10 text-pink-300",
    },
    {
      title: "Monthly Statement PDF",
      value: "Ready",
      subtitle: "Download enabled",
      style: "border-purple-500/20 bg-purple-500/10 text-purple-300",
    },
    {
      title: "Door Hardware",
      value: "Waiting",
      subtitle: "Ready after hardware install",
      style: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    },
  ],
  [accessStats, paidPayments.length, manualReceiptCount, notifications.length]
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
      <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-10 pt-20 text-white sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-140px] top-[60px] h-[340px] w-[340px] rounded-full bg-red-600/20 blur-3xl animate-pulse" />
          <div className="absolute right-[-120px] top-[140px] h-[280px] w-[280px] rounded-full bg-red-500/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.08]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,0,0.18),transparent_35%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl space-y-10 lg:space-y-12">

          
          
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
            Gym Ravana Control Core
          </p>

          <h1 className="text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl">
            Admin
            <span className="block text-red-500">Revenue + Access Dashboard</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
            Control memberships, bookings, payments, notifications, and
            real-world gym entry / exit activity from one dashboard.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Notifications
          </p>
          <p className="mt-2 text-2xl font-black text-white">
            {unreadNotificationsCount}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-400">
            Unread
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Today Revenue
          </p>
          <p className="mt-2 text-2xl font-black text-green-400">
            LKR {todaysRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Paid Today
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Members Inside
          </p>
          <p className="mt-2 text-2xl font-black text-cyan-400">
            {membersInsideNow}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Live Count
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Denied Today
          </p>
          <p className="mt-2 text-2xl font-black text-red-400">
            {deniedAccessToday}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Access Errors
          </p>
        </div>
      </div>

      {currentUser && (
        <div className="rounded-[26px] border border-white/10 bg-black/35 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-300">
                Logged in as{" "}
                <span className="font-bold text-white">
                  {currentUser.fullName || currentUser.name}
                </span>{" "}
                • <span className="text-blue-400">{currentUser.role}</span>
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                Admin session active
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => scrollToSection("membership-control")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Membership
              </button>

              <button
                onClick={() => scrollToSection("manual-payment")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Manual Payment
              </button>

              <button
                onClick={() => scrollToSection("inside-members")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Inside Members
              </button>

              <button
                onClick={() => scrollToSection("latest-bookings")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="rounded-[28px] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-300">
        Admin Navigation
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <button
          onClick={() => router.push("/")}
          className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg transition duration-300 hover:scale-[1.02] hover:bg-orange-600"
        >
          Back to Home
        </button>

        <button
          onClick={() => router.push("/register")}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-orange-500/40 hover:bg-orange-500/10"
        >
          Register Page
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
        >
          Member Dashboard
        </button>

        <button
          onClick={() => router.push("/terms")}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
        >
          Terms Page
        </button>

        <button
  onClick={() => router.push("/admin/gallery")}
  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-orange-500/40 hover:bg-orange-500/10"
>
  Gallery Manager
</button>

        <button
          onClick={handleLogout}
          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
          Ready Sections
        </p>
        <div className="mt-3 space-y-2 text-sm text-gray-300">
          <p>• Revenue tracking</p>
          <p>• QR access system</p>
          <p>• Booking approvals</p>
          <p>• Notifications</p>
          <p>• Member management</p>
        </div>
      </div>
    </div>
  </div>
</div>

            
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-semibold text-green-300">
              {successMessage}
            </div>
          )}

          <section
            ref={setSectionRef("monthly-revenue")}
            className={`grid gap-6 md:grid-cols-2 xl:grid-cols-4 ${
              highlightedSection === "monthly-revenue"
                ? "rounded-[32px] ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                : ""
            }`}
          >
            <div className="rounded-[28px] border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-6 shadow-2xl">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-green-300">
                    Monthly Revenue
                  </p>
                  <p className="mt-4 text-4xl font-black text-green-400">
                    LKR {statementTotalRevenue.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-green-200/80">
                    Successful paid transactions for selected month
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={statementMonth}
                    onChange={(e) => setStatementMonth(Number(e.target.value))}
                    className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500"
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>

                  <input
                    type="number"
                    value={statementYear}
                    onChange={(e) => setStatementYear(Number(e.target.value))}
                    className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-green-500"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    Monthly Payment Count
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {statementLoading ? "Loading..." : statementTotalPayments}
                  </p>
                </div>

                <button
                  onClick={handleDownloadStatementPdf}
                  disabled={statementLoading}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition ${
                    statementLoading
                      ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {statementLoading ? "Preparing..." : "Download Statement PDF"}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-400">
                Total Members
              </p>
              <p className="mt-4 text-4xl font-black text-white">{totalMembers}</p>
              <p className="mt-2 text-sm text-gray-400">All registered users</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-400">
                Active Members
              </p>
              <p className="mt-4 text-4xl font-black text-white">{activeMembers}</p>
              <p className="mt-2 text-sm text-gray-400">
                Members with active access
              </p>
            </div>

            <div className="rounded-[28px] border border-yellow-500/20 bg-yellow-500/10 p-6 shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-yellow-300">
                Expired Members
              </p>
              <p className="mt-4 text-4xl font-black text-yellow-400">
                {expiredMembers}
              </p>
              <p className="mt-2 text-sm text-yellow-200/80">
                Need renewal
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
                Today’s Revenue
              </p>
              <p className="mt-4 text-4xl font-black text-purple-400">
                LKR {todaysRevenue.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-purple-200/80">
                Successful paid transactions today
              </p>
            </div>

            <div className="rounded-[28px] border border-green-500/20 bg-green-500/10 p-6 shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-green-300">
                Members Inside
              </p>
              <p className="mt-4 text-4xl font-black text-green-400">
                {membersInsideNow}
              </p>
              <p className="mt-2 text-sm text-green-200/80">
                Currently inside gym
              </p>
            </div>

            <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 shadow-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-red-300">
                Denied Access Today
              </p>
              <p className="mt-4 text-4xl font-black text-red-400">
                {deniedAccessToday}
              </p>
              <p className="mt-2 text-sm text-red-200/80">
                Rejected scans today
              </p>
            </div>
          </section>

          <section
            ref={setSectionRef("urgent-alerts")}
            className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
              highlightedSection === "urgent-alerts"
                ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                : ""
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Priority Overview
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Urgent Alerts
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  Fast action items that need admin attention right now.
                </p>
              </div>

              <button
                onClick={() => scrollToSection("notifications")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Open Notifications
              </button>
            </div>

            {urgentAlerts.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
                <p className="text-sm font-semibold text-green-300">
                  No urgent alerts right now. System looks stable.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {urgentAlerts.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => scrollToSection(item.sectionKey)}
                    className={`rounded-[24px] border p-5 text-left shadow-xl transition duration-300 hover:scale-[1.01] ${item.tone}`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
                      {item.title}
                    </p>
                    <p className="mt-3 text-lg font-black text-white">
                      {item.value}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
    <section className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
            <div
              ref={setSectionRef("door-activity")}
              className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
                highlightedSection === "door-activity"
                  ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    Live Access Control
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                    Door Activity
                  </h2>
                </div>

                <button
                  onClick={refreshAccessLogs}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
                    Entries Today
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-400">
                    {todaysEntries}
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                    Exits Today
                  </p>
                  <p className="mt-2 text-3xl font-black text-blue-400">
                    {todaysExits}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300">
                    Access Errors
                  </p>
                  <p className="mt-2 text-3xl font-black text-yellow-400">
                    {deniedAccessToday}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    Current Inside Count
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {membersInsideNow}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    Access Totals
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Granted: {accessStats?.grantedLogs ?? 0} • Denied:{" "}
                    {accessStats?.deniedLogs ?? 0}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-300">
                  Hardware Ready Note
                </p>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  This dashboard is structured for future QR door hardware and
                  real-world access management. Entry and exit activity is already
                  tracked at system level.
                </p>
              </div>
            </div>

            <div
              ref={setSectionRef("inside-members")}
              className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
                highlightedSection === "inside-members"
                  ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    People Inside Now
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                    Live Inside List
                  </h2>
                </div>

                <button
                  onClick={() => scrollToSection("access-history")}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  View Access History
                </button>
              </div>

              {insideMembersList.length === 0 ? (
                <p className="mt-6 text-gray-400">No members are currently inside.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {insideMembersList.slice(0, 8).map((user) => (
                    <div
                      key={user._id}
                      className="rounded-[24px] border border-green-500/20 bg-green-500/10 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                            {user.fullName || user.name}
                          </p>
                          <p className="mt-1 break-all text-sm text-gray-300">
                            {user.email}
                          </p>
                        </div>

                        <span className="inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-green-300">
                          Inside
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                            Last Entry
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {user.lastEntryAt
                              ? new Date(user.lastEntryAt).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                            Membership
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {user.membershipPlan || "No Plan"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleForceExit(user._id, user.fullName || user.name)}
                          disabled={forceExitLoadingId === user._id}
                          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition ${
                            forceExitLoadingId === user._id
                              ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {forceExitLoadingId === user._id ? "Processing..." : "Force Exit"}
                        </button>

                        <button
                          onClick={() => handleSelectUser(user)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                        >
                          Select Member
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section
            ref={setSectionRef("access-history")}
            className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
              highlightedSection === "access-history"
                ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                : ""
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Access History
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Recent Entry / Exit Logs
                </h2>
              </div>

              {sortedAccessLogs.length > INITIAL_VISIBLE_COUNT && (
                <button
                  onClick={() => setShowAllAccessLogs((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  {showAllAccessLogs ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

            {accessLoading ? (
              <p className="mt-6 text-gray-400">Loading access logs...</p>
            ) : accessLogs.length === 0 ? (
              <p className="mt-6 text-gray-400">No access logs found yet.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {displayedAccessLogs.map((log) => (
                  <div
                    key={log._id}
                    className="rounded-[24px] border border-white/10 bg-black/40 p-4 transition duration-300 hover:border-red-500/20 hover:bg-black/55"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                          {log.userName}
                        </p>
                        <p className="mt-1 break-all text-sm text-gray-400">
                          {log.userEmail}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                            log.action === "entry"
                              ? "border border-green-500/20 bg-green-500/10 text-green-400"
                              : "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {log.action}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                            log.result === "granted"
                              ? "border border-green-500/20 bg-green-500/10 text-green-400"
                              : "border border-red-500/20 bg-red-500/10 text-red-400"
                          }`}
                        >
                          {log.result}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          Access Point
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {log.accessPoint || "main-door"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          Time
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          Reason
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {log.reason || "No issue"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            ref={setSectionRef("notifications")}
            className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
              highlightedSection === "notifications"
                ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                : ""
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Alert Center
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Unread Notifications
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  Live unread admin activity from registrations, approvals, and system events.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleToggleNotificationHistory}
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

            {showNotificationHistory && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Notification History
                  </p>

                  {hasMoreNotificationHistory && (
                    <button
                      onClick={() => setVisibleHistoryCount((prev) => prev + 10)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                    >
                      Load More
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {notificationHistoryItems.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-gray-300">{item.message}</p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
                            item.isRead
                              ? "border border-white/10 bg-white/[0.03] text-gray-400"
                              : "border border-red-500/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {item.isRead ? "Read" : "Unread"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section
            ref={setSectionRef("class-analysis")}
            className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
              highlightedSection === "class-analysis"
                ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                : ""
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Program Intelligence
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Class Analysis
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  Quick member breakdown based on training preferences.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
                Active: <span className="font-bold text-white">{activeMembers}</span> •
                Inactive: <span className="font-bold text-white">{inactiveMembers}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {classStats.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-[24px] border p-5 shadow-xl ${item.style}`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em]">
                    {item.title}
                  </p>
                  <p className="mt-4 text-4xl font-black text-white">{item.count}</p>
                  <p className="mt-2 text-sm">
                    Active members:{" "}
                    <span className="font-bold text-white">{item.active}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-8">
              <div
                ref={setSectionRef("membership-control")}
                className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
                  highlightedSection === "membership-control"
                    ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                    : ""
                }`}
              >
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
                        {membershipForm.totalDays || "0"} /{" "}
                        {membershipForm.remainingDays || "0"}
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
              </div>

              <div
                ref={setSectionRef("manual-payment")}
                className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
                  highlightedSection === "manual-payment"
                    ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                    : ""
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Manual Payment
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Record Cash / Bank Transfer
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Member User ID"
                    value={manualPaymentForm.userId}
                    onChange={(e) =>
                      setManualPaymentForm({
                        ...manualPaymentForm,
                        userId: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />

                  <select
                    value={manualPaymentForm.planName}
                    onChange={(e) =>
                      setManualPaymentForm({
                        ...manualPaymentForm,
                        planName: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Couple 1 Year">Couple 1 Year</option>
                    <option value="Personal Training">Personal Training</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Amount (LKR)"
                    value={manualPaymentForm.amount}
                    onChange={(e) =>
                      setManualPaymentForm({
                        ...manualPaymentForm,
                        amount: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  />

                  <select
                    value={manualPaymentForm.paymentMethod}
                    onChange={(e) =>
                      setManualPaymentForm({
                        ...manualPaymentForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Manual">Manual</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Transaction ID / Bank Ref (optional)"
                    value={manualPaymentForm.transactionId}
                    onChange={(e) =>
                      setManualPaymentForm({
                        ...manualPaymentForm,
                        transactionId: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500 md:col-span-2"
                  />

                  <textarea
                    placeholder="Notes (optional)"
                    value={manualPaymentForm.notes}
                    onChange={(e) =>
                      setManualPaymentForm({
                        ...manualPaymentForm,
                        notes: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500 md:col-span-2"
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleManualPayment}
                    disabled={manualPaymentLoading}
                    className={`h-12 rounded-xl px-6 text-sm font-bold uppercase tracking-[0.15em] text-white transition duration-300 ${
                      manualPaymentLoading
                        ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {manualPaymentLoading ? "Recording..." : "Record Manual Payment"}
                  </button>

                  <button
                    onClick={() =>
                      setManualPaymentForm({
                        userId: "",
                        planName: "1 Month",
                        amount: "",
                        paymentMethod: "Cash",
                        transactionId: "",
                        notes: "",
                      })
                    }
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-bold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    Clear Manual Form
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-4 text-sm text-yellow-200">
                  Use this for walk-in cash payments, bank transfers, or admin-recorded renewals.
                </div>
              </div>

              <div
                ref={setSectionRef("monthly-statement")}
                className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
                  highlightedSection === "monthly-statement"
                    ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                      Monthly Statement
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                      Selected Month Payments
                    </h2>
                  </div>

                  {statementPayments.length > INITIAL_VISIBLE_COUNT && (
                    <button
                      onClick={() => setShowAllPayments((prev) => !prev)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-yellow-500/30 hover:bg-yellow-500/10"
                    >
                      {showAllPayments ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>

                {statementLoading ? (
                  <p className="mt-6 text-gray-400">Loading monthly statement...</p>
                ) : statementPayments.length === 0 ? (
                  <p className="mt-6 text-gray-400">
                    No paid payments found for this selected month.
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
                            Statement Summary
                          </p>
                          <p className="mt-2 text-sm text-white">
                            {statementPayments.length} successful payment
                            {statementPayments.length !== 1 ? "s" : ""} found for this month
                          </p>
                        </div>

                        <p className="text-lg font-black text-green-400">
                          LKR {statementTotalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {displayedStatementPayments.map((payment) => (
                      <div
                        key={payment._id}
                        className="group rounded-[24px] border border-white/10 bg-black/40 p-4 transition duration-300 hover:border-red-500/20 hover:bg-black/55"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                              {payment.userName}
                            </p>
                            <p className="mt-1 break-all text-sm text-gray-400">
                              {payment.userEmail}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
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

                            <div
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                                payment.paymentMethod === "Cash"
                                  ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                                  : payment.paymentMethod === "Bank Transfer"
                                    ? "border border-blue-500/20 bg-blue-500/10 text-blue-300"
                                    : payment.paymentMethod === "Manual"
                                      ? "border border-purple-500/20 bg-purple-500/10 text-purple-300"
                                      : "border border-green-500/20 bg-green-500/10 text-green-300"
                              }`}
                            >
                              {payment.paymentMethod}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                              Receipt Number
                            </p>
                            <p className="mt-2 break-all text-sm font-semibold text-white">
                              {payment.receiptNumber || "N/A"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                              Transaction ID
                            </p>
                            <p className="mt-2 break-all text-sm font-semibold text-white">
                              {payment.transactionId || "N/A"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                              Recorded By
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              {payment.recordedByAdminName || "System / Online"}
                            </p>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                              Notes
                            </p>
                            <p className="mt-2 text-sm text-gray-300">{payment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section
              ref={setSectionRef("latest-members")}
              className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
                highlightedSection === "latest-members"
                  ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                    Member Database
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                    Latest Members
                  </h2>
                </div>

                {filteredUsers.length > INITIAL_VISIBLE_COUNT && (
                  <button
                    onClick={() => setShowAllUsers((prev) => !prev)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                  >
                    {showAllUsers ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>

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
                {displayedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="group rounded-[24px] border border-white/10 bg-black/40 p-4 transition duration-300 hover:border-red-500/20 hover:bg-black/55"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-base font-black uppercase tracking-[0.08em] text-white">
                          {user.fullName || user.name}
                        </p>
                        <p className="mt-1 break-all text-sm text-gray-400">
                          {user.email}
                        </p>
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

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                            user.isInsideGym
                              ? "border border-green-500/20 bg-green-500/10 text-green-300"
                              : "border border-white/10 bg-white/[0.03] text-gray-400"
                          }`}
                        >
                          {user.isInsideGym ? "Inside" : "Outside"}
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
                          <span className="text-green-400">
                            {user.remainingDays ?? 0}
                          </span>
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

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          Last Entry
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {user.lastEntryAt
                            ? new Date(user.lastEntryAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          Last Exit
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {user.lastExitAt
                            ? new Date(user.lastExitAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                          Training Programs
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {user.powerTraining && (
                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-300">
                              Power Training
                            </span>
                          )}
                          {user.fatBurning && (
                            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-yellow-300">
                              Fat Burning
                            </span>
                          )}
                          {user.zumba && (
                            <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-pink-300">
                              Zumba
                            </span>
                          )}
                          {user.yoga && (
                            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-300">
                              Yoga
                            </span>
                          )}
                          {!user.powerTraining &&
                            !user.fatBurning &&
                            !user.zumba &&
                            !user.yoga && (
                              <span className="text-sm text-gray-500">
                                No program selected
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-red-500/30 hover:bg-red-500/10"
                      >
                        Select This User
                      </button>

                      {user.applicationPdfUrl ? (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${user.applicationPdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-blue-300 transition duration-300 hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-white"
                        >
                          View Application PDF
                        </a>
                      ) : (
                        <span className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-500">
                          No Application PDF
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section
            ref={setSectionRef("latest-bookings")}
            className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
              highlightedSection === "latest-bookings"
                ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
                : ""
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
                  Booking Management
                </p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                  Latest Bookings
                </h2>
              </div>

              {sortedBookings.length > INITIAL_VISIBLE_COUNT && (
                <button
                  onClick={() => setShowAllBookings((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  {showAllBookings ? "Show Less" : "Show More"}
                </button>
              )}
            </div>

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
                {displayedBookings.map((booking) => (
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
                ))}
              </div>
            )}
          </section>

          <section
  ref={setSectionRef("receipt-placeholder")}
  className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
    highlightedSection === "receipt-placeholder"
      ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
      : ""
  }`}
>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
        Receipts & Invoices
      </p>
      <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
        Business Documents
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-gray-400">
        Real payment document overview for statements, receipts, and member application records.
      </p>
    </div>

    <button
      onClick={handleDownloadStatementPdf}
      disabled={statementLoading}
      className={`rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition ${
        statementLoading
          ? "cursor-not-allowed bg-red-900/40 text-red-300/60"
          : "bg-red-600 hover:bg-red-700"
      }`}
    >
      {statementLoading ? "Preparing..." : "Download Statement PDF"}
    </button>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-[24px] border border-green-500/20 bg-green-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
        Paid Documents
      </p>
      <p className="mt-3 text-3xl font-black text-white">{paidPayments.length}</p>
      <p className="mt-2 text-sm text-green-200/80">Successful paid payment records</p>
    </div>

    <div className="rounded-[24px] border border-blue-500/20 bg-blue-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
        Member PDFs
      </p>
      <p className="mt-3 text-3xl font-black text-white">{applicationPdfCount}</p>
      <p className="mt-2 text-sm text-blue-200/80">Submitted application PDFs</p>
    </div>

    <div className="rounded-[24px] border border-yellow-500/20 bg-yellow-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300">
        Manual Receipts
      </p>
      <p className="mt-3 text-3xl font-black text-white">{manualReceiptCount}</p>
      <p className="mt-2 text-sm text-yellow-200/80">Receipts with generated numbers</p>
    </div>

    <div className="rounded-[24px] border border-purple-500/20 bg-purple-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
        Latest Receipt
      </p>
      <p className="mt-3 text-lg font-black text-white break-all">
        {latestManualReceipt?.receiptNumber || "No receipt yet"}
      </p>
      <p className="mt-2 text-sm text-purple-200/80">
        {latestManualReceipt?.userName || "Waiting for manual payment"}
      </p>
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2">
    <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Latest Paid Member
      </p>
      <p className="mt-3 text-xl font-black text-white">
        {latestPaidPayment?.userName || "No paid payment yet"}
      </p>
      <p className="mt-2 text-sm text-gray-400">
        {latestPaidPayment
          ? `${latestPaidPayment.planName} • LKR ${latestPaidPayment.amount.toLocaleString()}`
          : "Waiting for first paid record"}
      </p>
    </div>

    <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Statement Month
      </p>
      <p className="mt-3 text-xl font-black text-white">
        {statementTotalPayments} payment{statementTotalPayments !== 1 ? "s" : ""}
      </p>
      <p className="mt-2 text-sm text-gray-400">
        LKR {statementTotalRevenue.toLocaleString()} in selected statement period
      </p>
    </div>
  </div>
</section>

          <section
  ref={setSectionRef("analytics-placeholder")}
  className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
    highlightedSection === "analytics-placeholder"
      ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
      : ""
  }`}
>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
        Advanced Analytics
      </p>
      <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
        Future Growth Insights
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-gray-400">
        Live summary cards based on current member, payment, and access activity.
      </p>
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Peak Entry Hour
      </p>
      <p className="mt-3 text-2xl font-black text-white">{peakEntryHourLabel}</p>
    </div>

    <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Monthly Growth
      </p>
      <p className="mt-3 text-2xl font-black text-white">{monthlyGrowthLabel}</p>
    </div>

    <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Retention Rate
      </p>
      <p className="mt-3 text-2xl font-black text-white">{retentionRate}</p>
    </div>

    <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
        Top Plan
      </p>
      <p className="mt-3 text-2xl font-black text-white">{topPlanName}</p>
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-3">
    <div className="rounded-[24px] border border-blue-500/20 bg-blue-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
        Top Payment Method
      </p>
      <p className="mt-3 text-xl font-black text-white">{topPaymentMethod}</p>
    </div>

    <div className="rounded-[24px] border border-green-500/20 bg-green-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
        Current Active Base
      </p>
      <p className="mt-3 text-xl font-black text-white">
        {activeMembers} active / {totalMembers} total
      </p>
    </div>

    <div className="rounded-[24px] border border-yellow-500/20 bg-yellow-500/10 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-300">
        Paid vs Pending
      </p>
      <p className="mt-3 text-xl font-black text-white">
        {paidPayments.length} paid / {pendingPayments.length} pending
      </p>
    </div>
  </div>
</section>

          <section
  ref={setSectionRef("system-status")}
  className={`rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8 ${
    highlightedSection === "system-status"
      ? "ring-4 ring-red-500/60 shadow-[0_0_35px_rgba(239,68,68,0.45)] transition-all duration-300"
      : ""
  }`}
>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
        System Status
      </p>
      <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
        Integration Readiness
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-gray-400">
        Live release-readiness summary based on current working systems and pending hardware.
      </p>
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {integrationStatusCards.map((item) => (
      <div key={item.title} className={`rounded-[24px] border p-5 ${item.style}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
          {item.title}
        </p>
        <p className="mt-3 text-xl font-black text-white">{item.value}</p>
        <p className="mt-2 text-sm text-white/80">{item.subtitle}</p>
      </div>
    ))}
  </div>
</section>
          <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={() => setShowQuickMenu((prev) => !prev)}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-600 text-2xl font-black text-white shadow-2xl transition hover:scale-105 hover:bg-red-700"
          >
            ☰
          </button>
        </div>

        {showQuickMenu ? (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setShowQuickMenu(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            />

            <div className="fixed right-4 top-24 bottom-4 z-50 w-72 overflow-y-auto rounded-3xl border border-white/10 bg-black/95 p-4 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-400">
                  Quick Navigation
                </p>

                <button
                  type="button"
                  onClick={() => setShowQuickMenu(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <button type="button" onClick={() => scrollToSection("monthly-revenue")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Monthly Revenue</button>
                <button type="button" onClick={() => scrollToSection("urgent-alerts")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Urgent Alerts</button>
                <button type="button" onClick={() => scrollToSection("door-activity")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Door Activity</button>
                <button type="button" onClick={() => scrollToSection("inside-members")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Inside Members</button>
                <button type="button" onClick={() => scrollToSection("access-history")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Access History</button>
                <button type="button" onClick={() => scrollToSection("notifications")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Notifications</button>
                <button type="button" onClick={() => scrollToSection("class-analysis")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Class Analysis</button>
                <button type="button" onClick={() => scrollToSection("membership-control")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Membership Control</button>
                <button type="button" onClick={() => scrollToSection("manual-payment")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Manual Payment</button>
                <button type="button" onClick={() => scrollToSection("monthly-statement")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Monthly Statement</button>
                <button type="button" onClick={() => scrollToSection("latest-members")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Latest Members</button>
                <button type="button" onClick={() => scrollToSection("latest-bookings")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Latest Bookings</button>
                <button type="button" onClick={() => scrollToSection("receipt-placeholder")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Receipts & Invoices</button>
                <button type="button" onClick={() => scrollToSection("analytics-placeholder")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">Analytics</button>
                <button type="button" onClick={() => scrollToSection("system-status")} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/10">System Status</button>
              </div>
            </div>
          </>
        ) : null}
        </div>

        {showAdminInstallPopup && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4">
    <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-400">
        Admin Access
      </p>

      <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
        Install Admin Access
      </h3>

      <p className="mt-4 text-sm leading-7 text-gray-300">
        Add this admin dashboard to your phone home screen for faster daily access.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300">
        <p className="font-bold text-white">For iPhone / Safari:</p>
        <p className="mt-2">1. Open this page in Safari</p>
        <p>2. Tap the Share button</p>
        <p>3. Tap “Add to Home Screen”</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleCloseAdminInstallPopup}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-500/30 hover:bg-red-500/10"
        >
          Maybe Later
        </button>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            handleCloseAdminInstallPopup();
          }}
          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
        >
          Copy Admin Link
        </button>
      </div>
    </div>
  </div>
)}

      </main>
    </PageTransition>
  );
}