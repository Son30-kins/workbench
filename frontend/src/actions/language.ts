"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { apiSend, SESSION_COOKIE } from "@/server/api";

/** Đổi ngôn ngữ: ghi cookie (cả trang đăng nhập dùng được) + lưu vào tài khoản nếu đã đăng nhập (bot Telegram dùng). */
export async function changeLanguageAction(locale: string) {
  if (!isLocale(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (jar.get(SESSION_COOKIE)) await apiSend("PUT", "/api/me/language", { language: locale });
  revalidatePath("/", "layout");
}
