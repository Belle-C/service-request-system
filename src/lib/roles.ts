export const roles = ["REQUESTER", "FINANCE", "APPROVER", "IT", "ADMIN"] as const;

export type RoleCode = (typeof roles)[number];

