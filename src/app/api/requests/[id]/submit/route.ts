import { NextRequest, NextResponse } from "next/server";
import { submitSapDraft } from "@/lib/request-actions";
import { parseSubmitPayload } from "@/lib/request-validation";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = parseSubmitPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await submitSapDraft(id, parsed.value);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit request" },
      { status: 400 },
    );
  }
}

