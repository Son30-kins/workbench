import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { PageHeader } from "@/components/ui";
import { getI18n } from "@/i18n/server";
import { getTemplate } from "@/server/queries";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.editTemplate };
}

export default async function EditTemplatePage({ params }: PageProps<"/templates/[id]/edit">) {
  await requireUser();
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();
  const { t } = await getI18n();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t.templates.editTitle(template.name)} description={t.templates.editDescription} />
      <TemplateBuilder
        id={template.id}
        initial={{ name: template.name, description: template.description, fields: template.fields, rules: template.rules }}
      />
    </div>
  );
}
