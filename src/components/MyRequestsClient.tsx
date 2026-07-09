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

const tabOptions = [
  "All Requests",
  "Pending Approval",
  "Returned",
  "Rejected",
  "Approved",
] as const;
type TabType = (typeof tabOptions)[number];

function stepperDotClass(status: string) {
  if (status === "Approved") return "stepper-dot is-approved";
  if (status === "Pending") return "stepper-dot is-pending";
  if (status === "Returned") return "stepper-dot is-returned";
  if (status === "Rejected") return "stepper-dot is-rejected";
  return "stepper-dot is-idle";
}

export default function MyRequestsClient({
  requests,
  isOffline,
}: MyRequestsClientProps) {
  const router = useRouter();
  const { currentUser } = useRole();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<TabType>("All Requests");
  const [searchText, setSearchText] = useState("");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (tab === "Pending Approval" && r.status !== "Pending Approval") return false;
    if (tab === "Returned" && r.status !== "Returned for Amendment") return false;
    if (tab === "Rejected" && r.status !== "Rejected") return false;
    if (tab === "Approved" && r.status !== "Approved") return false;

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      return (
        r.ticketNo.toLowerCase().includes(q) ||
        (r.subcategory || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    }

    return true;
  });

  const selectedRequest = requests.find((r) => r.id === selectedRow);

  const setDrawerAlert = (
    type: "success" | "error" | "loading" | "idle",
    message: string
  ) => {
    const el = document.getElementById("drawer-alert");
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

  const handleResubmit = async (id: string) => {
    setDrawerAlert("loading", "Submitting request…");
    try {
      const res = await fetch(`/api/requests/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      setDrawerAlert("success", "Request submitted successfully!");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        setDrawerAlert("idle", "");
        setDrawerOpen(false);
        setSelectedRow(null);
      }, 1500);
    } catch (err) {
      setDrawerAlert(
        "error",
        err instanceof Error ? err.message : "Error submitting request"
      );
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

  const tabCounts = {
    "All Requests": requests.length,
    "Pending Approval": requests.filter((r) => r.status === "Pending Approval").length,
    Returned: requests.filter((r) => r.status === "Returned for Amendment").length,
    Rejected: requests.filter((r) => r.status === "Rejected").length,
    Approved: requests.filter((r) => r.status === "Approved").length,
  };

  return (
    <div>
      {isOffline && (
        <div className="offline-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
              Offline Mode
            </p>
            <p style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              Viewing cached structures. Submitting new data is unavailable.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Tabs */}
        <div className="tab-bar" style={{ flex: 1, minWidth: 300 }}>
          {tabOptions.map((t) => (
            <button
              key={t}
              id={`tab-${t.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setTab(t)}
              className={`tab-btn ${tab === t ? "is-active" : ""}`}
            >
              {t}
              {tabCounts[t] > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    background:
                      tab === t ? "var(--primary)" : "var(--surface-muted)",
                    color: tab === t ? "#fff" : "var(--muted)",
                    borderRadius: 9999,
                    padding: "1px 6px",
                    verticalAlign: "middle",
                  }}
                >
                  {tabCounts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="search-input-wrap" style={{ minWidth: 220 }}>
          <input
            type="text"
            placeholder="Search tickets…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            id="my-requests-search"
            className="field-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="card"
        style={{ overflow: "hidden" }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subcategory</th>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <p className="empty-state-icon">📭</p>
                      <p className="empty-state-title">
                        {isOffline
                          ? "Database offline"
                          : "No requests found"}
                      </p>
                      <p className="empty-state-body">
                        {isOffline
                          ? "No requests available while offline."
                          : "No requests match the current filter."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r.id)}
                    className={selectedRow === r.id ? "is-selected" : ""}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "var(--primary)",
                          fontSize: 13,
                        }}
                      >
                        {r.ticketNo}
                      </span>
                    </td>
                    <td style={{ color: "var(--text)" }}>
                      {r.subcategory || (
                        <span style={{ color: "var(--muted-light)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : new Date(r.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(r.id);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12 }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selectedRequest && (
        <div>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className="drawer-panel animate-fade-in">
            {/* Header */}
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
                  Request Details
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
                  {selectedRequest.ticketNo}
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                className="drawer-close-btn"
                id="drawer-close-btn"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="drawer-body">
              <div id="drawer-alert" className="hidden" />

              {/* Status + Category info grid */}
              <div className="info-grid" style={{ marginBottom: 24 }}>
                <div>
                  <p className="info-cell-label">Current Status</p>
                  <div style={{ marginTop: 4 }}>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
                <div>
                  <p className="info-cell-label">Subcategory</p>
                  <p className="info-cell-value">
                    {selectedRequest.subcategory || "—"}
                  </p>
                </div>
              </div>

              {/* Requester */}
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
                  Requester
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--primary)",
                      flexShrink: 0,
                    }}
                  >
                    {selectedRequest.requester.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--primary)",
                      }}
                    >
                      {selectedRequest.requester.name}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>
                      {selectedRequest.requester.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
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
                  {selectedRequest.description || (
                    <span style={{ color: "var(--muted-light)", fontStyle: "italic" }}>
                      No description provided.
                    </span>
                  )}
                </p>
              </div>

              {selectedRequest.submittedAt && (
                <div style={{ marginBottom: 24 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 4,
                    }}
                  >
                    Submitted
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text)" }}>
                    {new Date(selectedRequest.submittedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Approval Stepper */}
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
                    marginBottom: 16,
                  }}
                >
                  Approval Workflow
                </p>

                {selectedRequest.approvals.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      fontStyle: "italic",
                    }}
                  >
                    No approval routing configured yet.
                  </p>
                ) : (
                  <div className="stepper">
                    {selectedRequest.approvals.map((app) => (
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
                              letterSpacing: "0.04em",
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
                        {app.decisionAt && (
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--muted-light)",
                              marginTop: 4,
                            }}
                          >
                            {new Date(app.decisionAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {["Draft", "Returned for Amendment"].includes(
              selectedRequest.status
            ) && (
              <div className="drawer-footer">
                <button
                  id="resubmit-btn"
                  onClick={() => handleResubmit(selectedRequest.id)}
                  disabled={isOffline || isPending}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  Submit Request →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
