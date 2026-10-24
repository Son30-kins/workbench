import "server-only";
import { and, asc, count, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationChannels, session, tasks, user } from "@/db/schema";
import { userSettingsSchema, type UserSettings } from "@/core/user-settings";
import { isValidTimeZone } from "@/core/time";
import { rescheduleTaskReminders } from "./reminders";

/** Lưu múi giờ + cài đặt nhắc việc, rồi tính lại lịch nhắc cho các task đang mở. */
export async function updateUserPreferences(userId: string, input: { timezone: string; settings: UserSettings }) {
  if (!isValidTimeZone(input.timezone)) throw new Error("Múi giờ không hợp lệ");
  const settings = userSettingsSchema.parse(input.settings);
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(user).set({ timezone: input.timezone, settings }).where(eq(user.id, userId));
    const open = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.status, ["TODO", "IN_PROGRESS"]), isNotNull(tasks.dueAt)));
    for (const t of open) await rescheduleTaskReminders(tx, t, { tz: input.timezone, settings });
  });
}

// ===== Quản trị =====

export async function listUsersForAdmin() {
  const db = getDb();
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
      taskCount: sql<number>`(select count(*) from ${tasks} where ${tasks.userId} = ${user.id})`.mapWith(Number),
      telegram: sql<boolean>`exists (select 1 from ${notificationChannels} where ${notificationChannels.userId} = ${user.id} and ${notificationChannels.enabled})`,
    })
    .from(user)
    .orderBy(asc(user.createdAt));
}

export async function setUserBanned(adminId: string, targetId: string, banned: boolean) {
  if (adminId === targetId) throw new Error("Không thể tự khoá tài khoản của mình");
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.update(user).set({ banned }).where(eq(user.id, targetId));
    // Khoá → đăng xuất khỏi mọi thiết bị
    if (banned) await tx.delete(session).where(eq(session.userId, targetId));
  });
}

export async function setUserRole(adminId: string, targetId: string, role: "ADMIN" | "USER") {
  if (adminId === targetId) throw new Error("Không thể tự đổi quyền của mình");
  const db = getDb();
  if (role === "USER") {
    const [{ admins }] = await db
      .select({ admins: count() })
      .from(user)
      .where(and(eq(user.role, "ADMIN"), ne(user.id, targetId)));
    if (admins === 0) throw new Error("Cần ít nhất 1 admin");
  }
  await db.update(user).set({ role }).where(eq(user.id, targetId));
}
