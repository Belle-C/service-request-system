import { prisma } from "@/lib/prisma";
import { roleCodes, type RoleCode } from "@/lib/service-request";

export async function updateUserRoles(userId: string, roles: RoleCode[]) {
  const validRoles = roles.filter((role) => roleCodes.includes(role));

  await prisma.$transaction(async (tx) => {
    await tx.userRole.updateMany({ where: { userId }, data: { isActive: false } });

    const roleRows = await tx.role.findMany({ where: { code: { in: validRoles } } });

    for (const role of roleRows) {
      await tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        update: { isActive: true },
        create: { userId, roleId: role.id },
      });
    }
  });

  return { userId, roles: validRoles };
}

