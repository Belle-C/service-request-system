import { NextRequest, NextResponse } from "next/server";
import { actOnApproval } from "@/lib/approval-actions";
import { parseApprovalPayload } from "@/lib/workflow-validation";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = parseApprovalPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    return NextResponse.json(await actOnApproval(id, parsed.value));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process approval" },
      { status: 400 },
    );
  }
}

