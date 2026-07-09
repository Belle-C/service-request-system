import { NextResponse } from "next/server";
import { requestTypes } from "@/lib/service-request";

export function GET() {
  return NextResponse.json({ requestTypes });
}

