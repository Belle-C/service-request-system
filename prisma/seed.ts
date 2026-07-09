import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = ["Requester", "Finance", "Approver", "IT", "Admin"];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.toUpperCase() },
      update: {},
      create: { code: role.toUpperCase(), name: role },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

