"use client";

import { useEffect, useState } from "react";
<<<<<<< HEAD
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
=======
import PageTransition from "@/components/PageTransition";

type LegacyClaimType = {
  _id: string;
  claimantUserId: string;
  claimantEmail: string;
  claimantName: string;
  ledgerReferenceNumber: string;
  ledgerEntryDate: string;
  originalMembershipPlan: string;
  originalMembershipStartDate: string;
  originalMembershipEndDate: string;
  originalAmountPaid: number;
  originalPaymentMethod: string;
  status: string;
  submittedAt: string;
  claimantUserId?: {
    name: string;
    fullName?: string;
    email: string;
  };
};

export default function LegacyClaimsQueue() {
  const [claims, setClaims] = useState<LegacyClaimType[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<LegacyClaimType | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/legacy-claims/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClaims(data);
      } else {
        showNotification("Failed to fetch legacy claims", "error");
      }
    } catch (error) {
      showNotification("Error fetching legacy claims", "error");
>>>>>>> 289d7e2cb861e026e111d0ea2b55c34db13ce9a2
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  useEffect(() => {
    fetchClaims();
  }, []);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const handleApprove = async (claimId: string) => {
    setApproving(claimId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/legacy-claims/${claimId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewNotes: "" }),
        }
      );

      if (response.ok) {
        showNotification("Legacy claim approved successfully", "success");
        setClaims(claims.filter((claim) => claim._id !== claimId));
      } else {
        showNotification("Failed to approve legacy claim", "error");
      }
    } catch (error) {
      showNotification("Error approving legacy claim", "error");
>>>>>>> 289d7e2cb861e026e111d0ea2b55c34db13ce9a2
    } finally {
      setApproving(null);
    }
  };

<<<<<<< HEAD
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString: string) => {
=======
  const handleRejectClick = (claim: LegacyClaimType) => {
    setSelectedClaim(claim);
    setShowRejectModal(true);
    setRejectNotes("");
  };

  const handleReject = async () => {
    if (!selectedClaim || !rejectNotes.trim()) {
      showNotification("Please provide rejection notes", "error");
      return;
    }

    setRejecting(selectedClaim._id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/legacy-claims/${selectedClaim._id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewNotes: rejectNotes }),
        }
      );

      if (response.ok) {
        showNotification("Legacy claim rejected successfully", "success");
        setClaims(claims.filter((claim) => claim._id !== selectedClaim._id));
        setShowRejectModal(false);
        setSelectedClaim(null);
        setRejectNotes("");
      } else {
        showNotification("Failed to reject legacy claim", "error");
      }
    } catch (error) {
      showNotification("Error rejecting legacy claim", "error");
    } finally {
      setRejecting(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
>>>>>>> 289d7e2cb861e026e111d0ea2b55c34db13ce9a2
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
<<<<<<< HEAD
      hour: "2-digit",
      minute: "2-digit",
=======
>>>>>>> 289d7e2cb861e026e111d0ea2b55c34db13ce9a2
    });
  };

  return (
    <PageTransition>
<<<<<<< HEAD
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
=======
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Legacy Claims Queue
            </h1>
            <p className="text-gray-400">
              Review and approve paper ledger member claims
            </p>
          </div>

          {notification.show && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                notification.type === "success"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
>>>>>>> 289d7e2cb861e026e111d0ea2b55c34db13ce9a2
              }`}
            >
              {notification.message}
            </div>
          )}

<<<<<<< HEAD
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
=======
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              <p className="mt-4 text-gray-400">Loading legacy claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg">
                No pending legacy claims to review
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ledger Reference
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Original Dates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {claims.map((claim) => (
                    <tr key={claim._id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {claim.claimantName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {claim.claimantEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {claim.ledgerReferenceNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Entry: {formatDate(claim.ledgerEntryDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-200">
                          {claim.originalMembershipPlan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {formatDate(claim.originalMembershipStartDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {formatDate(claim.originalMembershipEndDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          LKR {claim.originalAmountPaid.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {claim.originalPaymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(claim.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApprove(claim._id)}
                          disabled={approving === claim._id}
                          className="mr-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approving === claim._id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleRejectClick(claim)}
                          disabled={rejecting === claim._id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rejecting === claim._id ? "Rejecting..." : "Reject"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && selectedClaim && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">
                  Reject Legacy Claim
                </h3>
                <p className="text-gray-400 mb-4">
                  Are you sure you want to reject the legacy claim from{" "}
                  {selectedClaim.claimantName}?
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rejection Notes (Required)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedClaim(null);
                      setRejectNotes("");
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectNotes.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject Claim
                  </button>
                </div>
              </div>
            </div>
          )}
>>>>>>> 289d7e2cb861e026e111d0ea2b55c34db13ce9a2
        </div>
      </div>
    </PageTransition>
  );
}
