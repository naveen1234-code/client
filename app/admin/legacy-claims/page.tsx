"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import { getLegacyClaims, approveLegacyClaim } from "@/lib/api";

type LegacyClaimType = {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  claimId: string;
  legacyPlan: string;
  status: string;
  claimedAt: string;
  ledgerDetails: string;
  notes: string;
};

export default function LegacyClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<LegacyClaimType[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const data = await getLegacyClaims();
      setClaims(data);
    } catch (error) {
      console.error("Failed to fetch legacy claims:", error);
      showNotification("error", "Failed to load legacy claims");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId: string) => {
    try {
      setApproving(claimId);
      await approveLegacyClaim(claimId);
      
      // Remove the approved claim from the list
      setClaims(claims.filter((claim) => claim._id !== claimId));
      showNotification("success", "Legacy claim approved successfully");
    } catch (error) {
      console.error("Failed to approve claim:", error);
      showNotification("error", "Failed to approve claim");
    } finally {
      setApproving(null);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Legacy Claims Queue
            </h1>
            <p className="text-gray-400">
              Review and approve legacy membership claims from paper ledger records
            </p>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                notification.type === "success"
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Claims Table */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                Loading legacy claims...
              </div>
            ) : claims.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No pending legacy claims found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Claim ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Ledger Details
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Claimed At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {claims.map((claim) => (
                      <tr
                        key={claim._id}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono text-gray-300">
                          {claim.claimId}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {claim.userId.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {claim.userId.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                            {claim.legacyPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                          {claim.ledgerDetails || "No details provided"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(claim.claimedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleApprove(claim._id)}
                            disabled={approving === claim._id}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approving === claim._id ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Approving...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">
              Plan Duration Information
            </h3>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• <strong>1 Year</strong>: 12 months membership</li>
              <li>• <strong>6 Months</strong>: 6 months membership</li>
              <li>• <strong>3 Months</strong>: 3 months membership</li>
              <li>• <strong>Monthly</strong>: 1 month membership</li>
            </ul>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
