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
    const bySubcategory = Object.groupBy(
      requests,
      (request) => request.subcategory ?? "Uncategorised"
    );

    dashboardData = {
      total: requests.length,
      byStatus: Object.fromEntries(
        Object.entries(byStatus).map(([key, value]) => [key, value?.length ?? 0])
      ),
      bySubcategory: Object.fromEntries(
        Object.entries(bySubcategory).map(([key, value]) => [key, value?.length ?? 0])
      ),
    };
  } catch (err) {
    console.error("Database connection failed in DashboardPage:", err);
    isOffline = true;
  }

  const allStatuses = [
    "Draft",
    "Pending Approval",
    "Returned for Amendment",
    "Rejected",
    "Approved",
  ];

  const statusColors: Record<string, string> = {
    "Draft": "#9ca3af",
    "Pending Approval": "#0077bf",
    "Returned for Amendment": "#f59e0b",
    "Rejected": "#ef4444",
    "Approved": "#6fd85d",
  };

  return (
    <main className="page-container page-main">
      <section style={{ marginBottom: 36 }}>
        <p className="page-eyebrow">Operations Monitor</p>
        <h1 className="page-title">Finance Dashboard</h1>
        <p className="page-subtitle">
          Real-time metrics and ticket distributions for SAP S4 HANA service
          workflows.
        </p>
      </section>

      {isOffline ? (
        <div
          className="card"
          style={{ padding: "60px 32px", textAlign: "center" }}
        >
          <p style={{ fontSize: 40, marginBottom: 16 }}>⚡</p>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--primary)",
              marginBottom: 8,
            }}
          >
            Analytics Offline
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "var(--muted)",
              maxWidth: 380,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            The database connection is unavailable. Real-time finance request
            aggregates cannot be loaded. Please check system configuration.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Summary metrics */}
          <section className="grid-metrics-4">
            <SummaryCard
              label="Total SAP Requests"
              value={String(dashboardData.total)}
              accent="primary"
            />
            <SummaryCard
              label="Pending Decision"
              value={String(dashboardData.byStatus["Pending Approval"] || 0)}
              accent="blue"
            />
            <SummaryCard
              label="Approved & Settled"
              value={String(dashboardData.byStatus["Approved"] || 0)}
              accent="green"
            />
            <SummaryCard
              label="Returned / Rejected"
              value={String(
                (dashboardData.byStatus["Returned for Amendment"] || 0) +
                  (dashboardData.byStatus["Rejected"] || 0)
              )}
              accent="purple"
            />
          </section>

          {/* Charts area */}
          <div
            style={{
              display: "grid",
              gap: 24,
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            }}
          >
            {/* Status Distribution */}
            <div className="card-elevated" style={{ padding: 24 }}>
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 14,
                  marginBottom: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Distribution by Status
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  SAP S4 HANA request pipeline overview
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {allStatuses.map((status) => {
                  const count = dashboardData.byStatus[status] || 0;
                  const percent =
                    dashboardData.total > 0
                      ? (count / dashboardData.total) * 100
                      : 0;
                  const color = statusColors[status] || "var(--primary)";
                  return (
                    <div key={status}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--text)",
                            }}
                          >
                            {status}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--primary)",
                          }}
                        >
                          {count}{" "}
                          <span
                            style={{ color: "var(--muted)", fontWeight: 400 }}
                          >
                            ({percent.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percent}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subcategory Distribution */}
            <div className="card-elevated" style={{ padding: 24 }}>
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 14,
                  marginBottom: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Distribution by Category
                </h3>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Volume breakdown across request subcategories
                </p>
              </div>
              {Object.keys(dashboardData.bySubcategory).length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-icon">📊</p>
                  <p className="empty-state-title">No data yet</p>
                  <p className="empty-state-body">
                    Category distribution will appear once requests are submitted.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {Object.entries(dashboardData.bySubcategory).map(
                    ([subcat, count], idx) => {
                      const percent =
                        dashboardData.total > 0
                          ? (count / dashboardData.total) * 100
                          : 0;
                      // Cycle through accent colors
                      const colors = [
                        "var(--accent)",
                        "var(--info)",
                        "var(--purple)",
                        "var(--primary)",
                      ];
                      const color = colors[idx % colors.length];
                      return (
                        <div key={subcat}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 2,
                                  background: color,
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--text)",
                                }}
                              >
                                {subcat}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--primary)",
                              }}
                            >
                              {count}{" "}
                              <span
                                style={{
                                  color: "var(--muted)",
                                  fontWeight: 400,
                                }}
                              >
                                ({percent.toFixed(0)}%)
                              </span>
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percent}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status breakdown table */}
          <div className="card-elevated" style={{ padding: 24 }}>
            <div
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: 14,
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Status Snapshot
              </h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Count</th>
                  <th style={{ textAlign: "right" }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {allStatuses.map((status) => {
                  const count = dashboardData.byStatus[status] || 0;
                  const percent =
                    dashboardData.total > 0
                      ? (count / dashboardData.total) * 100
                      : 0;
                  return (
                    <tr key={status}>
                      <td>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: statusColors[status] || "var(--muted)",
                            }}
                          />
                          {status}
                        </div>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        {count}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "var(--muted)",
                          fontSize: 12,
                        }}
                      >
                        {percent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
