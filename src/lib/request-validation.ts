export type DraftPayload = {
  name: string;
  email: string;
  subcategory?: string;
  description?: string;
};

export type SubmitPayload = {
  email: string;
};

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  const text = readString(value);
  return text || undefined;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseDraftPayload(value: unknown): ParseResult<DraftPayload> {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid request body" };
  }

  const name = readString(value.name);
  const email = readString(value.email).toLowerCase();

  if (!name) {
    return { ok: false, error: "Name is required" };
  }

  if (!isEmail(email)) {
    return { ok: false, error: "Valid email is required" };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      subcategory: readOptionalString(value.subcategory),
      description: readOptionalString(value.description),
    },
  };
}

export function parseSubmitPayload(value: unknown): ParseResult<SubmitPayload> {
  if (!isRecord(value)) {
    return { ok: false, error: "Invalid request body" };
  }

  const email = readString(value.email).toLowerCase();

  if (!isEmail(email)) {
    return { ok: false, error: "Valid email is required" };
  }

  return { ok: true, value: { email } };
}

