import type { Metadata } from "next";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { PageHeader } from "@/components/ui";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.newTemplate };
}

export default async function NewTemplatePage() {
  await requireUser();
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t.templates.newTitle} description={t.templates.newDescription} />
      <TemplateBuilder />
    </div>
  );
}
