import React from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RoleCode } from "@/lib/service-request";
import MyRequestsClient from "@/components/MyRequestsClient";

export const dynamic = "force-dynamic";

export default async function MyRequestsPage() {
  const cookieStore = await cookies();
  const selectedRole = (cookieStore.get("selectedRole")?.value || "REQUESTER") as RoleCode;

  const fallbackEmails: Record<RoleCode, string> = {
    REQUESTER: "belle.chong@cora-environment.com",
    FINANCE: "finance@cora-environment.com",
    APPROVER: "approver@cora-environment.com",
    IT: "it@cora-environment.com",
    ADMIN: "admin@cora-environment.com",
  };

  let requests: React.ComponentProps<typeof MyRequestsClient>["requests"] = [];
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

    const dbRequests = await prisma.request.findMany({
      where: { requester: { email } },
      orderBy: { createdAt: "desc" },
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
    });

    requests = dbRequests as unknown as React.ComponentProps<
      typeof MyRequestsClient
    >["requests"];
  } catch (err) {
    console.error("Database connection failed in MyRequestsPage:", err);
    isOffline = true;
  }

  return (
    <main className="page-container page-main">
      <section style={{ marginBottom: 32 }}>
        <p className="page-eyebrow">History &amp; Tracking</p>
        <h1 className="page-title">My Service Requests</h1>
        <p className="page-subtitle">
          Track details, workflow progression, and status updates of your submissions.
        </p>
      </section>

      <MyRequestsClient requests={requests} isOffline={isOffline} />
    </main>
  );
}
