import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RunTemplateForm } from "@/components/templates/run-form";
import { PageHeader } from "@/components/ui";
import { getTemplate } from "@/server/queries";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Điền form mẫu" };

export default async function RunTemplatePage({ params }: PageProps<"/templates/[id]/run">) {
  await requireUser();
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={template.description || "Điền form để tạo task."}
        actions={
          <Link
            href={`/templates/${template.id}/edit`}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold hover:bg-hover"
          >
            <Pencil size={15} /> Sửa form mẫu
          </Link>
        }
      />
      <RunTemplateForm key={template.id} templateId={template.id} fields={template.fields} />
    </div>
  );
}
