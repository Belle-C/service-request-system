export function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--primary)]">{value}</p>
    </article>
  );
}

