import Link from "next/link";
import { navigationForRoles } from "@/lib/service-request";

export function AppHeader() {
  const links = navigationForRoles(["REQUESTER", "FINANCE", "APPROVER", "ADMIN"]);

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="font-semibold text-[var(--primary)]" href="/">
          Cora Service Request
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--muted)]">
          {links.map(({ label, href }) => (
            <Link className="hover:text-[var(--primary)]" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
