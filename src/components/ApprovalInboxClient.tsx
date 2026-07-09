"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/RoleContext";
import { StatusBadge } from "@/components/StatusBadge";

interface User {
  name: string;
  email: string;
}

interface RequestApprovalInfo {
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
  subcategory: string | null;
  description: string | null;
  requester: User;
  approvals: RequestApprovalInfo[];
}

interface ApprovalItem {
  id: string;
  requestId: string;
  levelNo: number;
  status: string;
  decision: string | null;
  comments: string | null;
  decisionAt: Date | null;
  createdAt: Date;
  request: RequestItem;
}

interface ApprovalInboxClientProps {
  approvals: ApprovalItem[];
  isOffline: boolean;
}

export default function ApprovalInboxClient({ approvals, isOffline }: ApprovalInboxClientProps) {
  const router = useRouter();
  const { currentUser, selectedRole } = useRole();
  const [isPending, startTransition] = useTransition();

  const commentsRef = useRef<HTMLTextAreaElement>(null);

  // Allowed React states
  const [tab, setTab] = useState<"Pending" | "Actioned">("Pending");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter approvals based on tab (Pending vs processed/Actioned)
  const filteredApprovals = approvals.filter((app) => {
    if (tab === "Pending") {
      return app.status === "Pending";
    } else {
      return ["Approved", "Returned", "Rejected"].includes(app.status);
    }
  });

  const selectedApproval = approvals.find((app) => app.id === selectedRow);

  const setAlert = (type: "success" | "error" | "loading" | "idle", message: string, target: "page" | "drawer") => {
    const id = target === "page" ? "page-status-alert" : "drawer-status-alert";
    const el = document.getElementById(id);
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

  // Action (Approve, Return, Reject) on a specific approval
  const handleAction = async (action: "Approve" | "Return" | "Reject") => {
    if (!selectedApproval || isOffline) return;

    const comments = commentsRef.current?.value || "";
    if (["Return", "Reject"].includes(action) && !comments.trim()) {
      setAlert("error", `${action} action requires comments explaining the decision.`, "drawer");
      return;
    }

    setAlert("loading", `Processing ${action.toLowerCase()} action...`, "drawer");

    try {
      const res = await fetch(`/api/approval-actions/${selectedApproval.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorEmail: currentUser?.email,
          action,
          comments: comments || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process approval action");
      }

      setAlert("success", `Request successfully ${action.toLowerCase()}d!`, "drawer");

      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => {
        setAlert("idle", "", "drawer");
        setDrawerOpen(false);
        setSelectedRow(null);
      }, 1500);
    } catch (err) {
      setAlert("error", err instanceof Error ? err.message : "Error processing action", "drawer");
    }
  };

  // Batch approve checked requests
  const handleBatchApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    // Get checked checkboxes from DOM
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const checkedIds = formData.getAll("approvalId") as string[];

    if (checkedIds.length === 0) {
      setAlert("error", "No requests selected for batch approval.", "page");
      return;
    }

    setAlert("loading", `Approving ${checkedIds.length} requests in batch...`, "page");

    try {
      const res = await fetch("/api/approval-actions/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorEmail: currentUser?.email,
          approvalIds: checkedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Batch approval failed");
      }

      setAlert("success", `Batch approved ${checkedIds.length} requests successfully!`, "page");
      
      // Reset checkboxes
      form.reset();

      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => {
        setAlert("idle", "", "page");
      }, 2000);
    } catch (err) {
      setAlert("error", err instanceof Error ? err.message : "Error during batch approval", "page");
    }
  };

  const selectRow = (id: string) => {
    setSelectedRow(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
  };

  return (
    <div className="space-y-6">
      {selectedRole !== "APPROVER" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs mb-4">
          <p className="font-semibold">Simulated Role Check</p>
          <p className="mt-1 text-xs">
            Approval Inbox operations require the <strong>APPROVER</strong> role. Please select &quot;Approver Mode&quot; in the header to fully simulate Jason Chan&apos;s manager approvals.
          </p>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-px">
        <button
          onClick={() => {
            setTab("Pending");
            setAlert("idle", "", "page");
          }}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
            tab === "Pending"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--primary)]"
          }`}
        >
          Pending Approvals ({approvals.filter((a) => a.status === "Pending").length})
        </button>
        <button
          onClick={() => {
            setTab("Actioned");
            setAlert("idle", "", "page");
          }}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
            tab === "Actioned"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--primary)]"
          }`}
        >
          Actioned History ({approvals.filter((a) => a.status !== "Pending").length})
        </button>
      </div>

      <div id="page-status-alert" className="hidden" />

      {/* Main Inbox List */}
      <form onSubmit={handleBatchApprove}>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-xs">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                {tab === "Pending" && (
                  <th className="px-6 py-3.5 w-10">
                    <input
                      type="checkbox"
                      className="cursor-pointer size-4 rounded-sm border-[var(--border)]"
                      onChange={(e) => {
                        const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="approvalId"]');
                        checkboxes.forEach((cb) => (cb.checked = e.target.checked));
                      }}
                    />
                  </th>
                )}
                <th className="px-6 py-3.5">Ticket</th>
                <th className="px-6 py-3.5">Requester</th>
                <th className="px-6 py-3.5">Subcategory</th>
                <th className="px-6 py-3.5">Routing Level</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[var(--muted)]">
                    {tab === "Pending" ? "No pending approvals found." : "No action history found."}
                  </td>
                </tr>
              ) : (
                filteredApprovals.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => selectRow(app.id)}
                    className={`hover:bg-[var(--surface-muted)] transition cursor-pointer ${
                      selectedRow === app.id ? "bg-[var(--surface-muted)] font-medium" : ""
                    }`}
                  >
                    {tab === "Pending" && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          name="approvalId"
                          value={app.id}
                          className="cursor-pointer size-4 rounded-sm border-[var(--border)]"
                        />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-[var(--primary)]">
                      {app.request.ticketNo}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-semibold text-[var(--text)]">{app.request.requester.name}</div>
                      <div className="text-xs text-[var(--muted)]">{app.request.requester.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{app.request.subcategory || "N/A"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-[var(--muted)]">
                      Level {app.levelNo}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectRow(app.id);
                        }}
                        className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tab === "Pending" && filteredApprovals.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isOffline || isPending}
              className="rounded-md bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              Batch Approve Selected
            </button>
          </div>
        )}
      </form>

      {/* Slide-out Drawer */}
      {drawerOpen && selectedApproval && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-xs transition-opacity" onClick={closeDrawer} />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform bg-white p-6 shadow-xl transition-all flex flex-col justify-between border-l border-[var(--border)]">
              
              <div className="overflow-y-auto space-y-6 flex-1 pr-1">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                      Evaluate Request (Level {selectedApproval.levelNo})
                    </span>
                    <h3 className="text-xl font-bold text-[var(--primary)] mt-1">
                      {selectedApproval.request.ticketNo}
                    </h3>
                  </div>
                  <button
                    onClick={closeDrawer}
                    type="button"
                    className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div id="drawer-status-alert" className="hidden" />

                {/* Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--surface-muted)] p-4 border border-[var(--border)]">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Requester Name
                      </span>
                      <span className="block text-sm font-semibold text-[var(--primary)] mt-1">
                        {selectedApproval.request.requester.name}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Form Subcategory
                      </span>
                      <span className="block text-sm font-semibold text-[var(--primary)] mt-1">
                        {selectedApproval.request.subcategory || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Requester Email
                    </span>
                    <p className="text-xs text-[var(--text)] mt-1">{selectedApproval.request.requester.email}</p>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Description
                    </span>
                    <p className="text-sm text-[var(--text)] whitespace-pre-wrap mt-1 leading-relaxed bg-[var(--background)] p-3 rounded-md border border-[var(--border)]">
                      {selectedApproval.request.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Approval Stepper Progress */}
                <div className="border-t border-[var(--border)] pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
                    Workflow Routing Path
                  </h4>
                  <div className="relative border-l border-[var(--border)] ml-3 pl-5 space-y-6">
                    {selectedApproval.request.approvals.map((app) => (
                      <div key={app.id} className="relative">
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
                            <div className="mt-1 bg-amber-50/50 text-[11px] text-amber-800 p-1.5 rounded-sm italic border border-amber-200/50">
                              &quot;{app.comments}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Action Form (only if selected approval is Pending) */}
                {selectedApproval.status === "Pending" && (
                  <div className="border-t border-[var(--border)] pt-5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-2" htmlFor="drawer-comments">
                        Approval Comments / Reasons
                      </label>
                      <textarea
                        id="drawer-comments"
                        ref={commentsRef}
                        rows={3}
                        placeholder="Required when returning for amendment or rejecting..."
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-hidden"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => handleAction("Approve")}
                        type="button"
                        className="flex-1 rounded-md bg-[var(--primary)] py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction("Return")}
                        type="button"
                        className="flex-1 rounded-md bg-amber-500 py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
                      >
                        Return
                      </button>
                      <button
                        onClick={() => handleAction("Reject")}
                        type="button"
                        className="flex-1 rounded-md bg-red-600 py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
