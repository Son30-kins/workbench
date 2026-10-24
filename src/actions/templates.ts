"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formatInTz } from "@/core/time";
import { templateInputSchema, type TemplateInput } from "@/core/template-schema";
import { requireUser } from "@/server/session";
import {
  deleteTemplate,
  duplicateTemplate,
  getTemplate,
  previewTemplate,
  runTemplate,
  saveTemplate,
} from "@/server/templates";

export type SaveTemplateResult = { ok: false; errors: { path: string; message: string }[] } | undefined;

export async function saveTemplateAction(input: TemplateInput, id?: string): Promise<SaveTemplateResult> {
  const user = await requireUser();
  const parsed = templateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
  }
  const saved = await saveTemplate(user.id, parsed.data, id);
  if (!saved) return { ok: false, errors: [{ path: "", message: "Không tìm thấy template" }] };
  revalidatePath("/", "layout");
  redirect("/templates");
}

export async function duplicateTemplateAction(id: string) {
  const user = await requireUser();
  await duplicateTemplate(user.id, id);
  revalidatePath("/", "layout");
}

export async function deleteTemplateAction(id: string) {
  const user = await requireUser();
  await deleteTemplate(user.id, id);
  revalidatePath("/", "layout");
}

export type PreviewItem = {
  title: string;
  description: string;
  priority: string;
  due: string | null;
  subtasks: string[];
  tags: string[];
};

export type PreviewActionResult =
  | { ok: true; tasks: PreviewItem[]; warnings: string[] }
  | { ok: false; errors: Record<string, string>; message?: string };

const valuesSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

export async function previewTemplateAction(templateId: string, values: unknown): Promise<PreviewActionResult> {
  const user = await requireUser();
  const template = await getTemplate(user.id, templateId);
  if (!template) return { ok: false, errors: {}, message: "Không tìm thấy template" };
  const raw = valuesSchema.safeParse(values);
  if (!raw.success) return { ok: false, errors: {}, message: "Dữ liệu không hợp lệ" };
  const res = previewTemplate(template, raw.data, { tz: user.timezone });
  if (!res.ok) return res;
  return {
    ok: true,
    warnings: res.warnings,
    tasks: res.tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
      due: t.dueAt ? formatInTz(t.dueAt, user.timezone, "EEEE dd/MM/yyyy HH:mm") : null,
      subtasks: t.subtasks,
      tags: t.tags,
    })),
  };
}

export type RunActionResult = { ok: true; count: number } | { ok: false; errors: Record<string, string>; message?: string };

export async function runTemplateAction(templateId: string, values: unknown): Promise<RunActionResult> {
  const user = await requireUser();
  const raw = valuesSchema.safeParse(values);
  if (!raw.success) return { ok: false, errors: {}, message: "Dữ liệu không hợp lệ" };
  const res = await runTemplate(user.id, templateId, raw.data, { tz: user.timezone });
  if (!res) return { ok: false, errors: {}, message: "Không tìm thấy template" };
  if (!res.ok) return res;
  revalidatePath("/", "layout");
  return { ok: true, count: res.count };
}
