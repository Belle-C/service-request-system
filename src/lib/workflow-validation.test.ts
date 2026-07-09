import assert from "node:assert/strict";
import { parseApprovalPayload, parseSapConfigPayload } from "./workflow-validation";

assert.deepEqual(parseApprovalPayload({ actorEmail: "a@b.com", action: "Return" }), {
  ok: false,
  error: "Return comment is required",
});

assert.deepEqual(parseApprovalPayload({ actorEmail: "a@b.com", action: "Approve" }), {
  ok: true,
  value: { actorEmail: "a@b.com", action: "Approve", comments: undefined },
});

assert.equal(
  parseSapConfigPayload({
    subcategory: "Credit Note",
    approvalRoute: { levels: [{ approverId: "user-1" }] },
  }).ok,
  true,
);

