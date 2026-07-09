"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useRole } from "@/components/RoleContext";
import { requestTypes } from "@/lib/service-request";

interface SapConfig {
  id: string;
  subcategory: string;
  isActive: boolean;
}

interface SapSettings {
  descriptionRequired: boolean;
  attachmentRequired: boolean;
}

interface NewRequestFormProps {
  configs: SapConfig[];
  settings: SapSettings | null;
  isOffline: boolean;
}

export default function NewRequestForm({ configs, settings, isOffline }: NewRequestFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useRole();

  const activeType = searchParams.get("type") || "SAP_S4";

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subcategoryRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Sync current simulated user into the form fields
  useEffect(() => {
    if (currentUser) {
      if (nameRef.current) nameRef.current.value = currentUser.name || "";
      if (emailRef.current) emailRef.current.value = currentUser.email || "";
    }
  }, [currentUser]);

  const setStatus = (type: "idle" | "loading" | "success" | "error", message: string) => {
    const el = document.getElementById("form-status-alert");
    if (!el) return;

    if (type === "idle") {
      el.className = "hidden";
      el.innerText = "";
    } else if (type === "loading") {
      el.className = "mb-6 rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700 font-medium animate-pulse";
      el.innerText = message;
    } else if (type === "success") {
      el.className = "mb-6 rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700 font-medium";
      el.innerText = message;
    } else if (type === "error") {
      el.className = "mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium";
      el.innerText = message;
    }
  };

  const handleSaveDraft = async () => {
    if (isOffline) {
      setStatus("error", "Database is offline. Drafts cannot be saved.");
      return;
    }

    const name = nameRef.current?.value || "";
    const email = emailRef.current?.value || "";
    const subcategory = subcategoryRef.current?.value || "";
    const description = descriptionRef.current?.value || "";

    if (!name || !email) {
      setStatus("error", "Name and Email are required to save a draft.");
      return;
    }

    setStatus("loading", "Saving draft...");

    try {
      const res = await fetch("/api/requests/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subcategory, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save draft");
      }

      setStatus("success", `Draft saved successfully! Ticket: ${data.ticketNo}`);
      // Clear form except name/email
      if (descriptionRef.current) descriptionRef.current.value = "";
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error saving draft");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isOffline) {
      setStatus("error", "Database is offline. Requests cannot be submitted.");
      return;
    }

    const name = nameRef.current?.value || "";
    const email = emailRef.current?.value || "";
    const subcategory = subcategoryRef.current?.value || "";
    const description = descriptionRef.current?.value || "";

    if (!name || !email || !subcategory) {
      setStatus("error", "Name, Email, and Subcategory are required to submit.");
      return;
    }

    if (settings?.descriptionRequired && !description) {
      setStatus("error", "Description is required for this request form.");
      return;
    }

    setStatus("loading", "Initiating submission (creating draft first)...");

    try {
      // 1. Create Draft
      const draftRes = await fetch("/api/requests/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subcategory, description }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) {
        throw new Error(draftData.error || "Failed to create draft for submission");
      }

      // 2. Submit Draft
      setStatus("loading", `Draft created (${draftData.ticketNo}). Submitting request...`);

      const submitRes = await fetch(`/api/requests/${draftData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.error || "Failed to submit request");
      }

      setStatus("success", `Request submitted successfully! Ticket: ${submitData.ticketNo}`);
      
      // Redirect after success
      setTimeout(() => {
        router.push("/my-requests");
      }, 1500);
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error submitting request");
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus("idle", "");
    const value = e.target.value;
    router.push(`/new-request?type=${value}`);
  };

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
            Database Offline
          </p>
          <p className="mt-1 text-xs">
            Form is in read-only offline mode because the database connection is currently down.
          </p>
        </div>
      )}

      {/* Status messages display here */}
      <div id="form-status-alert" className="hidden" />

      {/* Category selector card */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-[var(--primary)] mb-4">Request Category</h2>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]" htmlFor="category-select">
            Select Form Category
          </label>
          <select
            id="category-select"
            value={activeType}
            onChange={handleCategoryChange}
            className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--primary)] focus:border-[var(--primary)] focus:outline-hidden cursor-pointer"
          >
            {requestTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.label} ({type.moduleCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Area */}
      {activeType === "SAP_S4" ? (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-lg font-semibold text-[var(--primary)]">SAP S4 HANA Finance Form</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Please provide request details for finance routing.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]" htmlFor="req-name">
                Requester Name
              </label>
              <input
                id="req-name"
                ref={nameRef}
                type="text"
                disabled={isOffline}
                required
                className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-hidden disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]" htmlFor="req-email">
                Requester Email
              </label>
              <input
                id="req-email"
                ref={emailRef}
                type="email"
                disabled={isOffline}
                required
                className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-hidden disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]" htmlFor="req-subcategory">
              Subcategory
            </label>
            <select
              id="req-subcategory"
              ref={subcategoryRef}
              disabled={isOffline}
              required
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-hidden disabled:opacity-60 cursor-pointer"
            >
              <option value="">-- Choose Subcategory --</option>
              {configs.map((config) => (
                <option key={config.id} value={config.subcategory}>
                  {config.subcategory}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]" htmlFor="req-description">
              Description {settings?.descriptionRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="req-description"
              ref={descriptionRef}
              rows={4}
              disabled={isOffline}
              required={settings?.descriptionRequired}
              placeholder="Provide a detailed explanation of your request..."
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-hidden disabled:opacity-60"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isOffline}
              className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--surface-muted)] transition cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isOffline}
              className="rounded-md bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              Submit Request
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center shadow-xs">
          <p className="text-sm font-semibold text-[var(--primary)]">Form Not Configured</p>
          <p className="mt-2 text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
            The category &quot;{requestTypes.find((t) => t.code === activeType)?.label}&quot; is currently not supported for automated workflow submissions. Please select &quot;SAP S4 HANA Request&quot; to test form submissions.
          </p>
        </div>
      )}
    </div>
  );
}
