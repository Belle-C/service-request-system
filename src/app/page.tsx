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

export default function Home() {
  const { currentUser, selectedRole } = useRole();
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [userRequests, setUserRequests] = useState<RequestItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsLoading(true);
      setIsOffline(false);
    });

    // Fetch request types
    const fetchTypes = fetch("/api/request-types")
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((data) => {
        setRequestTypes(data.requestTypes || []);
      });

    // Fetch user requests if email is simulated
    const fetchRequests = currentUser?.email
      ? fetch(`/api/requests?email=${encodeURIComponent(currentUser.email)}`)
          .then((res) => {
            if (!res.ok) throw new Error("Offline");
            return res.json();
          })
          .then((data) => {
            setUserRequests(data.requests || []);
          })
      : Promise.resolve();

    Promise.all([fetchTypes, fetchRequests])
      .catch((err) => {
        console.error("API Error on Landing Page:", err);
        setIsOffline(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser?.email, selectedRole]);

  const totalRequests = userRequests.length;
  const pendingRequests = userRequests.filter((r) => r.status === "Pending Approval").length;
  const approvedRequests = userRequests.filter((r) => r.status === "Approved").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {isOffline && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-xs">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
            Database / API Offline
          </p>
          <p className="mt-1 text-xs">
            The database connection is currently unavailable. Showing mock/offline fallback interface.
          </p>
        </div>
      )}

      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Internal Service Requests
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--primary)]">
          Welcome, {currentUser?.name || "User"}
        </h1>
        <p className="mt-3 max-w-2xl text-md text-[var(--muted)]">
          Submit new SAP S4 HANA or IT requests, track ongoing approvals, and manage system configurations.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="My Total Requests" value={isLoading ? "..." : String(totalRequests)} />
        <SummaryCard label="Pending Approval" value={isLoading ? "..." : String(pendingRequests)} />
        <SummaryCard label="Approved Requests" value={isLoading ? "..." : String(approvedRequests)} />
      </section>

      <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--primary)]">Submit a New Service Request</h2>
            <p className="text-sm text-[var(--muted)]">Select a category below to initiate a request</p>
          </div>
          <span className="rounded-full bg-[var(--surface-muted)] border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
            Active Mode: {selectedRole}
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-[var(--muted)]">Loading request types...</div>
        ) : requestTypes.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--muted)]">
            No request types loaded. Please verify your backend configuration.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {requestTypes.map((type) => (
              <Link
                key={type.code}
                href={`/new-request?type=${type.code}`}
                className="group relative flex flex-col justify-between rounded-lg border border-[var(--border)] bg-white p-5 transition-all hover:border-[var(--primary)] hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[var(--primary)] group-hover:underline">
                      {type.label}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-[var(--surface-muted)] text-[var(--primary)]">
                      {type.moduleCode}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                    {type.purpose}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Start Request &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
