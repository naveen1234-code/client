"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";

type PaymentType = {
  _id: string;
  planName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

type UserType = {
  remainingDays: number;
};

type CheckoutDataType = {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
};

declare global {
  interface Window {
    payhere: any;
  }
}

const plans = [
  { name: "Monthly", amount: 3500, days: 30 },
  { name: "3 Months", amount: 6500, days: 90 },
  { name: "6 Months", amount: 7500, days: 180 },
  { name: "1 Year", amount: 9500, days: 365 },
  { name: "Couple 1 Year", amount: 15000, days: 365 },
  { name: "Personal Training", amount: 5000, days: 30 },
];

export default function PaymentsPage() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState("3 Months");
  const [selectedAmount, setSelectedAmount] = useState(6500);
  const [selectedDays, setSelectedDays] = useState(90);

  const [currentRemainingDays, setCurrentRemainingDays] = useState(0);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [checkoutData, setCheckoutData] = useState<CheckoutDataType | null>(null);

  const [useRealPayHere, setUseRealPayHere] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to load payments");
      } else {
        setPayments(data);
      }
    } catch (err) {
      setError("Failed to load payment history");
    }
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: UserType = await res.json();

      if (res.ok) {
        setCurrentRemainingDays(data.remainingDays || 0);
      }
    } catch (err) {
      console.log("Failed to load user preview");
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      await Promise.all([fetchPayments(), fetchCurrentUser()]);
      setLoading(false);
    };

    loadPage();
  }, []);

  useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://www.payhere.lk/lib/payhere.js";
  script.async = true;
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);

  const handlePlanChange = (planName: string) => {
    const found = plans.find((p) => p.name === planName);
    setSelectedPlan(planName);
    setSelectedAmount(found ? found.amount : 0);
    setSelectedDays(found ? found.days : 0);
  };

  const startRealPayHerePayment = (data: CheckoutDataType) => {
  if (!window.payhere) {
    setError("PayHere script not loaded");
    return;
  }

  window.payhere.onCompleted = function onCompleted(orderId: string) {
    console.log("Payment completed. OrderID:", orderId);
  };

  window.payhere.onDismissed = function onDismissed() {
    console.log("Payment dismissed");
    setError("Payment popup was dismissed");
  };

  window.payhere.onError = function onError(error: any) {
    console.log("PayHere Error:", error);
    setError("PayHere payment failed");
  };

  window.payhere.startPayment(data);
};



  const handleCreatePayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      // Step 1: prepare PayHere-ready checkout data
      const payhereRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/payhere-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planName: selectedPlan,
            amount: selectedAmount,
          }),
        }
      );

      const payhereData = await payhereRes.json();

      if (!payhereRes.ok) {
        setError(payhereData.message || "Failed to prepare checkout");
        return;
      }

      setCheckoutData(payhereData.checkoutData);
      console.log("PayHere Data:", payhereData.checkoutData);

      // 🔥 REAL PAYHERE SWITCH
if (useRealPayHere) {
  startRealPayHerePayment(payhereData.checkoutData);
  return;
}

      // Step 2: current test payment flow
      const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: selectedPlan,
          amount: selectedAmount,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setError(createData.message || "Failed to create payment");
        return;
      }

      const paymentId = createData.payment._id;

      const markPaidRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/mark-paid`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentId,
            transactionId: `TEST_${Date.now()}`,
          }),
        }
      );

      const markPaidData = await markPaidRes.json();

      if (!markPaidRes.ok) {
        setError(markPaidData.message || "Failed to complete payment");
        return;
      }

      setMessage("Payment completed successfully ✅ Membership updated");
      await Promise.all([fetchPayments(), fetchCurrentUser()]);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const newTotalDays = currentRemainingDays + selectedDays;

  return (
    <PageTransition>
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-400">
                Payment Center
              </p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Membership
                <span className="block text-red-500">Payments</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-400 sm:text-base">
                Choose a plan and complete your payment flow. Later, this same
                page can use your PayHere credentials without rebuilding the UI.
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
                Choose Plan
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                Pay Now
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Membership Plan
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-4 text-white outline-none transition focus:border-red-500"
                  >
                    {plans.map((plan) => (
                      <option key={plan.name} value={plan.name}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Amount
                  </p>
                  <p className="mt-2 text-3xl font-black text-green-400">
                    LKR {selectedAmount}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                      Current Days
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {currentRemainingDays}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">
                      New Plan Days
                    </p>
                    <p className="mt-2 text-2xl font-black text-yellow-400">
                      {selectedDays}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-green-300">
                      After Payment
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-400">
                      {newTotalDays}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-gray-300">
                  This payment will add{" "}
                  <span className="font-bold text-white">{selectedDays}</span>{" "}
                  days to your current remaining access, making your new total{" "}
                  <span className="font-bold text-green-400">
                    {newTotalDays}
                  </span>{" "}
                  days.
                </div>

                {checkoutData && (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-4 text-sm text-blue-200">
                    PayHere-ready checkout prepared for order{" "}
                    <span className="font-bold">{checkoutData.order_id}</span>.
                  </div>
                )}

                <button
                  onClick={handleCreatePayment}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:scale-[1.01] hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Pay Now"}
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
                Payment History
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                Your Records
              </h2>

              {loading ? (
                <p className="mt-6 text-gray-400">Loading payments...</p>
              ) : payments.length === 0 ? (
                <p className="mt-6 text-gray-400">No payments found yet.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4"
                    >
                      <p>
                        <span className="font-semibold text-gray-400">Plan:</span>{" "}
                        {payment.planName}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Amount:</span>{" "}
                        LKR {payment.amount}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Status:</span>{" "}
                        <span
                          className={
                            payment.status === "paid"
                              ? "text-green-400"
                              : payment.status === "failed"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }
                        >
                          {payment.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Method:</span>{" "}
                        {payment.paymentMethod}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-400">Date:</span>{" "}
                        {new Date(payment.createdAt).toLocaleDateString()}
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