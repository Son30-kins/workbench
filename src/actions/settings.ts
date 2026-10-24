"use server";

import { revalidatePath } from "next/cache";
import { userSettingsSchema } from "@/core/user-settings";
import { getEnv } from "@/lib/env";
import { escapeHtml, telegramGetMe, telegramSendMessage } from "@/lib/telegram-api";
import { markAllNotificationsRead } from "@/server/notifications";
import { getTelegramBotInfo } from "@/server/app-settings";
import { requireUser } from "@/server/session";
import { createLinkToken, getTelegramChannel, unlinkTelegram } from "@/server/telegram-link";
import { updateUserPreferences } from "@/server/users";

export type SimpleResult = { ok: true; message?: string } | { ok: false; error: string };

export async function savePreferencesAction(input: { timezone: string; settings: unknown }): Promise<SimpleResult> {
  const user = await requireUser();
  const settings = userSettingsSchema.safeParse(input.settings);
  if (!settings.success) return { ok: false, error: settings.error.issues[0]?.message ?? "Cài đặt không hợp lệ" };
  try {
    await updateUserPreferences(user.id, { timezone: input.timezone, settings: settings.data });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lưu không thành công" };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Đã lưu — lịch nhắc của các task đang mở đã được tính lại" };
}

async function botUsername(): Promise<string | null> {
  const info = await getTelegramBotInfo();
  if (info?.username) return info.username;
  const token = getEnv().TELEGRAM_BOT_TOKEN;
  return token ? ((await telegramGetMe(token))?.username ?? null) : null;
}

/** Tạo link t.me/<bot>?start=<mã> để người dùng bấm Start trong Telegram. */
export async function createTelegramLinkAction(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!getEnv().TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: "Bản cài này chưa cấu hình Telegram bot. Báo admin thêm TELEGRAM_BOT_TOKEN vào .env." };
  }
  const username = await botUsername();
  if (!username) return { ok: false, error: "Không kết nối được bot Telegram. Kiểm tra lại token." };
  const token = await createLinkToken(user.id);
  return { ok: true, url: `https://t.me/${username}?start=${token}` };
}

export async function unlinkTelegramAction(): Promise<SimpleResult> {
  const user = await requireUser();
  await unlinkTelegram(user.id);
  revalidatePath("/settings");
  return { ok: true };
}

export async function sendTelegramTestAction(): Promise<SimpleResult> {
  const user = await requireUser();
  const token = getEnv().TELEGRAM_BOT_TOKEN;
  const channel = await getTelegramChannel(user.id);
  if (!token || !channel?.chatId || !channel.enabled) return { ok: false, error: "Chưa kết nối Telegram" };
  const ok = await telegramSendMessage(
    token,
    channel.chatId,
    `🔔 <b>Tin nhắn thử</b>\nTài khoản <i>${escapeHtml(user.email)}</i> sẽ nhận nhắc việc tại đây.`,
  );
  return ok ? { ok: true, message: "Đã gửi — kiểm tra Telegram" } : { ok: false, error: "Gửi thất bại" };
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/", "layout");
}
