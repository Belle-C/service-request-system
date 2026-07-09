import { prisma } from "@/lib/prisma";
import { sapRequestFormCode } from "@/lib/service-request";
import NewRequestForm from "@/components/NewRequestForm";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  let configs: { id: string; subcategory: string; isActive: boolean }[] = [];
  let settings: { descriptionRequired: boolean; attachmentRequired: boolean } | null = null;
  let isOffline = false;

  try {
    configs = await prisma.sapS4Config.findMany({
      where: { formCode: sapRequestFormCode, isActive: true },
      orderBy: { subcategory: "asc" },
      select: {
        id: true,
        subcategory: true,
        isActive: true,
      },
    });

    settings = await prisma.sapS4GlobalSetting.findUnique({
      where: { formCode: sapRequestFormCode },
      select: {
        descriptionRequired: true,
        attachmentRequired: true,
      },
    });
  } catch (err) {
    console.error("Database connection failed in NewRequestPage:", err);
    isOffline = true;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Create Request
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--primary)]">
          New Service Request
        </h1>
      </section>

      <NewRequestForm configs={configs} settings={settings} isOffline={isOffline} />
    </main>
  );
}
