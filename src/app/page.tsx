"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRole } from "@/components/RoleContext";
import { SummaryCard } from "@/components/SummaryCard";

interface RequestType {
  code: string;
  label: string;
  moduleCode: string;
  formCode: string;
  purpose: string;
}

interface RequestItem {
  id: string;
  ticketNo: string;
  status: string;
  createdAt: string;
}

// Static enrichment for the 4 known request types
const typeEnrichment: Record<
  string,
  { icon: string; shortPurpose: string; isSap?: boolean }
> = {
  DIGITAL_SUPPORT: {
    icon: "🖥️",
    shortPurpose: "IT helpdesk, device provisioning, and digital tooling issues.",
  },
  APP_ENHANCEMENT: {
    icon: "⚙️",
    shortPurpose: "Request new features, integrations, or application improvements.",
  },
  OFFBOARDING: {
    icon: "👤",
    shortPurpose: "End-to-end employee offboarding and access deprovisioning.",
  },
  SAP_S4: {
    icon: "📊",
    shortPurpose: "Finance workflow submissions routed through SAP S4 HANA.",
    isSap: true,
  },
};

export default function Home() {
  const { currentUser, selectedRole } = useRole();
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [userRequests, setUserRequests] = useState<RequestItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchTypes = fetch("/api/request-types")
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRequestTypes(data.requestTypes || []);
      });

    const fetchRequests = currentUser?.email
      ? fetch(`/api/requests?email=${encodeURIComponent(currentUser.email)}`)
          .then((res) => {
            if (!res.ok) throw new Error("Offline");
            return res.json();
          })
          .then((data) => {
            if (!cancelled) setUserRequests(data.requests || []);
          })
      : Promise.resolve();

    Promise.all([fetchTypes, fetchRequests])
      .catch((err) => {
        console.error("API Error on Landing Page:", err);
        if (!cancelled) setIsOffline(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.email, selectedRole]);

  const totalRequests = userRequests.length;
  const pendingRequests = userRequests.filter((r) => r.status === "Pending Approval").length;
  const approvedRequests = userRequests.filter((r) => r.status === "Approved").length;

  return (
    <main className="page-container page-main">
      {isOffline && (
        <div className="offline-banner" style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
              Database / API Offline
            </p>
            <p style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              The database connection is currently unavailable. Showing offline fallback interface.
            </p>
          </div>
        </div>
      )}

      {/* Hero / Welcome Section */}
      <section style={{ marginBottom: 40 }}>
        <p className="page-eyebrow">Internal Service Portal</p>
        <h1 className="page-title">
          Welcome back,{" "}
          <span style={{ color: "var(--accent)" }}>
            {currentUser?.name?.split(" ")[0] || "User"}
          </span>
        </h1>
        <p className="page-subtitle">
          Submit new service requests, track ongoing approvals, and manage system
          configurations — all in one place.
        </p>
      </section>

      {/* Metrics Row */}
      <section className="grid-metrics-3" style={{ marginBottom: 48 }}>
        <SummaryCard
          label="My Total Requests"
          value={isLoading ? "—" : String(totalRequests)}
          accent="primary"
        />
        <SummaryCard
          label="Pending Approval"
          value={isLoading ? "—" : String(pendingRequests)}
          accent="blue"
        />
        <SummaryCard
          label="Approved"
          value={isLoading ? "—" : String(approvedRequests)}
          accent="green"
        />
      </section>

      {/* Request Type Cards */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--primary)",
                letterSpacing: "-0.015em",
              }}
            >
              Submit a New Request
            </h2>
            <p
              style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}
            >
              Choose a category to start your request workflow.
            </p>
          </div>
          <span
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--primary-light)",
              color: "var(--primary)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}
          >
            {selectedRole} mode
          </span>
        </div>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: 24,
                  height: 160,
                  background:
                    "linear-gradient(90deg, #f1f5f7 25%, #e8edf0 50%, #f1f5f7 75%)",
                  backgroundSize: "200% 100%",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : requestTypes.length === 0 ? (
          <div className="card empty-state">
            <p className="empty-state-icon">📋</p>
            <p className="empty-state-title">No Request Types Configured</p>
            <p className="empty-state-body">
              Please verify your backend configuration to see available request categories.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            }}
          >
            {requestTypes.map((type) => {
              const enrich = typeEnrichment[type.code] || {
                icon: "📝",
                shortPurpose: type.purpose,
              };
              const isSap = enrich.isSap;

              return (
                <Link
                  key={type.code}
                  href={`/new-request?type=${type.code}`}
                  className={`request-type-card ${isSap ? "is-sap" : ""}`}
                  id={`request-type-card-${type.code.toLowerCase()}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      {enrich.icon}
                    </span>
                    <span className="rtc-module-tag">{type.moduleCode}</span>
                  </div>

                  <div>
                    <p className="rtc-title">{type.label}</p>
                    <p className="rtc-purpose" style={{ marginTop: 6 }}>
                      {enrich.shortPurpose || type.purpose}
                    </p>
                  </div>

                  <p className="rtc-cta">
                    Start request <span>→</span>
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
