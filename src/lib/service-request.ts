export const roleCodes = ["REQUESTER", "FINANCE", "APPROVER", "IT", "ADMIN"] as const;

export type RoleCode = (typeof roleCodes)[number];

export const sapModuleCode = "SAP_S4_HANA";
export const sapRequestFormCode = "SAP_S4_REQUEST";

export const requestStatuses = [
  "Draft",
  "Pending Approval",
  "Returned for Amendment",
  "Rejected",
  "Approved",
] as const;

export const requestTypes = [
  {
    code: "DIGITAL_SUPPORT",
    label: "Digital Support Request",
    moduleCode: "DIGITAL",
    formCode: "DIGITAL_SUPPORT",
    purpose: "For general IT/Digital issues",
  },
  {
    code: "APP_ENHANCEMENT",
    label: "Application Enhancement Request",
    moduleCode: "DIGITAL",
    formCode: "APP_ENHANCEMENT",
    purpose: "For application changes, improvements, or new feature requests",
  },
  {
    code: "OFFBOARDING",
    label: "Offboarding Request",
    moduleCode: "DIGITAL",
    formCode: "OFFBOARDING",
    purpose: "For staff offboarding form submission",
  },
  {
    code: "SAP_S4",
    label: "SAP S4 HANA Request",
    moduleCode: sapModuleCode,
    formCode: sapRequestFormCode,
    purpose: "For SAP S4 HANA finance-related approval requests",
  },
] as const;

export const navigationItems = [
  { label: "My Requests", href: "/my-requests", roles: ["REQUESTER", "FINANCE", "APPROVER", "IT", "ADMIN"] },
  { label: "New Request", href: "/new-request", roles: ["REQUESTER", "FINANCE", "APPROVER", "IT", "ADMIN"] },
  { label: "Approval Inbox", href: "/approval-inbox", roles: ["APPROVER"] },
  { label: "Dashboard", href: "/dashboard", roles: ["FINANCE", "IT"] },
  { label: "Configuration", href: "/configuration", roles: ["FINANCE"] },
  { label: "Admin", href: "/admin", roles: ["ADMIN"] },
] as const;

export function formatSubmittedTicket(sequence: number) {
  return `SAP-S4-${String(sequence).padStart(4, "0")}`;
}

export function formatDraftTicket(sequence: number) {
  return `DRAFT-SAP-${sequence}`;
}

export function navigationForRoles(roles: RoleCode[]) {
  const roleSet = new Set(roles);

  return navigationItems.filter((item) => item.roles.some((role) => roleSet.has(role)));
}

