interface SummaryCardProps {
  label: string;
  value: string;
  accent?: "primary" | "green" | "blue" | "purple";
}

export function SummaryCard({ label, value, accent = "primary" }: SummaryCardProps) {
  const accentLine: Record<string, string> = {
    primary: "#003138",
    green: "#6fd85d",
    blue: "#0077bf",
    purple: "#7561c8",
  };

  return (
    <article
      className="metric-card"
      style={{ borderTop: `3px solid ${accentLine[accent]}` }}
    >
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </article>
  );
}
