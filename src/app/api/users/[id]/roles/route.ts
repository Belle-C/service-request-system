import { NextRequest, NextResponse } from "next/server";
import { updateUserRoles } from "@/lib/user-actions";
import { parseUserRolesPayload } from "@/lib/workflow-validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = parseUserRolesPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return NextResponse.json(await updateUserRoles(id, parsed.value.roles));
}

