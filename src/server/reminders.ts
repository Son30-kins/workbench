// Dùng chung cho web và worker — không import "server-only".
import { and, eq, inArray } from "drizzle-orm";
import type { Db, Tx } from "@/db";
import { reminders, tasks, user } from "@/db/schema";
import { planReminders } from "@/core/reminder-schedule";
import { resolveUserSettings, type UserSettings } from "@/core/user-settings";
import type { PriorityValue, StatusValue } from "@/core/priority";

type TaskForReminders = {
  id: string;
  userId: string;
  dueAt: Date | null;
  priority: PriorityValue;
  status: StatusValue;
};

export async function loadUserReminderContext(db: Db | Tx, userId: string) {
  const [u] = await db
    .select({ timezone: user.timezone, settings: user.settings })
    .from(user)
    .where(eq(user.id, userId));
  return { tz: u?.timezone ?? "Asia/Ho_Chi_Minh", settings: resolveUserSettings(u?.settings) };
}

/** Xoá các lần nhắc chưa gửi rồi tính lại theo hạn + ưu tiên hiện tại của task. */
export async function rescheduleTaskReminders(
  db: Db | Tx,
  task: TaskForReminders,
  ctx?: { tz: string; settings: UserSettings },
  now = new Date(),
) {
  await db.delete(reminders).where(and(eq(reminders.taskId, task.id), eq(reminders.status, "PENDING")));
  if (task.status === "DONE" || task.status === "CANCELLED" || !task.dueAt) return;

  const { tz, settings } = ctx ?? (await loadUserReminderContext(db, task.userId));
  const planned = planReminders({ dueAt: task.dueAt, priority: task.priority, settings, tz, now });
  if (planned.length === 0) return;
  await db.insert(reminders).values(
    planned.map((p) => ({ taskId: task.id, userId: task.userId, kind: p.kind, fireAt: p.fireAt })),
  );
}

export async function cancelPendingReminders(db: Db | Tx, taskId: string) {
  await db.delete(reminders).where(and(eq(reminders.taskId, taskId), eq(reminders.status, "PENDING")));
}

/** Hoãn: thêm một lần nhắc vào `fireAt` (chỉ cho task đang mở của chính người dùng). */
export async function snoozeTask(db: Db | Tx, userId: string, taskId: string, fireAt: Date): Promise<boolean> {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), inArray(tasks.status, ["TODO", "IN_PROGRESS"])));
  if (!task) return false;
  await db.insert(reminders).values({ taskId, userId, kind: "SNOOZE", fireAt });
  return true;
}
