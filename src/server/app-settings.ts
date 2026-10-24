import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { getEnv } from "@/lib/env";

export type AccessPolicy = {
  allowedEmails: string[];
  allowedDomains: string[];
  registrationOpen: boolean;
};

const KEY_ACCESS = "access_policy";
export const KEY_TELEGRAM_BOT = "telegram_bot";

async function readSetting<T>(key: string): Promise<T | null> {
  const [row] = await getDb().select().from(appSettings).where(eq(appSettings.key, key));
  return (row?.value as T) ?? null;
}

async function writeSetting(key: string, value: unknown) {
  await getDb()
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

/** Chính sách đăng nhập: giá trị admin lưu trong DB, chưa lưu thì lấy từ .env. */
export async function getAccessPolicy(): Promise<AccessPolicy> {
  const saved = await readSetting<AccessPolicy>(KEY_ACCESS);
  if (saved) return saved;
  const env = getEnv();
  return { allowedEmails: env.ALLOWED_EMAILS, allowedDomains: env.ALLOWED_DOMAINS, registrationOpen: true };
}

export async function saveAccessPolicy(policy: AccessPolicy) {
  await writeSetting(KEY_ACCESS, policy);
}

export function isEmailAllowed(email: string, policy: AccessPolicy): boolean {
  const e = email.trim().toLowerCase();
  if (policy.allowedEmails.length === 0 && policy.allowedDomains.length === 0) return true;
  const domain = e.split("@")[1] ?? "";
  return policy.allowedEmails.includes(e) || policy.allowedDomains.includes(domain);
}

/** Tên bot Telegram — worker ghi lại khi khởi động (getMe). */
export async function getTelegramBotInfo(): Promise<{ username: string | null; updatedAt?: string } | null> {
  return readSetting(KEY_TELEGRAM_BOT);
}
