import { NextRequest, NextResponse } from "next/server";
import { createSapConfig, getSapConfig, updateSapSettings } from "@/lib/sap-config-actions";
import { parseSapConfigPayload, parseSapSettingsPayload } from "@/lib/workflow-validation";

export async function GET() {
  return NextResponse.json(await getSapConfig());
}

export async function POST(request: NextRequest) {
  const parsed = parseSapConfigPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    return NextResponse.json(await createSapConfig(parsed.value), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create SAP configuration" },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const parsed = parseSapSettingsPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return NextResponse.json(await updateSapSettings(parsed.value));
}

