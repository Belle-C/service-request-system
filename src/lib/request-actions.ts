import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatDraftTicket,
  formatSubmittedTicket,
  sapModuleCode,
  sapRequestFormCode,
} from "@/lib/service-request";
import type { DraftPayload, SubmitPayload } from "@/lib/request-validation";

type ApprovalRoute = {
  levels: { levelNo: number; approverId: string }[];
};

async function nextTicket(tx: Prisma.TransactionClient, prefix: string) {
  const sequence = await tx.ticketSequence.upsert({
    where: { prefix },
    create: { prefix, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return sequence.lastNumber;
}

function parseApprovalRoute(value: Prisma.JsonValue): ApprovalRoute {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("levels" in value)) {
    throw new Error("Approval route is not configured");
  }

  const levels = (value as { levels?: unknown }).levels;

  if (!Array.isArray(levels) || levels.length < 1 || levels.length > 3) {
    throw new Error("Approval route must have 1 to 3 levels");
  }

  return {
    levels: levels.map((level, index) => {
      if (!level || typeof level !== "object" || Array.isArray(level)) {
        throw new Error("Approval route contains an invalid level");
      }

      const approverId = (level as { approverId?: unknown }).approverId;

      if (typeof approverId !== "string" || !approverId.trim()) {
        throw new Error(`Approval level ${index + 1} is missing an approver`);
      }

      return { levelNo: index + 1, approverId };
    }),
  };
}

async function upsertRequester(tx: Prisma.TransactionClient, payload: DraftPayload) {
  return tx.user.upsert({
    where: { email: payload.email },
    update: { name: payload.name },
    create: { email: payload.email, name: payload.name },
  });
}

export async function createSapDraft(payload: DraftPayload) {
  return prisma.$transaction(async (tx) => {
    const requester = await upsertRequester(tx, payload);
    const sequence = await nextTicket(tx, "DRAFT-SAP");

    const request = await tx.request.create({
      data: {
        ticketNo: formatDraftTicket(sequence),
        moduleCode: sapModuleCode,
        formCode: sapRequestFormCode,
        requesterId: requester.id,
        status: "Draft",
        subcategory: payload.subcategory,
        description: payload.description,
      },
      select: {
        id: true,
        ticketNo: true,
        status: true,
        subcategory: true,
        description: true,
        createdAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        requestId: request.id,
        actorId: requester.id,
        moduleCode: sapModuleCode,
        actionType: "Request drafted",
        entityType: "Request",
        entityId: request.id,
        details: { ticketNo: request.ticketNo },
      },
    });

    return request;
  });
}

export async function listRequestsForEmail(email: string) {
  return prisma.request.findMany({
    where: { requester: { email } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ticketNo: true,
      moduleCode: true,
      formCode: true,
      status: true,
      subcategory: true,
      submittedAt: true,
      approvedAt: true,
      createdAt: true,
    },
  });
}

export async function submitSapDraft(id: string, payload: SubmitPayload) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.request.findUnique({
      where: { id },
      include: { requester: true },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.requester.email !== payload.email) {
      throw new Error("Only the requester can submit this draft");
    }

    if (!["Draft", "Returned for Amendment"].includes(request.status)) {
      throw new Error("Only draft or returned requests can be submitted");
    }

    if (!request.subcategory) {
      throw new Error("Subcategory is required before submission");
    }

    const config = await tx.sapS4Config.findFirst({
      where: {
        formCode: sapRequestFormCode,
        subcategory: request.subcategory,
        isActive: true,
      },
    });

    if (!config) {
      throw new Error("No active SAP S4 HANA configuration found for this subcategory");
    }

    const route = parseApprovalRoute(config.approvalRoute);
    const approvers = await tx.user.findMany({
      where: { id: { in: route.levels.map((level) => level.approverId) } },
      select: { id: true, email: true },
    });
    const approverEmailById = new Map(approvers.map((approver) => [approver.id, approver.email]));
    const firstApproverEmail = approverEmailById.get(route.levels[0].approverId);

    if (!firstApproverEmail || approvers.length !== route.levels.length) {
      throw new Error("Approval route has an approver that no longer exists");
    }

    const sequence = await nextTicket(tx, "SAP-S4");
    const ticketNo = formatSubmittedTicket(sequence);
    const now = new Date();

    await tx.requestApproval.deleteMany({ where: { requestId: request.id } });

    await tx.requestApproval.createMany({
      data: route.levels.map((level, index) => ({
        requestId: request.id,
        levelNo: level.levelNo,
        approverId: level.approverId,
        status: index === 0 ? "Pending" : "Waiting",
      })),
    });

    const submitted = await tx.request.update({
      where: { id: request.id },
      data: {
        ticketNo,
        status: "Pending Approval",
        currentApprovalLevel: 1,
        approverRouteSnapshot: route,
        submittedAt: now,
      },
      select: {
        id: true,
        ticketNo: true,
        status: true,
        subcategory: true,
        currentApprovalLevel: true,
        submittedAt: true,
      },
    });

    await tx.emailOutbox.createMany({
      data: [
        {
          requestId: request.id,
          toEmail: request.requester.email,
          subject: `${ticketNo} submitted`,
          body: `Your SAP S4 HANA request ${ticketNo} has been submitted.`,
        },
        {
          requestId: request.id,
          toEmail: firstApproverEmail,
          subject: `${ticketNo} requires approval`,
          body: `SAP S4 HANA request ${ticketNo} is pending your approval.`,
        },
      ],
    });

    await tx.auditLog.create({
      data: {
        requestId: request.id,
        actorId: request.requesterId,
        moduleCode: sapModuleCode,
        actionType: "Request submitted",
        entityType: "Request",
        entityId: request.id,
        details: { ticketNo },
      },
    });

    return submitted;
  });
}
