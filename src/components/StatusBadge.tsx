const statusMap: Record<string, string> = {
  "Draft": "status-draft",
  "Pending Approval": "status-pending",
  "Approved": "status-approved",
  "Rejected": "status-rejected",
  "Returned for Amendment": "status-returned",
  "Pending": "status-pending",
  "Returned": "status-returned",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusMap[status] || "status-draft";
  return (
    <span className={`status-badge ${cls}`}>
      {status}
    </span>
  );
}
