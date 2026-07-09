import { prisma } from "@/lib/prisma";
import { sapModuleCode } from "@/lib/service-request";
import { SummaryCard } from "@/components/SummaryCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let dashboardData = {
    total: 0,
    byStatus: {} as Record<string, number>,
    bySubcategory: {} as Record<string, number>,
  };
  let isOffline = false;

  try {
    const requests = await prisma.request.findMany({
      where: { moduleCode: sapModuleCode },
      select: { status: true, subcategory: true },
    });

    const byStatus = Object.groupBy(requests, (request) => request.status);
    const bySubcategory = Object.groupBy(requests, (request) => request.subcategory ?? "Uncategorised");

    dashboardData = {
      total: requests.length,
      byStatus: Object.fromEntries(Object.entries(byStatus).map(([key, value]) => [key, value?.length ?? 0])),
      bySubcategory: Object.fromEntries(
        Object.entries(bySubcategory).map(([key, value]) => [key, value?.length ?? 0]),
      ),
    };
  } catch (err) {
    console.error("Database connection failed in DashboardPage:", err);
    isOffline = true;
  }

  // Predefined list of standard statuses for consistent layout
  const allStatuses = ["Draft", "Pending Approval", "Returned for Amendment", "Rejected", "Approved"];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Operations Monitor
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--primary)]">
          Finance Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Visual metrics and ticket distributions for SAP S4 HANA service workflows.
        </p>
      </section>

      {isOffline ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-between p-3 text-amber-600 mb-4 font-bold text-lg justify-center">
            ⚠
          </div>
          <h3 className="text-md font-semibold text-amber-950">Analytics Offline</h3>
          <p className="mt-2 text-xs text-amber-800 max-w-sm mx-auto leading-relaxed">
            The database connection is unavailable, so we could not construct real-time finance request aggregates. Please check system configurations.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main counts */}
          <section className="grid gap-4 sm:grid-cols-4">
            <SummaryCard label="Total SAP Requests" value={String(dashboardData.total)} />
            <SummaryCard
              label="Pending Decision"
              value={String(dashboardData.byStatus["Pending Approval"] || 0)}
            />
            <SummaryCard
              label="Approved & Settled"
              value={String(dashboardData.byStatus["Approved"] || 0)}
            />
            <SummaryCard
              label="Returned / Rejected"
              value={String(
                (dashboardData.byStatus["Returned for Amendment"] || 0) +
                  (dashboardData.byStatus["Rejected"] || 0)
              )}
            />
          </section>

          {/* Detailed distribution charts */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Status distribution */}
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider border-b border-[var(--border)] pb-3">
                Ticket Distribution by Status
              </h3>
              <div className="mt-6 space-y-4">
                {allStatuses.map((status) => {
                  const count = dashboardData.byStatus[status] || 0;
                  const percent = dashboardData.total > 0 ? (count / dashboardData.total) * 100 : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[var(--text)]">
                        <span>{status}</span>
                        <span>
                          {count} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--primary)] h-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subcategory distribution */}
            <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-[var(--primary)] uppercase tracking-wider border-b border-[var(--border)] pb-3">
                Distribution by Category Type
              </h3>
              <div className="mt-6 space-y-4">
                {Object.keys(dashboardData.bySubcategory).length === 0 ? (
                  <p className="text-xs text-[var(--muted)] italic text-center py-10">No categories recorded yet.</p>
                ) : (
                  Object.entries(dashboardData.bySubcategory).map(([subcat, count]) => {
                    const percent = dashboardData.total > 0 ? (count / dashboardData.total) * 100 : 0;
                    return (
                      <div key={subcat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[var(--text)]">
                          <span>{subcat}</span>
                          <span>
                            {count} ({percent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--accent)] h-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
