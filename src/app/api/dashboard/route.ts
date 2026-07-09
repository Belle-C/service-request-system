import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sapModuleCode } from "@/lib/service-request";

export async function GET() {
  const requests = await prisma.request.findMany({
    where: { moduleCode: sapModuleCode },
    select: { status: true, subcategory: true, submittedAt: true, approvedAt: true },
  });

  const byStatus = Object.groupBy(requests, (request) => request.status);
  const bySubcategory = Object.groupBy(requests, (request) => request.subcategory ?? "Uncategorised");

  return NextResponse.json({
    total: requests.length,
    byStatus: Object.fromEntries(Object.entries(byStatus).map(([key, value]) => [key, value?.length ?? 0])),
    bySubcategory: Object.fromEntries(
      Object.entries(bySubcategory).map(([key, value]) => [key, value?.length ?? 0]),
    ),
  });
}

