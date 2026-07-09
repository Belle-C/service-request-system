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

export default function AdminClient({ users, logs, isOffline }: AdminClientProps) {
  const router = useRouter();
  const { selectedRole } = useRole();
  const [isPending, startTransition] = useTransition();

  // Allowed React states
  const [tab, setTab] = useState<"users" | "logs">("users");
  const [selectedRow, setSelectedRow] = useState<string | null>(null); // selected userId for role editing
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setDrawerAlert = (type: "success" | "error" | "loading" | "idle", message: string) => {
    const el = document.getElementById("admin-drawer-alert");
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

  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow || isOffline) return;

    // Get checked roles from DOM
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const checkedRoles = formData.getAll("roles") as RoleCode[];

    setDrawerAlert("loading", "Updating user roles...");

    try {
      const res = await fetch(`/api/users/${selectedRow}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: checkedRoles }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update roles");
      }

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
      setDrawerAlert("error", err instanceof Error ? err.message : "Error updating roles");
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

  return (
    <div className="space-y-6">
      {selectedRole !== "ADMIN" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs mb-4">
          <p className="font-semibold">Simulated Role Warning</p>
          <p className="mt-1 text-xs">
            Admin console operations require the <strong>ADMIN</strong> role. Please select &quot;Admin Mode&quot; in the header to fully simulate portal controls.
          </p>
        </div>
      )}

      {isOffline && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
            Offline Mode
          </p>
          <p className="mt-1 text-xs">
            Viewing cached local interface. Database mutations and audit lists are locked.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        
        {/* Left Side Menu */}
        <aside className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-xs h-fit space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] px-3 mb-2">
            Admin Navigation
          </p>
          <button
            onClick={() => setTab("users")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md transition ${
              tab === "users"
                ? "bg-[var(--surface-muted)] text-[var(--primary)] font-bold"
                : "text-[var(--muted)] hover:text-[var(--primary)]"
            }`}
          >
            User & Role Management
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md transition ${
              tab === "logs"
                ? "bg-[var(--surface-muted)] text-[var(--primary)] font-bold"
                : "text-[var(--muted)] hover:text-[var(--primary)]"
            }`}
          >
            Audit Logs Monitor
          </button>
        </aside>

        {/* Right Content Panel */}
        <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs min-h-[400px]">
          
          {tab === "users" ? (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--primary)]">User & Role Management</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Assign access privileges across service modules.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)] text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] font-semibold text-[var(--muted)] uppercase">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Job Details</th>
                      <th className="px-4 py-3">Active Roles</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white text-[var(--text)]">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">No users found.</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--surface-muted)] transition">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold">{u.name}</div>
                            <div className="text-[10px] text-[var(--muted)]">{u.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-[10px]">
                            <div>{u.jobTitle || "N/A"}</div>
                            <div className="text-[var(--muted)]">{u.department || ""}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r) => (
                                <span
                                  key={r}
                                  className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-[var(--surface-muted)] text-[var(--primary)] border border-[var(--border)]"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => openEditRoles(u.id)}
                              disabled={isOffline}
                              className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer disabled:opacity-50"
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
          ) : (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--primary)]">Audit Logs Monitor</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Real-time recording of request modifications and approval routes.</p>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="min-w-full divide-y divide-[var(--border)] text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] font-semibold text-[var(--muted)] uppercase">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white text-[var(--text)]">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted)]">No audit logs found.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--surface-muted)] transition">
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-[var(--muted)]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{log.actor.name}</div>
                            <div className="text-[9px] text-[var(--muted)]">{log.actor.email}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--primary)]">{log.actionType}</td>
                          <td className="px-4 py-3 font-semibold text-[var(--primary)]">
                            {log.request?.ticketNo || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-[10px] text-[var(--muted)] max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>
      </div>

      {/* Role Edit Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-xs transition-opacity" onClick={closeDrawer} />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <form
              onSubmit={handleUpdateRoles}
              className="w-screen max-w-md transform bg-white p-6 shadow-xl transition-all flex flex-col justify-between border-l border-[var(--border)]"
            >
              <div className="overflow-y-auto space-y-6 flex-1 pr-1">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)]">
                      Privilege Console
                    </span>
                    <h3 className="text-lg font-bold text-[var(--primary)] mt-0.5">
                      Edit Roles: {selectedUser.name}
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

                <div id="admin-drawer-alert" className="hidden" />

                <div className="space-y-4">
                  <div className="rounded-lg bg-[var(--surface-muted)] p-4 border border-[var(--border)]">
                    <p className="text-xs font-semibold text-[var(--primary)]">{selectedUser.jobTitle || "Job Title N/A"}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{selectedUser.email}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
                      Select Permitted System Roles
                    </h4>
                    <div className="flex flex-col gap-3">
                      {roleCodes.map((code) => {
                        const hasRole = selectedUser.roles.includes(code);
                        return (
                          <label key={code} className="flex items-center gap-3 text-sm font-medium text-[var(--text)] select-none cursor-pointer">
                            <input
                              type="checkbox"
                              name="roles"
                              value={code}
                              defaultChecked={hasRole}
                              className="size-4 rounded-sm border-[var(--border)] cursor-pointer"
                            />
                            <span>{code} Mode</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4 mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="flex-1 rounded-md border border-[var(--border)] bg-white py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-md bg-[var(--primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition cursor-pointer"
                >
                  Save Roles
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
