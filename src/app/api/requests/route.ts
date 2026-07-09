import { NextRequest, NextResponse } from "next/server";
import { listRequestsForEmail } from "@/lib/request-actions";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  return NextResponse.json({ requests: await listRequestsForEmail(email) });
}

