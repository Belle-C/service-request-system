import { NextRequest, NextResponse } from "next/server";
import { createSapDraft } from "@/lib/request-actions";
import { parseDraftPayload } from "@/lib/request-validation";

export async function POST(request: NextRequest) {
  const parsed = parseDraftPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const draft = await createSapDraft(parsed.value);
  return NextResponse.json(draft, { status: 201 });
}

