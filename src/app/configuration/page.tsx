import React from "react";
import { prisma } from "@/lib/prisma";
import { sapRequestFormCode } from "@/lib/service-request";
import ConfigurationClient from "@/components/ConfigurationClient";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  let settings: { descriptionRequired: boolean; attachmentRequired: boolean } | null = null;
  let configs: React.ComponentProps<typeof ConfigurationClient>["configs"] = [];
  let users: React.ComponentProps<typeof ConfigurationClient>["users"] = [];
  let isOffline = false;

  try {
    settings = await prisma.sapS4GlobalSetting.findUnique({
      where: { formCode: sapRequestFormCode },
      select: {
        descriptionRequired: true,
        attachmentRequired: true,
      },
    });

    const dbConfigs = await prisma.sapS4Config.findMany({
      where: { formCode: sapRequestFormCode },
      orderBy: { subcategory: "asc" },
    });

    configs = dbConfigs as unknown as React.ComponentProps<typeof ConfigurationClient>["configs"];

    const dbUsers = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        roles: {
          include: { role: true },
          where: { isActive: true },
        },
      },
    });

    users = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      jobTitle: u.jobTitle,
      roles: u.roles.map((r) => r.role.code),
    })) as unknown as React.ComponentProps<typeof ConfigurationClient>["users"];
  } catch (err) {
    console.error("Database connection failed in ConfigurationPage:", err);
    isOffline = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Workflow Management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--primary)]">
          SAP S4 HANA Configuration
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Configure global document rule controls and approval level flows for incoming finance requests.
        </p>
      </section>

      <ConfigurationClient
        settings={settings}
        configs={configs}
        users={users}
        isOffline={isOffline}
      />
    </main>
  );
}
