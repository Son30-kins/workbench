// Liên kết tài khoản Telegram với người dùng. Dùng chung cho web (tạo mã) và bot (nhận mã).
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationChannels, user } from "@/db/schema";

const LINK_TTL_MS = 10 * 60_000;

export function hashLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Tạo mã liên kết dùng 1 lần (hết hạn sau 10 phút). Chỉ lưu bản băm. */
export async function createLinkToken(userId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  const values = {
    linkTokenHash: hashLinkToken(token),
    linkTokenExpiresAt: new Date(Date.now() + LINK_TTL_MS),
  };
  await getDb()
    .insert(notificationChannels)
    .values({ userId, type: "TELEGRAM", ...values })
    .onConflictDoUpdate({ target: [notificationChannels.userId, notificationChannels.type], set: values });
  return token;
}

/** Bot gọi khi người dùng bấm Start với mã. Trả về email của tài khoản vừa liên kết. */
export async function consumeLinkToken(
  token: string,
  chat: { chatId: string; username: string | null },
): Promise<{ email: string } | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const db = getDb();
  return db.transaction(async (tx) => {
    const [channel] = await tx
      .select()
      .from(notificationChannels)
      .where(
        and(
          eq(notificationChannels.linkTokenHash, hashLinkToken(token)),
          gt(notificationChannels.linkTokenExpiresAt, new Date()),
        ),
      )
      .for("update");
    if (!channel) return null;
    // Một chat Telegram chỉ gắn với một tài khoản
    await tx
      .update(notificationChannels)
      .set({ chatId: null, enabled: false })
      .where(and(eq(notificationChannels.chatId, chat.chatId), eq(notificationChannels.type, "TELEGRAM")));
    await tx
      .update(notificationChannels)
      .set({ chatId: chat.chatId, username: chat.username, enabled: true, linkTokenHash: null, linkTokenExpiresAt: null })
      .where(eq(notificationChannels.id, channel.id));
    const [u] = await tx.select({ email: user.email }).from(user).where(eq(user.id, channel.userId));
    return u ? { email: u.email } : null;
  });
}

export async function getTelegramChannel(userId: string) {
  const [row] = await getDb()
    .select()
    .from(notificationChannels)
    .where(and(eq(notificationChannels.userId, userId), eq(notificationChannels.type, "TELEGRAM")));
  return row ?? null;
}

export async function unlinkTelegram(userId: string) {
  await getDb()
    .update(notificationChannels)
    .set({ chatId: null, username: null, enabled: false, linkTokenHash: null, linkTokenExpiresAt: null })
    .where(and(eq(notificationChannels.userId, userId), eq(notificationChannels.type, "TELEGRAM")));
}

/** Tìm người dùng sở hữu một chat Telegram (bot dùng để kiểm tra quyền khi bấm nút). */
export async function findUserByChat(chatId: string) {
  const [row] = await getDb()
    .select({ userId: notificationChannels.userId, timezone: user.timezone, banned: user.banned })
    .from(notificationChannels)
    .innerJoin(user, eq(user.id, notificationChannels.userId))
    .where(
      and(
        eq(notificationChannels.chatId, chatId),
        eq(notificationChannels.type, "TELEGRAM"),
        eq(notificationChannels.enabled, true),
      ),
    );
  return row && !row.banned ? row : null;
}
