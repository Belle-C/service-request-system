"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleCode, roleCodes } from "@/lib/service-request";

export interface User {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  department?: string | null;
  isActive: boolean;
  roles: RoleCode[];
}

interface RoleContextType {
  selectedRole: RoleCode;
  setSelectedRole: (role: RoleCode) => void;
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [selectedRole, setSelectedRoleState] = useState<RoleCode>(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/selectedRole=([^;]+)/);
      if (match && roleCodes.includes(match[1] as RoleCode)) {
        return match[1] as RoleCode;
      }
    }
    return "REQUESTER";
  });

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("API offline");
        return res.json();
      })
      .then((data) => {
        setUsers(data.users || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setIsLoading(false);
      });
  }, []);

  const setSelectedRole = (role: RoleCode) => {
    setSelectedRoleState(role);
    document.cookie = `selectedRole=${role}; path=/; max-age=31536000`;
    router.refresh();
  };

  // Fallbacks if offline
  const fallbackUsers: Record<RoleCode, Partial<User>> = {
    REQUESTER: { id: "offline-req", name: "Belle Chong", email: "belle.chong@cora-environment.com", roles: ["REQUESTER"] },
    FINANCE: { id: "offline-fin", name: "Finance User", email: "finance@cora-environment.com", roles: ["FINANCE"] },
    APPROVER: { id: "offline-app", name: "Jason Chan", email: "approver@cora-environment.com", roles: ["APPROVER"] },
    IT: { id: "offline-it", name: "IT User", email: "it@cora-environment.com", roles: ["IT"] },
    ADMIN: { id: "offline-adm", name: "Admin User", email: "admin@cora-environment.com", roles: ["ADMIN"] },
  };

  const dbUser = users.find((u) => u.roles.includes(selectedRole));
  const currentUser = dbUser || (fallbackUsers[selectedRole] as User);

  return (
    <RoleContext.Provider value={{ selectedRole, setSelectedRole, users, currentUser, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
