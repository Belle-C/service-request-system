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

// Static metadata for the type cards
const typeCardMeta: Record<string, { icon: string; purpose: string; isSap?: boolean }> = {
  DIGITAL_SUPPORT: {
    icon: "🖥️",
    purpose: "IT helpdesk, device provisioning, and digital tooling issues.",
  },
  APP_ENHANCEMENT: {
    icon: "⚙️",
    purpose: "Request new features, integrations, or application improvements.",
  },
  OFFBOARDING: {
    icon: "👤",
    purpose: "End-to-end employee offboarding and access deprovisioning.",
  },
  SAP_S4: {
    icon: "📊",
    purpose: "Finance workflow submissions routed through SAP S4 HANA.",
    isSap: true,
  },
};

export default function NewRequestForm({
  configs,
  settings,
  isOffline,
}: NewRequestFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useRole();

  const activeType = searchParams.get("type") || "";

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subcategoryRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentUser) {
      if (nameRef.current) nameRef.current.value = currentUser.name || "";
      if (emailRef.current) emailRef.current.value = currentUser.email || "";
    }
  }, [currentUser]);

  const setStatus = (
    type: "idle" | "loading" | "success" | "error",
    message: string
  ) => {
    const el = document.getElementById("form-status-alert");
    if (!el) return;

    if (type === "idle") {
      el.className = "hidden";
      el.innerText = "";
    } else if (type === "loading") {
      el.className = "alert alert-loading";
      el.innerText = message;
    } else if (type === "success") {
      el.className = "alert alert-success";
      el.innerText = message;
    } else {
      el.className = "alert alert-error";
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

    setStatus("loading", "Saving draft…");

    try {
      const res = await fetch("/api/requests/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subcategory, description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft");

      setStatus("success", `Draft saved! Ticket: ${data.ticketNo}`);
      if (descriptionRef.current) descriptionRef.current.value = "";
    } catch (err) {
      setStatus(
        "error",
        err instanceof Error ? err.message : "Error saving draft"
      );
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

    setStatus("loading", "Creating request draft…");

    try {
      const draftRes = await fetch("/api/requests/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subcategory, description }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) {
        throw new Error(draftData.error || "Failed to create draft");
      }

      setStatus("loading", `Draft ${draftData.ticketNo} created. Submitting…`);

      const submitRes = await fetch(`/api/requests/${draftData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.error || "Failed to submit request");
      }

      setStatus(
        "success",
        `Request submitted! Ticket: ${submitData.ticketNo}`
      );
      setTimeout(() => {
        router.push("/my-requests");
      }, 1500);
    } catch (err) {
      setStatus(
        "error",
        err instanceof Error ? err.message : "Error submitting request"
      );
    }
  };

  const handleSelectType = (code: string) => {
    setStatus("idle", "");
    router.push(`/new-request?type=${code}`);
  };

  const isSapSelected = activeType === "SAP_S4";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Offline warning */}
      {isOffline && (
        <div className="offline-banner">
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
              Database Offline
            </p>
            <p style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              Form is in read-only offline mode. Submissions are currently
              disabled.
            </p>
          </div>
        </div>
      )}

      {/* Status alert */}
      <div id="form-status-alert" className="hidden" />

      {/* Step 1: Select Category */}
      <section>
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Step 1 — Select Request Category
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Click a card to choose your request type. Only SAP S4 HANA supports
            automated workflow submissions.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          }}
        >
          {requestTypes.map((type) => {
            const meta = typeCardMeta[type.code] || {
              icon: "📝",
              purpose: type.purpose,
            };
            const isSelected = activeType === type.code;
            const isSap = meta.isSap;

            return (
              <button
                key={type.code}
                id={`type-card-${type.code.toLowerCase()}`}
                onClick={() => handleSelectType(type.code)}
                className={`request-type-card ${isSap ? "is-sap" : ""} ${
                  isSelected ? "is-selected" : ""
                }`}
                type="button"
                style={{ textAlign: "left", width: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>
                    {meta.icon}
                  </span>
                  <span className="rtc-module-tag">{type.moduleCode}</span>
                </div>
                <div>
                  <p className="rtc-title">{type.label}</p>
                  <p className="rtc-purpose" style={{ marginTop: 6 }}>
                    {meta.purpose}
                  </p>
                </div>
                <p className="rtc-cta">
                  {isSelected ? "Selected ✓" : "Select →"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Form (only for SAP_S4) */}
      {activeType && !isSapSelected && (
        <div
          className="card"
          style={{
            padding: "40px 32px",
            textAlign: "center",
            borderStyle: "dashed",
          }}
        >
          <p style={{ fontSize: 28, marginBottom: 16 }}>🚧</p>
          <p
            style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)" }}
          >
            Form Not Yet Available
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginTop: 8,
              maxWidth: 380,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
            }}
          >
            The &ldquo;
            {requestTypes.find((t) => t.code === activeType)?.label}&rdquo; form
            is not yet configured for automated submissions. Please select{" "}
            <strong>SAP S4 HANA Request</strong> to submit a request.
          </p>
        </div>
      )}

      {isSapSelected && (
        <section>
          <div style={{ marginBottom: 16 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Step 2 — SAP S4 HANA Finance Request
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Complete the form below. Your submission will be routed through the
              configured approval workflow.
            </p>
          </div>

          <form
            id="sap-request-form"
            onSubmit={handleSubmit}
            className="card-elevated"
            style={{ padding: "28px 28px 24px" }}
          >
            {/* Requester Details */}
            <div
              style={{
                marginBottom: 24,
                paddingBottom: 24,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}
              >
                Requester Information
              </h3>
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <div>
                  <label className="field-label" htmlFor="req-name">
                    Full Name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    id="req-name"
                    ref={nameRef}
                    type="text"
                    disabled={isOffline}
                    required
                    placeholder="e.g. Belle Chong"
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="req-email">
                    Email Address <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    id="req-email"
                    ref={emailRef}
                    type="email"
                    disabled={isOffline}
                    required
                    placeholder="e.g. you@cora-environment.com"
                    className="field-input"
                  />
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Request Details
              </h3>

              <div>
                <label className="field-label" htmlFor="req-subcategory">
                  Subcategory <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  id="req-subcategory"
                  ref={subcategoryRef}
                  disabled={isOffline}
                  required
                  className="field-input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="">— Choose Subcategory —</option>
                  {configs.map((config) => (
                    <option key={config.id} value={config.subcategory}>
                      {config.subcategory}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="req-description">
                  Description{" "}
                  {settings?.descriptionRequired && (
                    <span style={{ color: "#dc2626" }}>*</span>
                  )}
                  {!settings?.descriptionRequired && (
                    <span
                      style={{
                        fontWeight: 400,
                        textTransform: "none",
                        fontSize: 11,
                        color: "var(--muted-light)",
                        marginLeft: 4,
                      }}
                    >
                      (optional)
                    </span>
                  )}
                </label>
                <textarea
                  id="req-description"
                  ref={descriptionRef}
                  rows={5}
                  disabled={isOffline}
                  required={settings?.descriptionRequired}
                  placeholder="Provide a detailed explanation of your request, including any supporting context or reference numbers…"
                  className="field-input"
                  style={{ resize: "vertical" }}
                />
              </div>

              {settings && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "12px 16px",
                    background: "var(--surface-raised)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}
                  >
                    Form rules:
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: settings.descriptionRequired
                        ? "var(--primary)"
                        : "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    Description {settings.descriptionRequired ? "required ✓" : "optional"}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: settings.attachmentRequired
                        ? "var(--primary)"
                        : "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    Attachment {settings.attachmentRequired ? "required ✓" : "optional"}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 28,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                type="button"
                id="save-draft-btn"
                onClick={handleSaveDraft}
                disabled={isOffline}
                className="btn btn-ghost"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                id="submit-request-btn"
                disabled={isOffline}
                className="btn btn-primary"
              >
                Submit Request →
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
