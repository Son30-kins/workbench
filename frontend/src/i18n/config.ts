// Cấu hình ngôn ngữ dùng chung cho server và client.

export const LOCALES = ["vi", "en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";

/** Cookie lưu ngôn ngữ đang chọn — API Spring cũng đọc cookie này (xem LocaleConfig). */
export const LOCALE_COOKIE = "WORKBENCH_LANG";

/** Tên ngôn ngữ viết bằng chính ngôn ngữ đó — để người không đọc được ngôn ngữ hiện tại vẫn tìm ra. */
export const LOCALE_NAMES: Record<Locale, string> = { vi: "Tiếng Việt", en: "English", de: "Deutsch" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Header Accept-Language ("de-DE,de;q=0.9,en;q=0.8") → ngôn ngữ app hỗ trợ có độ ưu tiên cao nhất. */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.map((x) => x.lang).find(isLocale) ?? DEFAULT_LOCALE;
}
