import { roleCodes, type RoleCode } from "@/lib/service-request";

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type ApprovalPayload = {
  actorEmail: string;
  action: "Approve" | "Return" | "Reject";
  comments?: string;
};

export type BatchApprovePayload = {
  actorEmail: string;
  approvalIds: string[];
};

export type SapConfigPayload = {
  subcategory: string;
  approvalRoute: { levels: { approverId: string }[] };
  isActive?: boolean;
};

export type SapSettingsPayload = {
  descriptionRequired: boolean;
  attachmentRequired: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseApprovalPayload(value: unknown): ParseResult<ApprovalPayload> {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid request body" };
  }

  const actorEmail = stringValue(value.actorEmail).toLowerCase();
  const action = stringValue(value.action);
  const comments = stringValue(value.comments) || undefined;

  if (!isEmail(actorEmail)) {
    return { ok: false, error: "Valid actorEmail is required" };
  }

  if (!["Approve", "Return", "Reject"].includes(action)) {
    return { ok: false, error: "Invalid approval action" };
  }

  if (["Return", "Reject"].includes(action) && !comments) {
    return { ok: false, error: `${action} comment is required` };
  }

  return { ok: true, value: { actorEmail, action: action as ApprovalPayload["action"], comments } };
}

export function parseBatchApprovePayload(value: unknown): ParseResult<BatchApprovePayload> {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid request body" };
  }

  const actorEmail = stringValue(value.actorEmail).toLowerCase();

  if (!isEmail(actorEmail)) {
    return { ok: false, error: "Valid actorEmail is required" };
  }

  if (!Array.isArray(value.approvalIds) || value.approvalIds.some((id) => typeof id !== "string")) {
    return { ok: false, error: "approvalIds must be an array of strings" };
  }

  return { ok: true, value: { actorEmail, approvalIds: value.approvalIds } };
}

export function parseSapConfigPayload(value: unknown): ParseResult<SapConfigPayload> {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid request body" };
  }

  const subcategory = stringValue(value.subcategory);

  if (!subcategory) {
    return { ok: false, error: "Subcategory is required" };
  }

  if (!isRecord(value.approvalRoute) || !Array.isArray(value.approvalRoute.levels)) {
    return { ok: false, error: "approvalRoute.levels is required" };
  }

  const levels = value.approvalRoute.levels;

  if (levels.length < 1 || levels.length > 3) {
    return { ok: false, error: "Approval route must have 1 to 3 levels" };
  }

  const parsedLevels = levels.map((level) => {
    if (!isRecord(level)) {
      return { approverId: "" };
    }

    return { approverId: stringValue(level.approverId) };
  });

  if (parsedLevels.some((level) => !level.approverId)) {
    return { ok: false, error: "Every approval level needs an approverId" };
  }

  return {
    ok: true,
    value: {
      subcategory,
      approvalRoute: { levels: parsedLevels },
      isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    },
  };
}

export function parseSapSettingsPayload(value: unknown): ParseResult<SapSettingsPayload> {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid request body" };
  }

  return {
    ok: true,
    value: {
      descriptionRequired: value.descriptionRequired === true,
      attachmentRequired: value.attachmentRequired === true,
    },
  };
}

export function parseUserRolesPayload(value: unknown): ParseResult<{ roles: RoleCode[] }> {
  if (!isRecord(value) || !Array.isArray(value.roles)) {
    return { ok: false, error: "roles array is required" };
  }

  const roles = value.roles.filter((role): role is RoleCode => roleCodes.includes(role as RoleCode));
  return { ok: true, value: { roles } };
}

