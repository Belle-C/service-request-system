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

function stepperDotClass(status: string) {
  if (status === "Approved") return "stepper-dot is-approved";
  if (status === "Pending") return "stepper-dot is-pending";
  if (status === "Returned") return "stepper-dot is-returned";
  if (status === "Rejected") return "stepper-dot is-rejected";
  return "stepper-dot is-idle";
}

export default function ApprovalInboxClient({
  approvals,
  isOffline,
}: ApprovalInboxClientProps) {
  const router = useRouter();
  const { currentUser, selectedRole } = useRole();
  const [isPending, startTransition] = useTransition();

  const commentsRef = useRef<HTMLTextAreaElement>(null);

  const [tab, setTab] = useState<"Pending" | "Actioned">("Pending");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredApprovals = approvals.filter((app) => {
    if (tab === "Pending") return app.status === "Pending";
    return ["Approved", "Returned", "Rejected"].includes(app.status);
  });

  const selectedApproval = approvals.find((app) => app.id === selectedRow);

  const setAlert = (
    type: "success" | "error" | "loading" | "idle",
    message: string,
    target: "page" | "drawer"
  ) => {
    const id = target === "page" ? "page-status-alert" : "drawer-status-alert";
    const el = document.getElementById(id);
    if (!el) return;

    if (type === "idle") {
      el.className = "hidden";
      el.innerText = "";
    } else {
      el.className = `alert alert-${
        type === "loading" ? "loading" : type === "success" ? "success" : "error"
      }`;
      el.innerText = message;
    }
  };

  const handleAction = async (action: "Approve" | "Return" | "Reject") => {
    if (!selectedApproval || isOffline) return;

    const comments = commentsRef.current?.value || "";
    if (["Return", "Reject"].includes(action) && !comments.trim()) {
      setAlert(
        "error",
        `${action} action requires comments explaining the decision.`,
        "drawer"
      );
      return;
    }

    setAlert("loading", `Processing ${action.toLowerCase()} action…`, "drawer");

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
      if (!res.ok)
        throw new Error(data.error || "Failed to process approval action");

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
      setAlert(
        "error",
        err instanceof Error ? err.message : "Error processing action",
        "drawer"
      );
    }
  };

  const handleBatchApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const checkedIds = formData.getAll("approvalId") as string[];

    if (checkedIds.length === 0) {
      setAlert("error", "No requests selected for batch approval.", "page");
      return;
    }

    setAlert("loading", `Approving ${checkedIds.length} requests…`, "page");

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
      if (!res.ok) throw new Error(data.error || "Batch approval failed");

      setAlert(
        "success",
        `Batch approved ${checkedIds.length} requests successfully!`,
        "page"
      );
      form.reset();
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        setAlert("idle", "", "page");
      }, 2000);
    } catch (err) {
      setAlert(
        "error",
        err instanceof Error ? err.message : "Error during batch approval",
        "page"
      );
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

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const actionedCount = approvals.filter((a) => a.status !== "Pending").length;

  return (
    <div>
      {selectedRole !== "APPROVER" && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <strong>Simulated Role Check:</strong> Approval Inbox operations
          require the <strong>APPROVER</strong> role. Select &ldquo;Approver&rdquo; in
          the header to simulate manager approvals.
        </div>
      )}

      {isOffline && (
        <div className="offline-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
              Offline Mode
            </p>
            <p style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              Viewing cached interface. Approval actions are locked.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button
          id="tab-pending"
          onClick={() => {
            setTab("Pending");
            setAlert("idle", "", "page");
          }}
          className={`tab-btn ${tab === "Pending" ? "is-active" : ""}`}
        >
          Pending Approvals
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                fontWeight: 700,
                background: tab === "Pending" ? "var(--primary)" : "var(--surface-muted)",
                color: tab === "Pending" ? "#fff" : "var(--muted)",
                borderRadius: 9999,
                padding: "1px 6px",
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          id="tab-actioned"
          onClick={() => {
            setTab("Actioned");
            setAlert("idle", "", "page");
          }}
          className={`tab-btn ${tab === "Actioned" ? "is-active" : ""}`}
        >
          Actioned History
          {actionedCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                fontWeight: 700,
                background: tab === "Actioned" ? "var(--primary)" : "var(--surface-muted)",
                color: tab === "Actioned" ? "#fff" : "var(--muted)",
                borderRadius: 9999,
                padding: "1px 6px",
              }}
            >
              {actionedCount}
            </span>
          )}
        </button>
      </div>

      <div id="page-status-alert" className="hidden" style={{ marginBottom: 16 }} />

      <form onSubmit={handleBatchApprove}>
        <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {tab === "Pending" && (
                    <th style={{ width: 48 }}>
                      <input
                        type="checkbox"
                        id="select-all-approvals"
                        onChange={(e) => {
                          const checkboxes = document.querySelectorAll<HTMLInputElement>(
                            'input[name="approvalId"]'
                          );
                          checkboxes.forEach((cb) => (cb.checked = e.target.checked));
                        }}
                        title="Select all"
                      />
                    </th>
                  )}
                  <th>Ticket</th>
                  <th>Requester</th>
                  <th>Subcategory</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={tab === "Pending" ? 7 : 6}>
                      <div className="empty-state">
                        <p className="empty-state-icon">
                          {tab === "Pending" ? "✅" : "📋"}
                        </p>
                        <p className="empty-state-title">
                          {tab === "Pending"
                            ? "No pending approvals"
                            : "No action history"}
                        </p>
                        <p className="empty-state-body">
                          {tab === "Pending"
                            ? "You are all caught up. No requests awaiting your review."
                            : "Actioned approvals will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => selectRow(app.id)}
                      className={selectedRow === app.id ? "is-selected" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      {tab === "Pending" && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            name="approvalId"
                            value={app.id}
                            id={`approval-cb-${app.id}`}
                          />
                        </td>
                      )}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--primary)",
                          }}
                        >
                          {app.request.ticketNo}
                        </span>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, color: "var(--text)" }}>
                          {app.request.requester.name}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--muted)" }}>
                          {app.request.requester.email}
                        </p>
                      </td>
                      <td style={{ color: "var(--text)" }}>
                        {app.request.subcategory || "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--muted)",
                          }}
                        >
                          Level {app.levelNo}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          id={`review-btn-${app.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectRow(app.id);
                          }}
                          className="btn btn-ghost btn-sm"
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
        </div>

        {tab === "Pending" && filteredApprovals.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              id="batch-approve-btn"
              disabled={isOffline || isPending}
              className="btn btn-primary"
            >
              Batch Approve Selected →
            </button>
          </div>
        )}
      </form>

      {/* Drawer */}
      {drawerOpen && selectedApproval && (
        <div>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className="drawer-panel animate-fade-in">
            <div className="drawer-header">
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  Evaluate Request — Level {selectedApproval.levelNo}
                </span>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--primary)",
                    marginTop: 2,
                    letterSpacing: "-0.015em",
                  }}
                >
                  {selectedApproval.request.ticketNo}
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                type="button"
                className="drawer-close-btn"
                id="approval-drawer-close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div id="drawer-status-alert" className="hidden" style={{ marginBottom: 16 }} />

              {/* Details grid */}
              <div className="info-grid" style={{ marginBottom: 20 }}>
                <div>
                  <p className="info-cell-label">Requester</p>
                  <p className="info-cell-value">
                    {selectedApproval.request.requester.name}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {selectedApproval.request.requester.email}
                  </p>
                </div>
                <div>
                  <p className="info-cell-label">Subcategory</p>
                  <p className="info-cell-value">
                    {selectedApproval.request.subcategory || "—"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 8,
                  }}
                >
                  Description
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text)",
                    lineHeight: 1.7,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 14px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedApproval.request.description || (
                    <span
                      style={{ color: "var(--muted-light)", fontStyle: "italic" }}
                    >
                      No description provided.
                    </span>
                  )}
                </p>
              </div>

              {/* Workflow Stepper */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 20,
                  marginBottom: 24,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 16,
                  }}
                >
                  Routing Path
                </p>
                <div className="stepper">
                  {selectedApproval.request.approvals.map((app) => (
                    <div key={app.id} className="stepper-step">
                      <span className={stepperDotClass(app.status)} />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--primary)",
                            }}
                          >
                            Level {app.levelNo}: {app.approver.name}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              marginTop: 1,
                            }}
                          >
                            {app.approver.email}
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--surface-muted)",
                            color: "var(--muted)",
                            whiteSpace: "nowrap",
                            textTransform: "uppercase",
                          }}
                        >
                          {app.status}
                        </span>
                      </div>
                      {app.comments && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            fontStyle: "italic",
                            color: "#92400e",
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            borderRadius: "var(--radius-sm)",
                            padding: "8px 10px",
                          }}
                        >
                          &ldquo;{app.comments}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form */}
              {selectedApproval.status === "Pending" && (
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 20,
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 10,
                    }}
                  >
                    Your Decision
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label" htmlFor="drawer-comments">
                      Comments
                      <span
                        style={{
                          fontWeight: 400,
                          fontSize: 11,
                          textTransform: "none",
                          color: "var(--muted-light)",
                          marginLeft: 4,
                        }}
                      >
                        (required for Return / Reject)
                      </span>
                    </label>
                    <textarea
                      id="drawer-comments"
                      ref={commentsRef}
                      rows={3}
                      placeholder="Enter your decision rationale or amendment notes…"
                      className="field-input"
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      id="approve-action-btn"
                      onClick={() => handleAction("Approve")}
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      Approve
                    </button>
                    <button
                      id="return-action-btn"
                      onClick={() => handleAction("Return")}
                      type="button"
                      className="btn"
                      style={{
                        flex: 1,
                        background: "#f59e0b",
                        color: "#fff",
                      }}
                    >
                      Return
                    </button>
                    <button
                      id="reject-action-btn"
                      onClick={() => handleAction("Reject")}
                      type="button"
                      className="btn btn-danger"
                      style={{ flex: 1 }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
