import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { isLocale, LOCALE_COOKIE, matchLocale, type Locale } from "./config";

/** Ngôn ngữ theo request: cookie WORKBENCH_LANG → Accept-Language của trình duyệt → tiếng Việt. Không gọi API. */
export const requestLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return matchLocale((await headers()).get("accept-language"));
});
