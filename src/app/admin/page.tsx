import { prisma } from "@/lib/prisma";
import AdminClient from "@/components/AdminClient";
import { RoleCode } from "@/lib/service-request";

export const dynamic = "force-dynamic";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  roles: RoleCode[];
}

interface AdminAuditLog {
  id: string;
  actionType: string;
  createdAt: Date;
  details: unknown;
  actor: { name: string; email: string };
  request: { ticketNo: string } | null;
}

export default async function AdminPage() {
  let users: AdminUser[] = [];
  let logs: AdminAuditLog[] = [];
  let isOffline = false;

  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        department: true,
        roles: {
          include: { role: true },
          where: { isActive: true },
        },
      },
    });

    users = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      jobTitle: u.jobTitle,
      department: u.department,
      roles: u.roles.map((r) => r.role.code as RoleCode),
    }));

    const dbLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: { select: { name: true, email: true } },
        request: { select: { ticketNo: true } },
      },
    });

    logs = dbLogs as unknown as AdminAuditLog[];
  } catch (err) {
    console.error("Database connection failed in AdminPage:", err);
    isOffline = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          System Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--primary)]">
          Admin Workspace
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage user authorization roles and monitor audit log security records.
        </p>
      </section>

      <AdminClient users={users} logs={logs} isOffline={isOffline} />
    </main>
  );
}
