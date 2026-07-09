"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/RoleContext";
import { StatusBadge } from "@/components/StatusBadge";

interface User {
  name: string;
  email: string;
}

interface Approval {
  id: string;
  levelNo: number;
  status: string;
  decision: string | null;
  comments: string | null;
  decisionAt: string | null;
  approver: User;
}

interface RequestItem {
  id: string;
  ticketNo: string;
  moduleCode: string;
  formCode: string;
  status: string;
  subcategory: string | null;
  description: string | null;
  currentApprovalLevel: number | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  requester: User;
  approvals: Approval[];
}

interface MyRequestsClientProps {
  requests: RequestItem[];
  isOffline: boolean;
}

const tabOptions = ["All Requests", "Pending Approval", "Returned", "Rejected", "Approved"] as const;
type TabType = (typeof tabOptions)[number];

export default function MyRequestsClient({ requests, isOffline }: MyRequestsClientProps) {
  const router = useRouter();
  const { currentUser } = useRole();
  const [isPending, startTransition] = useTransition();

  // Allowed React states
  const [tab, setTab] = useState<TabType>("All Requests");
  const [searchText, setSearchText] = useState("");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter requests based on tab and search
  const filteredRequests = requests.filter((r) => {
    // Tab filter
    if (tab === "Pending Approval" && r.status !== "Pending Approval") return false;
    if (tab === "Returned" && r.status !== "Returned for Amendment") return false;
    if (tab === "Rejected" && r.status !== "Rejected") return false;
    if (tab === "Approved" && r.status !== "Approved") return false;

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matchTicket = r.ticketNo.toLowerCase().includes(q);
      const matchSub = (r.subcategory || "").toLowerCase().includes(q);
      const matchDesc = (r.description || "").toLowerCase().includes(q);
      return matchTicket || matchSub || matchDesc;
    }

    return true;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRow);

  const setDrawerAlert = (type: "success" | "error" | "loading" | "idle", message: string) => {
    const el = document.getElementById("drawer-alert");
    if (!el) return;
    if (type === "idle") {
      el.className = "hidden";
      el.innerText = "";
    } else {
      el.className = `p-3 rounded-md text-xs font-semibold mb-4 ${
        type === "loading"
          ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
          : type === "success"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`;
      el.innerText = message;
    }
  };

  // Submit draft/returned request
  const handleResubmit = async (id: string) => {
    setDrawerAlert("loading", "Submitting request...");
    try {
      const res = await fetch(`/api/requests/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setDrawerAlert("success", "Request submitted successfully!");
      startTransition(() => {
        router.refresh();
      });
      // Keep alert for a moment then close
      setTimeout(() => {
        setDrawerAlert("idle", "");
        setDrawerOpen(false);
        setSelectedRow(null);
      }, 1500);
    } catch (err) {
      setDrawerAlert("error", err instanceof Error ? err.message : "Error submitting request");
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedRow(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
  };

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
            Offline Mode
          </p>
          <p className="mt-1 text-xs">
            Viewing local cached structures. Submitting or loading new data is currently unavailable.
          </p>
        </div>
      )}

      {/* Tabs and Search Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* RequestTabs */}
        <div className="flex flex-wrap gap-1 bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)]">
          {tabOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === t
                  ? "bg-white text-[var(--primary)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search ticket, category, desc..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-sm focus:border-[var(--primary)] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-xs">
        <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
          <thead className="bg-[var(--surface-muted)] text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-6 py-3.5">Ticket ID</th>
              <th className="px-6 py-3.5">Subcategory</th>
              <th className="px-6 py-3.5">Created Date</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-[var(--muted)]">
                  {isOffline ? "Database offline. No requests available." : "No requests found matching the filters."}
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => handleRowClick(r.id)}
                  className={`hover:bg-[var(--surface-muted)] transition cursor-pointer ${
                    selectedRow === r.id ? "bg-[var(--surface-muted)] font-medium" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[var(--primary)]">
                    {r.ticketNo}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{r.subcategory || "N/A"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-xs text-[var(--muted)]">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(r.id);
                      }}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out Drawer */}
      {drawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity" onClick={closeDrawer} />
          
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform bg-white p-6 shadow-xl transition-all flex flex-col justify-between border-l border-[var(--border)]">
              
              {/* Drawer Content */}
              <div className="overflow-y-auto space-y-6 flex-1 pr-1">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                      Request Details
                    </span>
                    <h3 className="text-xl font-bold text-[var(--primary)] mt-1">
                      {selectedRequest.ticketNo}
                    </h3>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div id="drawer-alert" className="hidden" />

                {/* Status Section */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--surface-muted)] p-4 border border-[var(--border)]">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Current Status
                    </span>
                    <span className="inline-block mt-1">
                      <StatusBadge status={selectedRequest.status} />
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Subcategory
                    </span>
                    <span className="block text-sm font-semibold text-[var(--primary)] mt-1.5">
                      {selectedRequest.subcategory || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Requester Details
                    </span>
                    <p className="text-sm font-medium text-[var(--primary)] mt-1">
                      {selectedRequest.requester.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {selectedRequest.requester.email}
                    </p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Description
                    </span>
                    <p className="text-sm text-[var(--text)] whitespace-pre-wrap mt-1 leading-relaxed bg-[var(--background)] p-3 rounded-md border border-[var(--border)]">
                      {selectedRequest.description || "No description provided."}
                    </p>
                  </div>

                  {selectedRequest.submittedAt && (
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Submitted Date
                      </span>
                      <p className="text-xs text-[var(--text)] mt-1">
                        {new Date(selectedRequest.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Approvals Routing Stepper */}
                <div className="border-t border-[var(--border)] pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
                    Approval Workflow
                  </h4>
                  {selectedRequest.approvals.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] italic">No approval routing set up yet.</p>
                  ) : (
                    <div className="relative border-l border-[var(--border)] ml-3 pl-5 space-y-6">
                      {selectedRequest.approvals.map((app) => (
                        <div key={app.id} className="relative">
                          {/* Dot indicator */}
                          <span className={`absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-white ${
                            app.status === "Approved"
                              ? "bg-green-500"
                              : app.status === "Pending"
                              ? "bg-blue-500 animate-pulse"
                              : app.status === "Returned"
                              ? "bg-amber-500"
                              : app.status === "Rejected"
                              ? "bg-red-500"
                              : "bg-gray-300"
                          }`} />
                          
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[var(--primary)]">
                                Level {app.levelNo}: {app.approver.name}
                              </p>
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-[var(--surface-muted)] text-[var(--muted)]">
                                {app.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--muted)]">{app.approver.email}</p>
                            {app.comments && (
                              <div className="mt-1.5 bg-amber-50/50 border border-amber-200/60 text-xs text-amber-800 p-2 rounded-md italic">
                                &quot;{app.comments}&quot;
                              </div>
                            )}
                            {app.decisionAt && (
                              <p className="text-[9px] text-[var(--muted)] mt-1">
                                Decided: {new Date(app.decisionAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons at the bottom */}
              {["Draft", "Returned for Amendment"].includes(selectedRequest.status) && (
                <div className="border-t border-[var(--border)] pt-4 mt-6">
                  <button
                    onClick={() => handleResubmit(selectedRequest.id)}
                    disabled={isOffline || isPending}
                    className="w-full rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    Submit Draft Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
