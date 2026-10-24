// Lớp truy cập dữ liệu task. MỌI hàm nhận userId và lọc theo userId — không có hàm nào
// đọc/sửa task chỉ bằng id. Dùng chung cho web, worker (bot Telegram) và test.
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type Db, type Tx } from "@/db";
import { subtasks, tasks, type Subtask, type Task } from "@/db/schema";
import { PRIORITIES, STATUSES, type StatusValue } from "@/core/priority";
import { addLocalDays, startOfLocalDay } from "@/core/time";
import { cancelPendingReminders, rescheduleTaskReminders } from "./reminders";

export type TaskWithSubtasks = Task & { subtasks: Subtask[] };

export const TASK_VIEWS = ["all", "today", "overdue", "week"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Nhập tiêu đề").max(200),
  description: z.string().max(5000).default(""),
  dueAt: z.date().nullable().default(null),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  status: z.enum(STATUSES).default("TODO"),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  subtasks: z
    .array(z.object({ title: z.string().trim().min(1).max(200), done: z.boolean().default(false) }))
    .max(50)
    .default([]),
});
export type TaskInput = z.input<typeof taskInputSchema>;

const ACTIVE: StatusValue[] = ["TODO", "IN_PROGRESS"];
const DONE_LIMIT = 50;

function viewCondition(view: TaskView, tz: string, now: Date) {
  const today = startOfLocalDay(now, tz);
  switch (view) {
    case "today":
      return and(gte(tasks.dueAt, today), lt(tasks.dueAt, addLocalDays(today, 1, tz)), ne(tasks.status, "CANCELLED"));
    case "overdue":
      return and(lt(tasks.dueAt, now), inArray(tasks.status, ACTIVE));
    case "week":
      return and(gte(tasks.dueAt, today), lt(tasks.dueAt, addLocalDays(today, 7, tz)), ne(tasks.status, "CANCELLED"));
    default:
      return ne(tasks.status, "CANCELLED");
  }
}

async function attachSubtasks(db: Db | Tx, rows: Task[]): Promise<TaskWithSubtasks[]> {
  if (rows.length === 0) return [];
  const subs = await db
    .select()
    .from(subtasks)
    .where(inArray(subtasks.taskId, rows.map((r) => r.id)))
    .orderBy(asc(subtasks.position));
  return rows.map((r) => ({ ...r, subtasks: subs.filter((s) => s.taskId === r.id) }));
}

export async function listTasks(
  userId: string,
  opts: { view?: TaskView; q?: string; tz: string; now?: Date; includeAllDone?: boolean },
  db: Db = getDb(),
): Promise<TaskWithSubtasks[]> {
  const now = opts.now ?? new Date();
  const conds = [eq(tasks.userId, userId), viewCondition(opts.view ?? "all", opts.tz, now)];
  const q = opts.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(tasks.title, pattern), ilike(tasks.description, pattern))!);
  }
  const order = [asc(tasks.priority), sql`${tasks.dueAt} asc nulls last`, desc(tasks.createdAt)];

  const active = await db
    .select()
    .from(tasks)
    .where(and(...conds, ne(tasks.status, "DONE")))
    .orderBy(...order);
  const done = await db
    .select()
    .from(tasks)
    .where(and(...conds, eq(tasks.status, "DONE")))
    .orderBy(desc(tasks.completedAt))
    .limit(opts.includeAllDone ? 1000 : DONE_LIMIT);
  return attachSubtasks(db, [...active, ...done]);
}

export async function getTask(userId: string, taskId: string, db: Db | Tx = getDb()): Promise<TaskWithSubtasks | null> {
  const [row] = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  if (!row) return null;
  const [withSubs] = await attachSubtasks(db, [row]);
  return withSubs;
}

