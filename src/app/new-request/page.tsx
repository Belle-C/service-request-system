import { prisma } from "@/lib/prisma";
import { sapRequestFormCode } from "@/lib/service-request";
import NewRequestForm from "@/components/NewRequestForm";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  let configs: { id: string; subcategory: string; isActive: boolean }[] = [];
  let settings: { descriptionRequired: boolean; attachmentRequired: boolean } | null =
    null;
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
    <main className="page-container page-main">
      <section style={{ marginBottom: 36 }}>
        <p className="page-eyebrow">Create Request</p>
        <h1 className="page-title">New Service Request</h1>
        <p className="page-subtitle">
          Select a request type and complete the form to initiate a new workflow.
        </p>
      </section>

      <NewRequestForm configs={configs} settings={settings} isOffline={isOffline} />
    </main>
  );
}
