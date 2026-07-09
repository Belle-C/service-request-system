import Link from "next/link";

const links = [
  ["My Requests", "/my-requests"],
  ["New Request", "/new-request"],
  ["Approval Inbox", "/approval-inbox"],
  ["Dashboard", "/dashboard"],
  ["Configuration", "/configuration"],
  ["Admin", "/admin"],
];

export function AppHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link className="font-semibold text-[var(--primary)]" href="/">
          Cora Service Request
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--muted)]">
          {links.map(([label, href]) => (
            <Link className="hover:text-[var(--primary)]" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

