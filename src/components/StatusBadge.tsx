export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
      {status}
    </span>
  );
}