/** Tạo task. Truyền `tx` để chạy trong transaction có sẵn (ví dụ khi tạo nhiều task từ template). */
export async function createTask(
  userId: string,
  input: TaskInput,
  extra: { templateRunId?: string; templateName?: string } = {},
  tx?: Tx,
): Promise<Task> {
  const data = taskInputSchema.parse(input);
  const run = async (tx: Tx) => {
    const [task] = await tx
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        description: data.description,
        dueAt: data.dueAt,
        priority: data.priority,
        status: data.status,
        tags: data.tags,
        completedAt: data.status === "DONE" ? new Date() : null,
        templateRunId: extra.templateRunId,
        templateName: extra.templateName,
      })
      .returning();
    if (data.subtasks.length) {
      await tx.insert(subtasks).values(data.subtasks.map((s, i) => ({ taskId: task.id, title: s.title, done: s.done, position: i })));
    }
    await rescheduleTaskReminders(tx, task);
    return task;
  };
  return tx ? run(tx) : getDb().transaction(run);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: TaskInput,
  db: Db = getDb(),
): Promise<Task | null> {
  const data = taskInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    if (!current) return null;
    const [task] = await tx
      .update(tasks)
      .set({
        title: data.title,
        description: data.description,
        dueAt: data.dueAt,
        priority: data.priority,
        status: data.status,
        tags: data.tags,
        completedAt: data.status === "DONE" ? (current.completedAt ?? new Date()) : null,
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    await tx.delete(subtasks).where(eq(subtasks.taskId, taskId));
    if (data.subtasks.length) {
      await tx.insert(subtasks).values(data.subtasks.map((s, i) => ({ taskId, title: s.title, done: s.done, position: i })));
    }
    const scheduleChanged =
      current.dueAt?.getTime() !== task.dueAt?.getTime() ||
      current.priority !== task.priority ||
      current.status !== task.status;
    if (scheduleChanged) await rescheduleTaskReminders(tx, task);
    return task;
  });
}

export async function setTaskStatus(
  userId: string,
  taskId: string,
  status: StatusValue,
  db: Db = getDb(),
): Promise<Task | null> {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    if (!current) return null;
    if (current.status === status) return current;
    const [task] = await tx
      .update(tasks)
      .set({ status, completedAt: status === "DONE" ? new Date() : null })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    if (status === "DONE" || status === "CANCELLED") await cancelPendingReminders(tx, taskId);
    else if (current.status === "DONE" || current.status === "CANCELLED") await rescheduleTaskReminders(tx, task);
    return task;
  });
}

export async function deleteTask(userId: string, taskId: string, db: Db = getDb()): Promise<boolean> {
  const rows = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });
  return rows.length > 0;
}

export async function toggleSubtask(userId: string, subtaskId: string, done: boolean, db: Db = getDb()) {
  // Chỉ sửa task con thuộc task của chính người dùng
  const owned = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId));
  const rows = await db
    .update(subtasks)
    .set({ done })
    .where(and(eq(subtasks.id, subtaskId), inArray(subtasks.taskId, owned)))
    .returning({ id: subtasks.id });
  return rows.length > 0;
}

/** Số lượng cho panel bộ lọc. */
export async function countTasks(userId: string, tz: string, now = new Date(), db: Db = getDb()) {
  const today = startOfLocalDay(now, tz);
  const tomorrow = addLocalDays(today, 1, tz);
  const week = addLocalDays(today, 7, tz);
  const [row] = await db
    .select({
      all: sql<number>`count(*) filter (where ${tasks.status} in ('TODO','IN_PROGRESS'))`.mapWith(Number),
      today: sql<number>`count(*) filter (where ${tasks.dueAt} >= ${today} and ${tasks.dueAt} < ${tomorrow} and ${tasks.status} in ('TODO','IN_PROGRESS'))`.mapWith(Number),
      overdue: sql<number>`count(*) filter (where ${tasks.dueAt} < ${now} and ${tasks.status} in ('TODO','IN_PROGRESS'))`.mapWith(Number),
      week: sql<number>`count(*) filter (where ${tasks.dueAt} >= ${today} and ${tasks.dueAt} < ${week} and ${tasks.status} in ('TODO','IN_PROGRESS'))`.mapWith(Number),
    })
    .from(tasks)
    .where(eq(tasks.userId, userId));
  return row;
}

/** Task cho bản tin buổi sáng / lệnh /today: quá hạn + đến hạn hôm nay, chưa xong. */
export async function digestTasks(userId: string, tz: string, now = new Date(), db: Db = getDb()) {
  const tomorrow = addLocalDays(startOfLocalDay(now, tz), 1, tz);
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.status, ACTIVE),
        isNotNull(tasks.dueAt),
        lt(tasks.dueAt, tomorrow),
      ),
    )
    .orderBy(asc(tasks.dueAt), asc(tasks.priority));
}
