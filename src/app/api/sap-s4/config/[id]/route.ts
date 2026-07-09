import { NextRequest, NextResponse } from "next/server";
import { deleteSapConfig, updateSapConfig } from "@/lib/sap-config-actions";
import { parseSapConfigPayload } from "@/lib/workflow-validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = parseSapConfigPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateSapConfig(id, parsed.value));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update SAP configuration" },
      { status: 400 },
    );
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json(await deleteSapConfig(id));
}

