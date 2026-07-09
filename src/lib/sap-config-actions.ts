import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sapRequestFormCode } from "@/lib/service-request";
import type { SapConfigPayload, SapSettingsPayload } from "@/lib/workflow-validation";

export async function getSapConfig() {
  const [settings, configs] = await Promise.all([
    prisma.sapS4GlobalSetting.findUnique({ where: { formCode: sapRequestFormCode } }),
    prisma.sapS4Config.findMany({ where: { formCode: sapRequestFormCode }, orderBy: { subcategory: "asc" } }),
  ]);

  return { settings, configs };
}

export async function updateSapSettings(payload: SapSettingsPayload) {
  return prisma.sapS4GlobalSetting.upsert({
    where: { formCode: sapRequestFormCode },
    update: payload,
    create: { formCode: sapRequestFormCode, ...payload },
  });
}

export async function createSapConfig(payload: SapConfigPayload) {
  return prisma.sapS4Config.create({
    data: {
      formCode: sapRequestFormCode,
      subcategory: payload.subcategory,
      approvalRoute: payload.approvalRoute as Prisma.InputJsonValue,
    },
  });
}

export async function updateSapConfig(id: string, payload: SapConfigPayload) {
  return prisma.sapS4Config.update({
    where: { id },
    data: {
      subcategory: payload.subcategory,
      approvalRoute: payload.approvalRoute as Prisma.InputJsonValue,
      isActive: payload.isActive ?? true,
    },
  });
}

export async function deleteSapConfig(id: string) {
  return prisma.sapS4Config.update({ where: { id }, data: { isActive: false } });
}

