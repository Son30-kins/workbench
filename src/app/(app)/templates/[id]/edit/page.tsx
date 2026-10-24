import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/server/session";
import { getTemplate } from "@/server/templates";

export const metadata: Metadata = { title: "Sửa form mẫu" };

export default async function EditTemplatePage({ params }: PageProps<"/templates/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const template = await getTemplate(user.id, id);
  if (!template) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={`Sửa: ${template.name}`} description="Thay đổi chỉ áp dụng cho các lần điền form sau." />
      <TemplateBuilder
        id={template.id}
        initial={{ name: template.name, description: template.description, fields: template.fields, rules: template.rules }}
      />
    </div>
  );
}
