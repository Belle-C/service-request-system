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

export default function ConfigurationClient({ settings, configs, users, isOffline }: ConfigurationClientProps) {
  const router = useRouter();
  const { selectedRole } = useRole();
  const [isPending, startTransition] = useTransition();

  // Allowed React states
  const [selectedRow, setSelectedRow] = useState<string | null>(null); // "new" or a config id
  const [drawerOpen, setDrawerOpen] = useState(false);

  const subcategoryRef = useRef<HTMLInputElement>(null);
  const approver1Ref = useRef<HTMLSelectElement>(null);
  const approver2Ref = useRef<HTMLSelectElement>(null);
  const approver3Ref = useRef<HTMLSelectElement>(null);

  const setStatus = (type: "success" | "error" | "loading" | "idle", message: string, target: "global" | "config") => {
    const id = target === "global" ? "global-status-alert" : "config-status-alert";
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

  // 1. Save Global Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const descriptionRequired = formData.get("descriptionRequired") === "on";
    const attachmentRequired = formData.get("attachmentRequired") === "on";

    setStatus("loading", "Updating global settings...", "global");

    try {
      const res = await fetch("/api/sap-s4/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptionRequired, attachmentRequired }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setStatus("success", "Global settings updated successfully!", "global");
      
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => {
        setStatus("idle", "", "global");
      }, 1500);
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error saving settings", "global");
    }
  };

  // 2. Save Config (Create or Update)
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

    // Build levels array
    const levels = [{ levelNo: 1, approverId: app1 }];
    if (app2) levels.push({ levelNo: 2, approverId: app2 });
    if (app3) levels.push({ levelNo: 3, approverId: app3 });

    setStatus("loading", "Saving configuration...", "config");

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
      if (!res.ok) {
        throw new Error(data.error || "Failed to save configuration");
      }

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
      setStatus("error", err instanceof Error ? err.message : "Error saving config", "config");
    }
  };

  // 3. Delete Config
  const handleDeleteConfig = async (id: string) => {
    if (isOffline || !confirm("Are you sure you want to deactivate this configuration?")) return;

    try {
      const res = await fetch(`/api/sap-s4/config/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete config");
      }

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

  const activeConfig = selectedRow && selectedRow !== "new" ? configs.find((c) => c.id === selectedRow) : null;

  return (
    <div className="space-y-8">
      {selectedRole !== "FINANCE" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs">
          <p className="font-semibold">Simulated Role Warning</p>
          <p className="mt-1 text-xs">
            Configuration actions require the <strong>FINANCE</strong> role. Please select &quot;Finance Mode&quot; in the header to fully simulate settings modifications.
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
            Database connection is offline. Configuration edits are locked.
          </p>
        </div>
      )}

      {/* Global settings section */}
      <section className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-[var(--primary)] mb-2">Global Settings</h2>
        <p className="text-xs text-[var(--muted)] mb-5">Define document rules for all SAP S4 HANA submissions.</p>

        <div id="global-status-alert" className="hidden" />

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 text-sm font-medium text-[var(--text)] select-none">
              <input
                type="checkbox"
                name="descriptionRequired"
                defaultChecked={settings?.descriptionRequired}
                disabled={isOffline}
                className="size-4 rounded-sm border-[var(--border)] cursor-pointer"
              />
              <span>Force Description Requirement (re-submittal details required)</span>
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-[var(--text)] select-none">
              <input
                type="checkbox"
                name="attachmentRequired"
                defaultChecked={settings?.attachmentRequired}
                disabled={isOffline}
                className="size-4 rounded-sm border-[var(--border)] cursor-pointer"
              />
              <span>Force Attachment File Upload (supporting doc verified)</span>
            </label>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isOffline || isPending}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              Save Settings
            </button>
          </div>
        </form>
      </section>

      {/* Category workflows list */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--primary)]">Workflow Routes</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Map request subcategories to their corresponding manager levels.</p>
          </div>
          <button
            onClick={openNewConfig}
            disabled={isOffline}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            + Add Route
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-xs">
          <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-6 py-3.5">Subcategory</th>
                <th className="px-6 py-3.5">Workflow Routing Path</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {configs.filter((c) => c.isActive).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--muted)]">
                    No active routing workflows found.
                  </td>
                </tr>
              ) : (
                configs
                  .filter((c) => c.isActive)
                  .map((config) => {
                    const levels = config.approvalRoute?.levels || [];
                    const routeNames = levels
                      .map((lvl: { approverId: string }) => {
                        const u = users.find((usr) => usr.id === lvl.approverId);
                        return u ? u.name : "Unknown Approver";
                      })
                      .join(" ➔ ");

                    return (
                      <tr key={config.id} className="hover:bg-[var(--surface-muted)] transition">
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-[var(--primary)]">
                          {config.subcategory}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-[var(--text)]">
                          {routeNames || <span className="text-red-500 italic">No levels mapped</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openEditConfig(config)}
                            disabled={isOffline}
                            className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteConfig(config.id)}
                            disabled={isOffline}
                            className="text-xs font-semibold text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Routing Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-xs transition-opacity" onClick={closeDrawer} />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <form
              onSubmit={handleSaveConfig}
              className="w-screen max-w-md transform bg-white p-6 shadow-xl transition-all flex flex-col justify-between border-l border-[var(--border)]"
            >
              <div className="overflow-y-auto space-y-6 flex-1 pr-1">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-lg font-bold text-[var(--primary)]">
                    {selectedRow === "new" ? "Add New Category Route" : "Edit Category Route"}
                  </h3>
                  <button
                    onClick={closeDrawer}
                    type="button"
                    className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div id="config-status-alert" className="hidden" />

                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2" htmlFor="config-subcat">
                      Subcategory Name
                    </label>
                    <input
                      id="config-subcat"
                      ref={subcategoryRef}
                      type="text"
                      required
                      defaultValue={activeConfig?.subcategory || ""}
                      placeholder="e.g. Credit Note, Expense Refund"
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-hidden"
                    />
                  </div>

                  <div className="border-t border-[var(--border)] pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
                      Routing Path Levels
                    </h4>

                    {/* Level 1 */}
                    <div className="mb-4">
                      <label className="block text-[10px] font-semibold text-[var(--muted)] mb-1.5" htmlFor="lvl-1">
                        Level 1 Approver *
                      </label>
                      <select
                        id="lvl-1"
                        ref={approver1Ref}
                        required
                        defaultValue={activeConfig?.approvalRoute?.levels?.[0]?.approverId || ""}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] cursor-pointer"
                      >
                        <option value="">-- Choose Level 1 Approver --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level 2 */}
                    <div className="mb-4">
                      <label className="block text-[10px] font-semibold text-[var(--muted)] mb-1.5" htmlFor="lvl-2">
                        Level 2 Approver (Optional)
                      </label>
                      <select
                        id="lvl-2"
                        ref={approver2Ref}
                        defaultValue={activeConfig?.approvalRoute?.levels?.[1]?.approverId || ""}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] cursor-pointer"
                      >
                        <option value="">-- None --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level 3 */}
                    <div className="mb-4">
                      <label className="block text-[10px] font-semibold text-[var(--muted)] mb-1.5" htmlFor="lvl-3">
                        Level 3 Approver (Optional)
                      </label>
                      <select
                        id="lvl-3"
                        ref={approver3Ref}
                        defaultValue={activeConfig?.approvalRoute?.levels?.[2]?.approverId || ""}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] cursor-pointer"
                      >
                        <option value="">-- None --</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>
              </div>

              {/* Action buttons */}
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
                  Save Config
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
