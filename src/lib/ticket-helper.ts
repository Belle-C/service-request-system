export function formatSubmittedTicket(sequence: number) {
  return `SAP-S4-${String(sequence).padStart(4, "0")}`;
}

export function formatDraftTicket(sequence: number) {
  return `DRAFT-SAP-${sequence}`;
}

