import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sapModuleCode } from "@/lib/service-request";
import type { ApprovalPayload, BatchApprovePayload } from "@/lib/workflow-validation";

async function processApproval(
  tx: Prisma.TransactionClient,
  approvalId: string,
  payload: ApprovalPayload,
) {
  const approval = await tx.requestApproval.findUnique({
    where: { id: approvalId },
    include: {
      approver: true,
      request: {
        include: {
          requester: true,
          approvals: { orderBy: { levelNo: "asc" }, include: { approver: true } },
        },
      },
    },
  });

  if (!approval) {
    throw new Error("Approval not found");
  }

  if (approval.approver.email.toLowerCase() !== payload.actorEmail) {
    throw new Error("Only the assigned approver can act on this approval");
  }

  if (approval.status !== "Pending") {
    throw new Error("Request already processed");
  }

  if (["Return", "Reject"].includes(payload.action) && !payload.comments) {
    throw new Error(`${payload.action} comment is required`);
  }

  const now = new Date();

  await tx.requestApproval.update({
    where: { id: approval.id },
    data: {
      status: payload.action === "Approve" ? "Approved" : payload.action === "Return" ? "Returned" : "Rejected",
      decision: payload.action,
      comments: payload.comments,
      decisionAt: now,
    },
  });

  await tx.approvalAction.create({
    data: {
      requestId: approval.requestId,
      approvalId: approval.id,
      actorId: approval.approverId,
      action: payload.action,
      comments: payload.comments,
    },
  });

  let requestStatus = approval.request.status;

  if (payload.action === "Approve") {
    const nextApproval = approval.request.approvals.find((item) => item.levelNo > approval.levelNo);

    if (nextApproval) {
      await tx.requestApproval.update({
        where: { id: nextApproval.id },
        data: { status: "Pending" },
      });
      await tx.request.update({
        where: { id: approval.requestId },
        data: { currentApprovalLevel: nextApproval.levelNo },
      });
      await tx.emailOutbox.create({
        data: {
          requestId: approval.requestId,
          toEmail: nextApproval.approver.email,
          subject: `${approval.request.ticketNo} requires approval`,
          body: `SAP S4 HANA request ${approval.request.ticketNo} is pending your approval.`,
        },
      });
    } else {
      requestStatus = "Approved";
      await tx.request.update({
        where: { id: approval.requestId },
        data: { status: requestStatus, approvedAt: now, currentApprovalLevel: null },
      });
      await tx.emailOutbox.create({
        data: {
          requestId: approval.requestId,
          toEmail: approval.request.requester.email,
          subject: `${approval.request.ticketNo} approved`,
          body: `Your SAP S4 HANA request ${approval.request.ticketNo} has been approved.`,
        },
      });
    }
  } else {
    requestStatus = payload.action === "Return" ? "Returned for Amendment" : "Rejected";
    await tx.request.update({
      where: { id: approval.requestId },
      data: { status: requestStatus, currentApprovalLevel: null },
    });
    await tx.emailOutbox.create({
      data: {
        requestId: approval.requestId,
        toEmail: approval.request.requester.email,
        subject: `${approval.request.ticketNo} ${requestStatus}`,
        body: payload.comments ?? requestStatus,
      },
    });
  }

  await tx.emailActionToken.updateMany({
    where: { requestId: approval.requestId, status: "active" },
    data: { status: "used", usedAt: now },
  });

  await tx.auditLog.create({
    data: {
      requestId: approval.requestId,
      actorId: approval.approverId,
      moduleCode: sapModuleCode,
      actionType: `Request ${payload.action.toLowerCase()}d`,
      entityType: "RequestApproval",
      entityId: approval.id,
      details: { ticketNo: approval.request.ticketNo, comments: payload.comments },
    },
  });

  return { requestId: approval.requestId, ticketNo: approval.request.ticketNo, status: requestStatus };
}

export async function actOnApproval(approvalId: string, payload: ApprovalPayload) {
  return prisma.$transaction((tx) => processApproval(tx, approvalId, payload));
}

export async function batchApprove(payload: BatchApprovePayload) {
  const results = [];

  for (const approvalId of payload.approvalIds) {
    try {
      results.push(await actOnApproval(approvalId, { actorEmail: payload.actorEmail, action: "Approve" }));
    } catch (error) {
      results.push({ approvalId, error: error instanceof Error ? error.message : "Unable to approve" });
    }
  }

  return { results };
}

