import React from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RoleCode } from "@/lib/service-request";
import ApprovalInboxClient from "@/components/ApprovalInboxClient";

export const dynamic = "force-dynamic";

export default async function ApprovalInboxPage() {
  const cookieStore = await cookies();
  const selectedRole = (cookieStore.get("selectedRole")?.value || "REQUESTER") as RoleCode;

  const fallbackEmails: Record<RoleCode, string> = {
    REQUESTER: "belle.chong@cora-environment.com",
    FINANCE: "finance@cora-environment.com",
    APPROVER: "approver@cora-environment.com",
    IT: "it@cora-environment.com",
    ADMIN: "admin@cora-environment.com",
  };

  let approvals: React.ComponentProps<typeof ApprovalInboxClient>["approvals"] = [];
  let isOffline = false;

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        roles: {
          some: {
            role: { code: selectedRole },
            isActive: true,
          },
        },
      },
    });

    const email = dbUser?.email || fallbackEmails[selectedRole];

    const dbApprovals = await prisma.requestApproval.findMany({
      where: {
        approver: { email },
      },
      orderBy: { createdAt: "desc" },
      include: {
        request: {
          include: {
            requester: {
              select: { name: true, email: true },
            },
            approvals: {
              orderBy: { levelNo: "asc" },
              include: {
                approver: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    approvals = dbApprovals as unknown as React.ComponentProps<typeof ApprovalInboxClient>["approvals"];
  } catch (err) {
    console.error("Database connection failed in ApprovalInboxPage:", err);
    isOffline = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Actions Required
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--primary)]">
          Approval Inbox
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Evaluate, approve, reject, or return incoming finance and service requests.
        </p>
      </section>

      <ApprovalInboxClient approvals={approvals} isOffline={isOffline} />
    </main>
  );
}
