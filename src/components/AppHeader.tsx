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
      .catch(() => {
        const fallbacks: Record<RoleCode, { label: string; href: string }[]> = {
          REQUESTER: [
            { label: "Home", href: "/" },
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
          ],
          FINANCE: [
            { label: "Home", href: "/" },
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Configuration", href: "/configuration" },
          ],
          APPROVER: [
            { label: "Home", href: "/" },
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Approval Inbox", href: "/approval-inbox" },
          ],
          IT: [
            { label: "Home", href: "/" },
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Dashboard", href: "/dashboard" },
          ],
          ADMIN: [
            { label: "Home", href: "/" },
            { label: "My Requests", href: "/my-requests" },
            { label: "New Request", href: "/new-request" },
            { label: "Admin", href: "/admin" },
          ],
        };
        setNavLinks(fallbacks[selectedRole] || []);
      });
  }, [selectedRole]);

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--primary)",
        height: "var(--header-height)",
        display: "flex",
        alignItems: "center",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div
        className="page-container"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--accent)",
              fontWeight: 800,
              fontSize: 15,
              color: "var(--primary)",
              letterSpacing: "-0.03em",
            }}
          >
            C
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#ffffff",
              letterSpacing: "-0.01em",
            }}
          >
            Cora
            <span style={{ color: "var(--accent)", marginLeft: 4, fontWeight: 400 }}>
              Service
            </span>
          </span>
        </Link>

        {/* Nav Links - centered */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            justifyContent: "center",
          }}
        >
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.62)",
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "#ffffff";
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color =
                      "rgba(255,255,255,0.62)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: user + role selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* User info */}
          <div style={{ textAlign: "right", display: "none" }} className="sm-show">
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: 1.3,
              }}
            >
              {currentUser?.name || "Offline User"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.3,
              }}
            >
              {currentUser?.email || ""}
            </p>
          </div>

          {/* Avatar */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(111,216,93,0.2)",
              border: "1.5px solid rgba(111,216,93,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "var(--accent)",
              flexShrink: 0,
            }}
            title={currentUser?.name || "User"}
          >
            {initials}
          </div>

          {/* Role selector */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as RoleCode);
              }}
              id="role-simulator-select"
              style={{
                appearance: "none",
                WebkitAppearance: "none",
                padding: "7px 32px 7px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                transition: "all 0.15s ease",
              }}
            >
              <option value="REQUESTER" style={{ color: "#000", background: "#fff" }}>
                Requester
              </option>
              <option value="FINANCE" style={{ color: "#000", background: "#fff" }}>
                Finance
              </option>
              <option value="APPROVER" style={{ color: "#000", background: "#fff" }}>
                Approver
              </option>
              <option value="IT" style={{ color: "#000", background: "#fff" }}>
                IT
              </option>
              <option value="ADMIN" style={{ color: "#000", background: "#fff" }}>
                Admin
              </option>
            </select>
            {/* Chevron */}
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.6)",
                pointerEvents: "none",
                fontSize: 10,
              }}
            >
              ▾
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .sm-show { display: block !important; }
        }
      `}</style>
    </header>
  );
}
