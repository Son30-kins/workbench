import { FileStack, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TemplateCardActions } from "@/components/templates/template-card-actions";
import { Card, PageHeader } from "@/components/ui";
import { formatInTz } from "@/core/time";
import { requireUser } from "@/server/session";
import { listTemplateRuns, listTemplates } from "@/server/templates";

export const metadata: Metadata = { title: "Form mẫu" };

export default async function TemplatesPage() {
  const user = await requireUser();
  const [templates, runs] = await Promise.all([listTemplates(user.id), listTemplateRuns(user.id, 8)]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Form mẫu"
        description="Điền một form — app tự tạo các task với hạn chót và mức ưu tiên định sẵn."
        actions={
          <Link href="/templates/new" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:opacity-90">
            Tạo form mẫu
          </Link>
        }
      />

      {templates.length === 0 ? (
        <Card className="px-6 py-16 text-center text-fg-2">Chưa có form mẫu nào.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <FileStack size={20} />
                </span>
                <TemplateCardActions id={t.id} name={t.name} />
              </div>
              <h2 className="text-lg font-bold">{t.name}</h2>
              {t.description && <p className="mt-1 text-sm text-fg-2">{t.description}</p>}
              <p className="mt-3 text-[13px] text-fg-2">
                {t.fields.length} trường · tạo {t.rules.length} task
              </p>
              <div className="mt-auto pt-5">
                <Link
                  href={`/templates/${t.id}/run`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90"
                >
                  <Play size={15} /> Điền form
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {runs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Lần điền gần đây</h2>
          <Card className="divide-y divide-line">
            {runs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="font-semibold">{r.templateName}</span>
                <span className="text-fg-2">
                  {r.taskCount} task · {formatInTz(r.createdAt, user.timezone)}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
