// Ngôn ngữ phía server (Server Component, Server Action).
import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/server/session";
import { isLocale, type Locale } from "./config";
import { getMessages } from "./index";
import { requestLocale } from "./request";

export { requestLocale };

/** Ngôn ngữ để hiển thị: đã đăng nhập → ngôn ngữ của tài khoản; chưa → theo request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getCurrentUser();
  return user && isLocale(user.language) ? user.language : requestLocale();
});

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getMessages(locale) };
}
