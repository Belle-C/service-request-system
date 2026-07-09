"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/RoleContext";

interface User {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  roles: string[];
}

interface SapConfig {
  id: string;
  subcategory: string;
  approvalRoute: { levels: { levelNo: number; approverId: string }[] };
  isActive: boolean;
}

interface SapSettings {
  descriptionRequired: boolean;
  attachmentRequired: boolean;
}

interface ConfigurationClientProps {
  settings: SapSettings | null;
  configs: SapConfig[];
  users: User[];
  isOffline: boolean;
}

export default function ConfigurationClient({
  settings,
  configs,
  users,
  isOffline,
}: ConfigurationClientProps) {
  const router = useRouter();
  const { selectedRole } = useRole();
  const [isPending, startTransition] = useTransition();

  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"global" | "workflows">(
    "global"
  );

  const subcategoryRef = useRef<HTMLInputElement>(null);
  const approver1Ref = useRef<HTMLSelectElement>(null);
  const approver2Ref = useRef<HTMLSelectElement>(null);
  const approver3Ref = useRef<HTMLSelectElement>(null);

  const setStatus = (
    type: "success" | "error" | "loading" | "idle",
    message: string,
    target: "global" | "config"
  ) => {
    const id = target === "global" ? "global-status-alert" : "config-status-alert";
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const descriptionRequired = formData.get("descriptionRequired") === "on";
    const attachmentRequired = formData.get("attachmentRequired") === "on";

    setStatus("loading", "Updating global settings…", "global");

    try {
      const res = await fetch("/api/sap-s4/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptionRequired, attachmentRequired }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setStatus("success", "Global settings updated successfully!", "global");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => setStatus("idle", "", "global"), 1500);
    } catch (err) {
      setStatus(
        "error",
        err instanceof Error ? err.message : "Error saving settings",
        "global"
      );
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    const subcategory = subcategoryRef.current?.value || "";
    const app1 = approver1Ref.current?.value || "";
    const app2 = approver2Ref.current?.value || "";
    const app3 = approver3Ref.current?.value || "";

    if (!subcategory.trim()) {
      setStatus("error", "Subcategory name is required.", "config");
      return;
    }
    if (!app1) {
      setStatus("error", "At least Level 1 Approver is required.", "config");
      return;
    }

    const levels = [{ levelNo: 1, approverId: app1 }];
    if (app2) levels.push({ levelNo: 2, approverId: app2 });
    if (app3) levels.push({ levelNo: 3, approverId: app3 });

    setStatus("loading", "Saving configuration…", "config");

    try {
      const isNew = selectedRow === "new";
      const url = isNew ? "/api/sap-s4/config" : `/api/sap-s4/config/${selectedRow}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategory,
          approvalRoute: { levels },
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration");

      setStatus("success", "Configuration saved successfully!", "config");
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        setStatus("idle", "", "config");
        setDrawerOpen(false);
        setSelectedRow(null);
      }, 1500);
    } catch (err) {
      setStatus(
        "error",
        err instanceof Error ? err.message : "Error saving config",
        "config"
      );
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (
      isOffline ||
      !confirm("Are you sure you want to deactivate this configuration?")
    )
      return;

    try {
      const res = await fetch(`/api/sap-s4/config/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete config");

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting config");
    }
  };

  const openNewConfig = () => {
    setSelectedRow("new");
    setDrawerOpen(true);
  };

  const openEditConfig = (config: SapConfig) => {
    setSelectedRow(config.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
  };

  const activeConfig =
    selectedRow && selectedRow !== "new"
      ? configs.find((c) => c.id === selectedRow)
      : null;

  const activeConfigs = configs.filter((c) => c.isActive);

  return (
    <div>
      {selectedRole !== "FINANCE" && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <strong>Role Warning:</strong> Configuration actions require the{" "}
          <strong>FINANCE</strong> role. Select &ldquo;Finance&rdquo; in the
          header to enable modifications.
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
              Database offline. Configuration edits are locked.
            </p>
          </div>
        </div>
      )}

      <div className="sidebar-layout">
        {/* Left rail */}
        <div>
          <nav className="sidebar-nav">
            <p className="sidebar-nav-label">Configuration</p>
            <button
              id="nav-global-settings"
              onClick={() => setActiveSection("global")}
              className={`sidebar-nav-btn ${
                activeSection === "global" ? "is-active" : ""
              }`}
            >
              <span>⚙️</span> Global Settings
            </button>
            <button
              id="nav-workflow-routes"
              onClick={() => setActiveSection("workflows")}
              className={`sidebar-nav-btn ${
                activeSection === "workflows" ? "is-active" : ""
              }`}
            >
              <span>🔀</span> Workflow Routes
              {activeConfigs.length > 0 && (
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
                  {activeConfigs.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content panel */}
        <div>
          {activeSection === "global" && (
            <div className="card-elevated" style={{ padding: 28 }}>
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 16,
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Global Settings
                </h2>
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  Define document rules applied to all SAP S4 HANA form submissions.
                </p>
              </div>

              <div id="global-status-alert" className="hidden" style={{ marginBottom: 16 }} />

              <form onSubmit={handleSaveSettings}>
                <div style={{ marginBottom: 24 }}>
                  <div className="toggle-row">
                    <input
                      type="checkbox"
                      name="descriptionRequired"
                      id="desc-required"
                      defaultChecked={settings?.descriptionRequired}
                      disabled={isOffline}
                    />
                    <div className="toggle-info">
                      <p className="toggle-title">Force Description Requirement</p>
                      <p className="toggle-desc">
                        Requires requesters to include a detailed description before
                        submission.
                      </p>
                    </div>
                  </div>
                  <div className="toggle-row">
                    <input
                      type="checkbox"
                      name="attachmentRequired"
                      id="attach-required"
                      defaultChecked={settings?.attachmentRequired}
                      disabled={isOffline}
                    />
                    <div className="toggle-info">
                      <p className="toggle-title">Force Attachment Upload</p>
                      <p className="toggle-desc">
                        Mandates upload of a supporting document with every request.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  id="save-settings-btn"
                  type="submit"
                  disabled={isOffline || isPending}
                  className="btn btn-primary"
                >
                  Save Settings
                </button>
              </form>
            </div>
          )}

          {activeSection === "workflows" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
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
                    Workflow Routes
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                    Map subcategories to approval levels and approver routing.
                  </p>
                </div>
                <button
                  id="add-route-btn"
                  onClick={openNewConfig}
                  disabled={isOffline}
                  className="btn btn-primary btn-sm"
                >
                  + Add Route
                </button>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subcategory</th>
                        <th>Routing Path</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeConfigs.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <div className="empty-state">
                              <p className="empty-state-icon">🔀</p>
                              <p className="empty-state-title">No routes configured</p>
                              <p className="empty-state-body">
                                Add a workflow route to configure approval levels for a
                                request subcategory.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        activeConfigs.map((config) => {
                          const levels = config.approvalRoute?.levels || [];
                          const routeNames = levels
                            .map((lvl: { approverId: string }) => {
                              const u = users.find((usr) => usr.id === lvl.approverId);
                              return u ? u.name : "Unknown";
                            })
                            .join(" → ");

                          return (
                            <tr key={config.id}>
                              <td>
                                <span
                                  style={{ fontWeight: 700, color: "var(--primary)" }}
                                >
                                  {config.subcategory}
                                </span>
                              </td>
                              <td style={{ fontSize: 12, color: "var(--text)" }}>
                                {routeNames || (
                                  <span
                                    style={{ color: "#dc2626", fontStyle: "italic" }}
                                  >
                                    No levels mapped
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "3px 10px",
                                    borderRadius: 9999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: "var(--accent-light)",
                                    color: "#15803d",
                                  }}
                                >
                                  Active
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    id={`edit-route-${config.id}`}
                                    onClick={() => openEditConfig(config)}
                                    disabled={isOffline}
                                    className="btn btn-ghost btn-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    id={`delete-route-${config.id}`}
                                    onClick={() => handleDeleteConfig(config.id)}
                                    disabled={isOffline}
                                    className="btn btn-sm"
                                    style={{
                                      background: "#fef2f2",
                                      color: "#dc2626",
                                      border: "1px solid #fecaca",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <form
            onSubmit={handleSaveConfig}
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
                  {selectedRow === "new" ? "New Route" : "Edit Route"}
                </span>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--primary)",
                    marginTop: 2,
                  }}
                >
                  {selectedRow === "new"
                    ? "Add Category Route"
                    : activeConfig?.subcategory}
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                type="button"
                className="drawer-close-btn"
                id="config-drawer-close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div
                id="config-status-alert"
                className="hidden"
                style={{ marginBottom: 16 }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label className="field-label" htmlFor="config-subcat">
                    Subcategory Name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    id="config-subcat"
                    ref={subcategoryRef}
                    type="text"
                    required
                    defaultValue={activeConfig?.subcategory || ""}
                    placeholder="e.g. Credit Note, Expense Refund"
                    className="field-input"
                  />
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 20,
                  }}
                >
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
                    Approval Routing Path
                  </h4>

                  {[
                    {
                      ref: approver1Ref,
                      label: "Level 1 Approver",
                      id: "lvl-1",
                      required: true,
                      defaultVal: activeConfig?.approvalRoute?.levels?.[0]?.approverId || "",
                    },
                    {
                      ref: approver2Ref,
                      label: "Level 2 Approver",
                      id: "lvl-2",
                      required: false,
                      defaultVal: activeConfig?.approvalRoute?.levels?.[1]?.approverId || "",
                    },
                    {
                      ref: approver3Ref,
                      label: "Level 3 Approver",
                      id: "lvl-3",
                      required: false,
                      defaultVal: activeConfig?.approvalRoute?.levels?.[2]?.approverId || "",
                    },
                  ].map(({ ref, label, id, required, defaultVal }, idx) => (
                    <div key={id} style={{ marginBottom: 16 }}>
                      <label className="field-label" htmlFor={id}>
                        {label}{" "}
                        {required ? (
                          <span style={{ color: "#dc2626" }}>*</span>
                        ) : (
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: 11,
                              textTransform: "none",
                              color: "var(--muted-light)",
                            }}
                          >
                            (optional)
                          </span>
                        )}
                      </label>
                      <select
                        id={id}
                        ref={ref}
                        required={required}
                        defaultValue={defaultVal}
                        className="field-input"
                        style={{ cursor: "pointer" }}
                      >
                        <option value="">
                          {idx === 0 ? "— Choose Approver —" : "— None —"}
                        </option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
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
                id="save-config-btn"
                disabled={isPending}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Save Config
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
