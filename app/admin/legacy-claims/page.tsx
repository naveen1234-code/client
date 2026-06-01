"use client";

import { useEffect, useState } from "react";
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
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setApproving(null);
    }
  };

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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <PageTransition>
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
              }`}
            >
              {notification.message}
            </div>
          )}

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
        </div>
      </div>
    </PageTransition>
  );
}
