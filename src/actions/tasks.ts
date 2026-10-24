"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PRIORITIES, STATUSES } from "@/core/priority";
import { parseLocalDateTime } from "@/core/time";
import { requireUser } from "@/server/session";
import { createTask, deleteTask, setTaskStatus, toggleSubtask, updateTask } from "@/server/tasks";

export type ActionResult = { ok: true } | { ok: false; error: string };

const formSchema = z.object({
  title: z.string(),
  description: z.string().default(""),
  due: z.string().default(""), // "YYYY-MM-DDTHH:mm" theo giờ của người dùng, hoặc ""
  priority: z.enum(PRIORITIES),
  status: z.enum(STATUSES),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.object({ title: z.string(), done: z.boolean() })).default([]),
});
export type TaskFormData = z.input<typeof formSchema>;

function toInput(data: TaskFormData, tz: string) {
  const f = formSchema.parse(data);
  return {
    title: f.title,
    description: f.description,
    dueAt: f.due ? parseLocalDateTime(f.due, tz) : null,
    priority: f.priority,
    status: f.status,
    tags: f.tags.map((t) => t.trim()).filter(Boolean),
    subtasks: f.subtasks.filter((s) => s.title.trim()),
  };
}

function fail(e: unknown): ActionResult {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  console.error(e);
  return { ok: false, error: "Có lỗi xảy ra, thử lại sau" };
}

export async function createTaskAction(data: TaskFormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await createTask(user.id, toInput(data, user.timezone));
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTaskAction(taskId: string, data: TaskFormData): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const task = await updateTask(user.id, taskId, toInput(data, user.timezone));
    if (!task) return { ok: false, error: "Không tìm thấy task" };
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function moveTaskAction(taskId: string, status: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.enum(STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Trạng thái không hợp lệ" };
  const task = await setTaskStatus(user.id, taskId, parsed.data);
  if (!task) return { ok: false, error: "Không tìm thấy task" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await deleteTask(user.id, taskId))) return { ok: false, error: "Không tìm thấy task" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleSubtaskAction(subtaskId: string, done: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await toggleSubtask(user.id, subtaskId, done))) return { ok: false, error: "Không tìm thấy" };
  revalidatePath("/", "layout");
  return { ok: true };
}
