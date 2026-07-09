import assert from "node:assert/strict";
import {
  formatDraftTicket,
  formatSubmittedTicket,
  navigationForRoles,
  requestTypes,
} from "./service-request";

assert.equal(formatDraftTicket(1), "DRAFT-SAP-1");
assert.equal(formatSubmittedTicket(1), "SAP-S4-0001");
assert.equal(formatSubmittedTicket(42), "SAP-S4-0042");
assert.equal(requestTypes.length, 4);
assert.deepEqual(
  navigationForRoles(["FINANCE"]).map((item) => item.label),
  ["My Requests", "New Request", "Dashboard", "Configuration"],
);

