const tabs = ["All Requests", "Pending Approval", "Returned", "Rejected", "Approved"];

export function RequestTabs() {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium"
          key={tab}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

