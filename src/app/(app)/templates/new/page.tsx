import type { Metadata } from "next";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Tạo form mẫu" };

export default async function NewTemplatePage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Tạo form mẫu" description="Định nghĩa form cần điền và các task sẽ được tạo từ form đó." />
      <TemplateBuilder />
    </div>
  );
}
