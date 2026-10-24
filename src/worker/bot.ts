import { Bot, GrammyError, InlineKeyboard } from "grammy";
import { appSettings } from "@/db/schema";
import { getDb } from "@/db";
import { addLocalDays, fromLocal, localParts } from "@/core/time";
import { resolveUserSettings } from "@/core/user-settings";
import { escapeHtml, isPublicUrl } from "@/lib/telegram-api";
import { loadUserReminderContext, snoozeTask } from "@/server/reminders";
import { consumeLinkToken, findUserByChat } from "@/server/telegram-link";
import { digestTasks, setTaskStatus } from "@/server/tasks";
import { digestMessage } from "./messages";

export type Notifier = {
  send: (chatId: string, html: string, taskId?: string) => Promise<void>;
  stop: () => Promise<void>;
};

async function saveBotInfo(username: string | null) {
  const value = { username, updatedAt: new Date().toISOString() };
  await getDb()
    .insert(appSettings)
    .values({ key: "telegram_bot", value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

function taskKeyboard(taskId: string, appUrl: string) {
  const kb = new InlineKeyboard().text("✅ Xong", `done:${taskId}`).text("⏰ 1 giờ", `s1h:${taskId}`).text("📅 Mai", `stm:${taskId}`);
  if (isPublicUrl(appUrl)) kb.row().url("🔗 Mở trong app", `${appUrl.replace(/\/$/, "")}/?task=${taskId}`);
  return kb;
}

const HELP =
  "Bot nhắc việc của Workbench.\n\n" +
  "/today — việc hôm nay và việc quá hạn\n" +
  "/help — hướng dẫn\n\n" +
  "Để kết nối: mở app → Cài đặt → “Kết nối Telegram”.";

/** Khởi động bot (long polling — không cần tên miền public). Lỗi → trả về null, worker vẫn chạy. */
export async function startBot(token: string, appUrl: string): Promise<Notifier | null> {
  const bot = new Bot(token);

  try {
    const me = await bot.api.getMe();
    await saveBotInfo(me.username);
    console.log(`✓ Telegram bot @${me.username} đã kết nối`);
  } catch (e) {
    await saveBotInfo(null).catch(() => {});
    console.error("✋ Không kết nối được Telegram bot — kiểm tra TELEGRAM_BOT_TOKEN.", e instanceof GrammyError ? e.description : (e as Error).message);
    return null;
  }

  bot.command("start", async (ctx) => {
    const code = ctx.match?.trim();
    if (!code) return ctx.reply(HELP);
    const res = await consumeLinkToken(code, { chatId: String(ctx.chat.id), username: ctx.from?.username ?? null });
    return ctx.reply(
      res
        ? `✅ Đã kết nối với tài khoản ${res.email}. Bạn sẽ nhận nhắc việc tại đây.`
        : "❌ Mã kết nối không hợp lệ hoặc đã hết hạn. Tạo mã mới trong app → Cài đặt.",
    );
  });

  bot.command("help", (ctx) => ctx.reply(HELP));

  bot.command("today", async (ctx) => {
    const owner = await findUserByChat(String(ctx.chat.id));
    if (!owner) return ctx.reply("Chat này chưa kết nối tài khoản nào. Mở app → Cài đặt → “Kết nối Telegram”.");
    const now = new Date();
    const list = await digestTasks(owner.userId, owner.timezone, now);
    if (list.length === 0) return ctx.reply("🎉 Không có việc nào đến hạn hôm nay hoặc quá hạn.");
    return ctx.reply(digestMessage(list, owner.timezone, now).html, { parse_mode: "HTML" });
  });

  bot.on("callback_query:data", async (ctx) => {
    const [action, taskId] = ctx.callbackQuery.data.split(":");
    const chatId = String(ctx.chat?.id ?? ctx.from.id);
    const owner = await findUserByChat(chatId);
    if (!owner || !taskId) {
      return ctx.answerCallbackQuery({ text: "Chat này chưa kết nối tài khoản", show_alert: true });
    }

    if (action === "done") {
      const task = await setTaskStatus(owner.userId, taskId, "DONE");
      if (!task) return ctx.answerCallbackQuery({ text: "Không tìm thấy task", show_alert: true });
      await ctx.answerCallbackQuery({ text: "✅ Đã đánh dấu xong" });
      const original = ctx.callbackQuery.message && "text" in ctx.callbackQuery.message ? ctx.callbackQuery.message.text : "";
      await ctx
        .editMessageText(`${escapeHtml(original ?? "")}\n\n✅ <b>Đã xong</b>`, { parse_mode: "HTML" })
        .catch(() => ctx.editMessageReplyMarkup().catch(() => {}));
      return;
    }

    if (action === "s1h" || action === "stm") {
      const now = new Date();
      let fireAt = new Date(now.getTime() + 3_600_000);
      if (action === "stm") {
        const { tz, settings } = await loadUserReminderContext(getDb(), owner.userId);
        const tomorrow = localParts(addLocalDays(now, 1, tz), tz).dateKey;
        fireAt = fromLocal(tomorrow, resolveUserSettings(settings).digest.time, tz);
      }
      const ok = await snoozeTask(getDb(), owner.userId, taskId, fireAt);
      return ctx.answerCallbackQuery({
        text: ok ? (action === "s1h" ? "⏰ Sẽ nhắc lại sau 1 giờ" : "📅 Sẽ nhắc lại sáng mai") : "Task đã xong hoặc không còn tồn tại",
      });
    }

    return ctx.answerCallbackQuery();
  });

  bot.catch((err) => console.error("Lỗi xử lý tin nhắn Telegram:", err.error instanceof Error ? err.error.message : err.error));

  await bot.api
    .setMyCommands([
      { command: "today", description: "Việc hôm nay và quá hạn" },
      { command: "help", description: "Hướng dẫn" },
    ])
    .catch(() => {});

  // Không await: bot.start() chỉ kết thúc khi bot dừng
  void bot.start({ allowed_updates: ["message", "callback_query"] }).catch((e) => {
    console.error("✋ Telegram bot dừng:", e instanceof GrammyError ? e.description : (e as Error).message);
  });

  return {
    async send(chatId, html, taskId) {
      await bot.api.sendMessage(chatId, html, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: taskId ? taskKeyboard(taskId, appUrl) : undefined,
      });
    },
    async stop() {
      await bot.stop();
    },
  };
}
