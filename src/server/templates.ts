// Lớp truy cập dữ liệu template. Mọi hàm lọc theo userId.
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { templateRuns, templates, type Template, type TemplateRun } from "@/db/schema";
import { planTasks, validateValues, type PlannedTask } from "@/core/template-engine";
import { templateInputSchema, type TemplateInput } from "@/core/template-schema";
import { createTask } from "./tasks";

export async function listTemplates(userId: string): Promise<Template[]> {
  return getDb().select().from(templates).where(eq(templates.userId, userId)).orderBy(templates.name);
}

export async function getTemplate(userId: string, id: string): Promise<Template | null> {
  const [row] = await getDb()
    .select()
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)));
  return row ?? null;
}

export async function saveTemplate(userId: string, input: TemplateInput, id?: string): Promise<Template | null> {
  const data = templateInputSchema.parse(input);
  if (id) {
    const [row] = await getDb()
      .update(templates)
      .set(data)
      .where(and(eq(templates.id, id), eq(templates.userId, userId)))
      .returning();
    return row ?? null;
  }
  const [row] = await getDb()
    .insert(templates)
    .values({ userId, ...data })
    .returning();
  return row;
}

export async function duplicateTemplate(userId: string, id: string): Promise<Template | null> {
  const t = await getTemplate(userId, id);
  if (!t) return null;
  const [row] = await getDb()
    .insert(templates)
    .values({ userId, name: `${t.name} (bản sao)`.slice(0, 100), description: t.description, fields: t.fields, rules: t.rules })
    .returning();
  return row;
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)))
    .returning({ id: templates.id });
  return rows.length > 0;
}

export type PreviewResult =
  | { ok: true; tasks: PlannedTask[]; warnings: string[] }
  | { ok: false; errors: Record<string, string> };

/** Tính trước danh sách task từ dữ liệu form (chưa lưu). */
export function previewTemplate(
  template: Pick<Template, "fields" | "rules">,
  raw: Record<string, unknown>,
  opts: { tz: string; now?: Date },
): PreviewResult {
  const { values, errors } = validateValues(template.fields, raw);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const { tasks, warnings } = planTasks(template, values, { tz: opts.tz, now: opts.now ?? new Date() });
  return { ok: true, tasks, warnings };
}

/** Điền form → tạo template run + toàn bộ task trong 1 transaction. */
export async function runTemplate(
  userId: string,
  templateId: string,
  raw: Record<string, unknown>,
  opts: { tz: string; now?: Date },
): Promise<{ ok: true; run: TemplateRun; count: number } | { ok: false; errors: Record<string, string> } | null> {
  const template = await getTemplate(userId, templateId);
  if (!template) return null;
  const preview = previewTemplate(template, raw, opts);
  if (!preview.ok) return preview;
  const { values } = validateValues(template.fields, raw);

  return getDb().transaction(async (tx) => {
    const [run] = await tx
      .insert(templateRuns)
      .values({ userId, templateId, templateName: template.name, values, taskCount: preview.tasks.length })
      .returning();
    for (const t of preview.tasks) {
      await createTask(
        userId,
        {
          title: t.title,
          description: t.description,
          dueAt: t.dueAt,
          priority: t.priority,
          tags: t.tags,
          subtasks: t.subtasks.map((title) => ({ title, done: false })),
        },
        { templateRunId: run.id, templateName: template.name },
        tx,
      );
    }
    return { ok: true as const, run, count: preview.tasks.length };
  });
}

export async function listTemplateRuns(userId: string, limit = 10): Promise<TemplateRun[]> {
  return getDb()
    .select()
    .from(templateRuns)
    .where(eq(templateRuns.userId, userId))
    .orderBy(desc(templateRuns.createdAt))
    .limit(limit);
}
