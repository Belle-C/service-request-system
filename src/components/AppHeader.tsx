"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRole } from "@/components/RoleContext";
import { RoleCode } from "@/lib/service-request";

export function AppHeader() {
  const { selectedRole, setSelectedRole, currentUser } = useRole();
  const [navLinks, setNavLinks] = useState<{ label: string; href: string }[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    fetch(`/api/navigation?roles=${selectedRole}`)
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((data) => {
        setNavLinks(data.navigation || []);
      })
      .catch((err) => {
        console.error("Navigation load error, using fallback:", err);
        // Fallback navigation items matching the role offline
        const fallbacks: Record<RoleCode, { label: string; href: string }[]> = {
          REQUESTER: [
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
          ],
          FINANCE: [
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Configuration", href: "/configuration" },
          ],
          APPROVER: [
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Approval Inbox", href: "/approval-inbox" },
          ],
          IT: [
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Dashboard", href: "/dashboard" },
          ],
          ADMIN: [
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Admin", href: "/admin" },
          ],
        };
        setNavLinks(fallbacks[selectedRole] || []);
      });
  }, [selectedRole]);

  return (
    <header className="border-b border-[var(--border)] bg-white shadow-xs">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link className="font-semibold text-lg tracking-tight text-[var(--primary)] hover:opacity-90 transition" href="/">
            Cora Service Request
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-[var(--muted)]">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  className={`px-3 py-1.5 rounded-md transition ${
                    isActive
                      ? "bg-[var(--surface-muted)] text-[var(--primary)] font-semibold"
                      : "hover:text-[var(--primary)]"
                  }`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Role simulator */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[var(--primary)]">{currentUser?.name || "Offline User"}</p>
            <p className="text-[10px] text-[var(--muted)]">{currentUser?.email || ""}</p>
          </div>
          <div className="relative inline-block text-left">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleCode)}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:border-[var(--primary)] transition focus:outline-hidden cursor-pointer"
            >
              <option value="REQUESTER">Requester Mode</option>
              <option value="FINANCE">Finance Mode</option>
              <option value="APPROVER">Approver Mode</option>
              <option value="IT">IT Mode</option>
              <option value="ADMIN">Admin Mode</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
