"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/RoleContext";
import { RoleCode, roleCodes } from "@/lib/service-request";

interface User {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  department?: string | null;
  roles: RoleCode[];
}

interface AuditLog {
  id: string;
  actionType: string;
  createdAt: Date;
  details: unknown;
  actor: { name: string; email: string };
  request?: { ticketNo: string } | null;
}

interface AdminClientProps {
  users: User[];
  logs: AuditLog[];
  isOffline: boolean;
}

const roleColorMap: Record<string, string> = {
  REQUESTER: "#e6f2f3",
  FINANCE: "#edfae9",
  APPROVER: "#e6f3fb",
  APPROVER_L2: "#f0edf9",
  IT: "#fffbeb",
  ADMIN: "#fef2f2",
};

const roleTextMap: Record<string, string> = {
  REQUESTER: "#003138",
  FINANCE: "#15803d",
  APPROVER: "#0077bf",
  APPROVER_L2: "#7561c8",
  IT: "#b45309",
  ADMIN: "#dc2626",
};

export default function AdminClient({ users, logs, isOffline }: AdminClientProps) {
  const router = useRouter();
  const { selectedRole } = useRole();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<"users" | "logs">("users");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  const setDrawerAlert = (
    type: "success" | "error" | "loading" | "idle",
    message: string
  ) => {
    const el = document.getElementById("admin-drawer-alert");
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

  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow || isOffline) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const checkedRoles = formData.getAll("roles") as RoleCode[];

    setDrawerAlert("loading", "Updating user roles…");

    try {
      const res = await fetch(`/api/users/${selectedRow}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: checkedRoles }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update roles");

      setDrawerAlert("success", "Roles updated successfully!");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        setDrawerAlert("idle", "");
        setDrawerOpen(false);
        setSelectedRow(null);
      }, 1200);
    } catch (err) {
      setDrawerAlert(
        "error",
        err instanceof Error ? err.message : "Error updating roles"
      );
    }
  };

  const openEditRoles = (userId: string) => {
    setSelectedRow(userId);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
  };

  const selectedUser = users.find((u) => u.id === selectedRow);

  const filteredLogs = logSearch.trim()
    ? logs.filter(
        (l) =>
          l.actionType.toLowerCase().includes(logSearch.toLowerCase()) ||
          l.actor.name.toLowerCase().includes(logSearch.toLowerCase()) ||
          (l.request?.ticketNo || "").toLowerCase().includes(logSearch.toLowerCase())
      )
    : logs;

  return (
    <div>
      {selectedRole !== "ADMIN" && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <strong>Role Warning:</strong> Admin operations require the{" "}
          <strong>ADMIN</strong> role. Select &ldquo;Admin&rdquo; in the header
          to enable portal controls.
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
              Viewing cached interface. Database mutations are locked.
            </p>
          </div>
        </div>
      )}

      <div className="sidebar-layout">
        {/* Left rail */}
        <div>
          <nav className="sidebar-nav">
            <p className="sidebar-nav-label">Admin</p>
            <button
              id="nav-users"
              onClick={() => setTab("users")}
              className={`sidebar-nav-btn ${tab === "users" ? "is-active" : ""}`}
            >
              <span>👥</span> Users &amp; Roles
              {users.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 700,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    borderRadius: 9999,
                    padding: "1px 6px",
                  }}
                >
                  {users.length}
                </span>
              )}
            </button>
            <button
              id="nav-audit-logs"
              onClick={() => setTab("logs")}
              className={`sidebar-nav-btn ${tab === "logs" ? "is-active" : ""}`}
            >
              <span>📋</span> Audit Logs
              {logs.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 700,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    borderRadius: 9999,
                    padding: "1px 6px",
                  }}
                >
                  {logs.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content panel */}
        <div>
          {tab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    User &amp; Role Management
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                    Assign access privileges across service modules.
                  </p>
                </div>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Job Details</th>
                        <th>Active Roles</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <div className="empty-state">
                              <p className="empty-state-icon">👥</p>
                              <p className="empty-state-title">No users found</p>
                              <p className="empty-state-body">
                                No users are available in the database.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
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
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p
                                    style={{ fontWeight: 600, color: "var(--text)" }}
                                  >
                                    {u.name}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: "var(--muted)",
                                    }}
                                  >
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <p style={{ fontSize: 12, color: "var(--text)" }}>
                                {u.jobTitle || "—"}
                              </p>
                              {u.department && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "var(--muted)",
                                    marginTop: 2,
                                  }}
                                >
                                  {u.department}
                                </p>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {u.roles.map((r) => (
                                  <span
                                    key={r}
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: "var(--radius-sm)",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.04em",
                                      textTransform: "uppercase",
                                      background: roleColorMap[r] || "var(--primary-light)",
                                      color: roleTextMap[r] || "var(--primary)",
                                    }}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                id={`edit-roles-${u.id}`}
                                onClick={() => openEditRoles(u.id)}
                                disabled={isOffline}
                                className="btn btn-ghost btn-sm"
                              >
                                Edit Roles
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Audit Logs Monitor
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                    Security trail of all request modifications and approval decisions.
                  </p>
                </div>
                <div className="search-input-wrap">
                  <input
                    type="text"
                    placeholder="Search logs…"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    id="audit-log-search"
                    className="field-input"
                    style={{ paddingLeft: 36, minWidth: 200 }}
                  />
                </div>
              </div>

              <div
                className="card"
                style={{ overflow: "hidden", maxHeight: 540 }}
              >
                <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 540 }}>
                  <table className="data-table">
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        background: "var(--surface-raised)",
                      }}
                    >
                      <tr>
                        <th>Timestamp</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Ticket</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            <div className="empty-state">
                              <p className="empty-state-icon">📋</p>
                              <p className="empty-state-title">No audit logs</p>
                              <p className="empty-state-body">
                                {isOffline
                                  ? "Audit logs unavailable while offline."
                                  : "No audit log records found."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id}>
                            <td style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td>
                              <p style={{ fontWeight: 600, fontSize: 12 }}>
                                {log.actor.name}
                              </p>
                              <p style={{ fontSize: 11, color: "var(--muted)" }}>
                                {log.actor.email}
                              </p>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--primary)",
                                  background: "var(--primary-light)",
                                  padding: "2px 8px",
                                  borderRadius: "var(--radius-sm)",
                                }}
                              >
                                {log.actionType}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: "var(--primary)", fontSize: 12 }}>
                              {log.request?.ticketNo || (
                                <span style={{ color: "var(--muted-light)" }}>—</span>
                              )}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {JSON.stringify(log.details)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Edit Drawer */}
      {drawerOpen && selectedUser && (
        <div>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <form
            onSubmit={handleUpdateRoles}
            className="drawer-panel animate-fade-in"
          >
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
                  Privilege Console
                </span>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--primary)",
                    marginTop: 2,
                  }}
                >
                  {selectedUser.name}
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                type="button"
                className="drawer-close-btn"
                id="admin-drawer-close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div id="admin-drawer-alert" className="hidden" style={{ marginBottom: 16 }} />

              {/* User info card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--primary)",
                    flexShrink: 0,
                  }}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>
                    {selectedUser.jobTitle || "No job title"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: 16,
                  }}
                >
                  Permitted System Roles
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {roleCodes.map((code) => {
                    const hasRole = selectedUser.roles.includes(code);
                    return (
                      <label
                        key={code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: hasRole ? "var(--primary-light)" : "var(--surface)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          name="roles"
                          value={code}
                          defaultChecked={hasRole}
                          id={`role-check-${code}`}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {code}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: "var(--muted)",
                              marginLeft: 6,
                            }}
                          >
                            mode
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={closeDrawer}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-roles-btn"
                disabled={isPending}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Save Roles
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
