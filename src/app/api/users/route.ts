import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { roles: { include: { role: true }, where: { isActive: true } } },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      department: user.department,
      isActive: user.isActive,
      roles: user.roles.map((userRole) => userRole.role.code),
    })),
  });
}

