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

  const sapForm = await prisma.form.upsert({
    where: { code: "SAP_S4_REQUEST" },
    update: {},
    create: {
      code: "SAP_S4_REQUEST",
      name: "SAP S4 HANA Request",
      moduleId: sapModule.id,
      displayOrder: 1,
    },
  });

  const [belle, approver, finance] = await Promise.all([
    prisma.user.upsert({
      where: { email: "belle.chong@cora-environment.com" },
      update: {},
      create: {
        name: "Belle Chong",
        email: "belle.chong@cora-environment.com",
        jobTitle: "Requester",
        department: "Information Technology",
      },
    }),
    prisma.user.upsert({
      where: { email: "approver@cora-environment.com" },
      update: {},
      create: {
        name: "Jason Chan",
        email: "approver@cora-environment.com",
        jobTitle: "Manager",
        department: "Finance",
      },
    }),
    prisma.user.upsert({
      where: { email: "finance@cora-environment.com" },
      update: {},
      create: {
        name: "Finance User",
        email: "finance@cora-environment.com",
        jobTitle: "Finance",
        department: "Finance",
      },
    }),
  ]);

  for (const [user, roleCode] of [
    [belle, "REQUESTER"],
    [approver, "APPROVER"],
    [finance, "FINANCE"],
  ] as const) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: { isActive: true },
      create: { userId: user.id, roleId: role.id },
    });
  }

  await prisma.sapS4GlobalSetting.upsert({
    where: { formCode: sapForm.code },
    update: {},
    create: { formCode: sapForm.code, descriptionRequired: true, attachmentRequired: false },
  });

  await prisma.sapS4Config.upsert({
    where: { formCode_subcategory: { formCode: sapForm.code, subcategory: "Credit Note" } },
    update: { approvalRoute: { levels: [{ approverId: approver.id }] } },
    create: {
      formCode: sapForm.code,
      subcategory: "Credit Note",
      approvalRoute: { levels: [{ approverId: approver.id }] },
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
