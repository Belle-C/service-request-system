import { NextRequest, NextResponse } from "next/server";
import { batchApprove } from "@/lib/approval-actions";
import { parseBatchApprovePayload } from "@/lib/workflow-validation";

export async function POST(request: NextRequest) {
  const parsed = parseBatchApprovePayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    return NextResponse.json(await batchApprove(parsed.value));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to batch approve" },
      { status: 400 },
    );
  }
}

