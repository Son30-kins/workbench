// Worker: gửi nhắc việc, bản tin buổi sáng và chạy bot Telegram.
// Chạy riêng với web: `node dist/worker.mjs` (Docker) hoặc `npm run worker` (dev).
import { closeDb } from "@/db";
import { getEnv } from "@/lib/env";
import { startBot, type Notifier } from "./bot";
import { processDigests, processDueReminders } from "./jobs";

const TICK_MS = 30_000;

async function main() {
  let env;
  try {
    env = getEnv();
  } catch (e) {
    console.error(`✋ ${(e as Error).message}`);
    process.exit(1);
  }

  let notifier: Notifier | null = null;
  if (env.TELEGRAM_BOT_TOKEN) {
    notifier = await startBot(env.TELEGRAM_BOT_TOKEN, env.APP_URL);
  } else {
    console.warn("⚠ Chưa có TELEGRAM_BOT_TOKEN — nhắc việc chỉ hiện trong app (chuông thông báo).");
  }

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const reminders = await processDueReminders(notifier);
      const digests = await processDigests(notifier);
      if (reminders || digests) console.log(`Đã gửi ${reminders} nhắc việc, ${digests} bản tin`);
    } catch (e) {
      console.error("Lỗi vòng xử lý:", (e as Error).message);
    } finally {
      running = false;
    }
  };

  await tick();
  const timer = setInterval(tick, TICK_MS);
  console.log(`✓ Worker đang chạy (kiểm tra mỗi ${TICK_MS / 1000} giây)`);

  const shutdown = async (signal: string) => {
    console.log(`Nhận ${signal}, đang dừng worker…`);
    clearInterval(timer);
    await notifier?.stop().catch(() => {});
    await closeDb();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

void main();
