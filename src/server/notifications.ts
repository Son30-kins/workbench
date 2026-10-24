// Thông báo trong app (chuông). Dùng chung cho web và worker.
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getDb, type Db, type Tx } from "@/db";
import { notifications } from "@/db/schema";

export async function addNotification(
  db: Db | Tx,
  n: { userId: string; taskId?: string | null; title: string; body?: string },
) {
  await db.insert(notifications).values({ userId: n.userId, taskId: n.taskId ?? null, title: n.title, body: n.body ?? "" });
}

export async function listNotifications(userId: string, limit = 15) {
  const db = getDb();
  const [items, [{ unread }]] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit),
    db
      .select({ unread: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ]);
  return { items, unread };
}

export async function markAllNotificationsRead(userId: string) {
  await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
