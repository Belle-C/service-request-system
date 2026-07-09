import assert from "node:assert/strict";
import { parseDraftPayload, parseSubmitPayload } from "./request-validation";

assert.deepEqual(parseDraftPayload({ name: "", email: "belle@example.com" }), {
  ok: false,
  error: "Name is required",
});

assert.deepEqual(parseDraftPayload({ name: "Belle", email: "bad-email" }), {
  ok: false,
  error: "Valid email is required",
});

assert.deepEqual(parseSubmitPayload({ email: "belle@example.com" }), {
  ok: true,
  value: { email: "belle@example.com" },
});

