import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { SummaryCard } from "@/components/SummaryCard";
import { requestTypes } from "@/lib/service-request";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Service Request System
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-[var(--primary)]">
          Service Request Portal
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">
          Track requests, approvals, and configuration from one internal portal.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="My Requests" value="0" />
        <SummaryCard label="Pending Approval" value="0" />
        <SummaryCard label="Approved" value="0" />
      </section>

      <section className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">New Request</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose a request type to start.
            </p>
          </div>
          <StatusBadge status="MVP" />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {requestTypes.map((type) => (
            <Link
              className="rounded-md border border-[var(--border)] bg-white p-4 transition hover:border-[var(--primary)]"
              href="/new-request"
              key={type.code}
            >
              <span className="font-medium">{type.label}</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">{type.purpose}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
