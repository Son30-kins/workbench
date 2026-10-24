import { and, eq, inArray, isNull, lte, ne, or } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationChannels, reminders, tasks, user } from "@/db/schema";
import { nextOverdueReminder } from "@/core/reminder-schedule";
import { localParts } from "@/core/time";
import { resolveUserSettings } from "@/core/user-settings";
import { addNotification } from "@/server/notifications";
import { digestTasks } from "@/server/tasks";
import type { Notifier } from "./bot";
import { digestMessage, reminderMessage } from "./messages";

const BATCH = 50;

async function telegramChatOf(userId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ chatId: notificationChannels.chatId })
    .from(notificationChannels)
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(notificationChannels.type, "TELEGRAM"),
        eq(notificationChannels.enabled, true),
      ),
    );
  return row?.chatId ?? null;
}

/**
 * Lấy các lần nhắc đã đến giờ và đánh dấu SENT ngay trong cùng transaction
 * (FOR UPDATE SKIP LOCKED) → mỗi lần nhắc chỉ được xử lý đúng 1 lần, kể cả khi chạy nhiều worker.
 */
export async function processDueReminders(notifier: Notifier | null, now = new Date()): Promise<number> {
  const db = getDb();
  const claimed = await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(reminders)
      .where(and(eq(reminders.status, "PENDING"), lte(reminders.fireAt, now)))
      .orderBy(reminders.fireAt)
      .limit(BATCH)
      .for("update", { skipLocked: true });
    if (rows.length) {
      await tx
        .update(reminders)
        .set({ status: "SENT", sentAt: now })
        .where(inArray(reminders.id, rows.map((r) => r.id)));
    }
    return rows;
  });

  for (const r of claimed) {
    try {
      const [row] = await db
        .select({ task: tasks, tz: user.timezone, settings: user.settings, banned: user.banned })
        .from(tasks)
        .innerJoin(user, eq(user.id, tasks.userId))
        .where(eq(tasks.id, r.taskId));
      if (!row || row.banned || row.task.status === "DONE" || row.task.status === "CANCELLED") continue;

      const msg = reminderMessage(row.task, r.kind, row.tz, now);
      await addNotification(db, { userId: r.userId, taskId: r.taskId, title: msg.title, body: msg.body });

      const chatId = notifier ? await telegramChatOf(r.userId) : null;
      if (notifier && chatId) {
        try {
          await notifier.send(chatId, msg.html, r.taskId);
        } catch (e) {
          await db.update(reminders).set({ lastError: (e as Error).message.slice(0, 500) }).where(eq(reminders.id, r.id));
        }
      }

      // Quá hạn → hẹn lần nhắc tiếp theo
      if (r.kind === "OVERDUE") {
        const settings = resolveUserSettings(row.settings);
        await db.insert(reminders).values({
          taskId: r.taskId,
          userId: r.userId,
          kind: "OVERDUE",
          fireAt: nextOverdueReminder(r.fireAt, settings, row.tz, now),
        });
      }
    } catch (e) {
      console.error(`Lỗi gửi nhắc ${r.id}:`, (e as Error).message);
      await db
        .update(reminders)
        .set({ status: "FAILED", lastError: (e as Error).message.slice(0, 500) })
        .where(eq(reminders.id, r.id));
    }
  }
  return claimed.length;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Bản tin buổi sáng: mỗi người dùng tối đa 1 lần/ngày theo giờ địa phương của họ. */
export async function processDigests(notifier: Notifier | null, now = new Date()): Promise<number> {
  const db = getDb();
  const users = await db
    .select({ id: user.id, timezone: user.timezone, settings: user.settings, lastDigestOn: user.lastDigestOn })
    .from(user)
    .where(eq(user.banned, false));

  let sent = 0;
  for (const u of users) {
    const settings = resolveUserSettings(u.settings);
    if (!settings.digest.enabled) continue;
    const local = localParts(now, u.timezone);
    if (local.minutesOfDay < toMinutes(settings.digest.time) || u.lastDigestOn === local.dateKey) continue;

    // Đánh dấu trước khi gửi → không gửi trùng nếu có nhiều worker
    const claimed = await db
      .update(user)
      .set({ lastDigestOn: local.dateKey })
      .where(and(eq(user.id, u.id), or(isNull(user.lastDigestOn), ne(user.lastDigestOn, local.dateKey))))
      .returning({ id: user.id });
    if (!claimed.length) continue;

    const list = await digestTasks(u.id, u.timezone, now);
    if (list.length === 0) continue;

    const msg = digestMessage(list, u.timezone, now);
    await addNotification(db, { userId: u.id, title: msg.title });
    const chatId = notifier ? await telegramChatOf(u.id) : null;
    if (notifier && chatId) {
      await notifier.send(chatId, msg.html).catch((e) => console.error("Lỗi gửi bản tin:", (e as Error).message));
    }
    sent++;
  }
  return sent;
}
