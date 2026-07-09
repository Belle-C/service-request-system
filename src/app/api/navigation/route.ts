import { NextRequest, NextResponse } from "next/server";
import { navigationForRoles, roleCodes, type RoleCode } from "@/lib/service-request";

export function GET(request: NextRequest) {
  const roles = request.nextUrl.searchParams
    .get("roles")
    ?.split(",")
    .filter((role): role is RoleCode => roleCodes.includes(role as RoleCode)) ?? ["REQUESTER"];

  return NextResponse.json({ navigation: navigationForRoles(roles) });
}

