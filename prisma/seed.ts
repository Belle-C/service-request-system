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

  const sapModule = await prisma.module.upsert({
    where: { code: "SAP_S4_HANA" },
    update: {},
    create: { code: "SAP_S4_HANA", name: "SAP S4 HANA", displayOrder: 1 },
  });

  await prisma.form.upsert({
    where: { code: "SAP_S4_REQUEST" },
    update: {},
    create: {
      code: "SAP_S4_REQUEST",
      name: "SAP S4 HANA Request",
      moduleId: sapModule.id,
      displayOrder: 1,
    },
  });

  const digitalModule = await prisma.module.upsert({
    where: { code: "DIGITAL" },
    update: {},
    create: { code: "DIGITAL", name: "Digital", displayOrder: 2 },
  });

  for (const [index, form] of [
    ["DIGITAL_SUPPORT", "Digital Support Request"],
    ["APP_ENHANCEMENT", "Application Enhancement Request"],
    ["OFFBOARDING", "Offboarding Request"],
  ].entries()) {
    await prisma.form.upsert({
      where: { code: form[0] },
      update: {},
      create: {
        code: form[0],
        name: form[1],
        moduleId: digitalModule.id,
        displayOrder: index + 1,
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
