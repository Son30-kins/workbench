// Từ điển + locale của date-fns theo ngôn ngữ. Cả 3 bộ được nạp sẵn (vài KB) để client đổi ngôn ngữ tức thì.
import type { Locale as DateLocale } from "date-fns";
import { de as deDate } from "date-fns/locale/de";
import { enUS } from "date-fns/locale/en-US";
import { vi as viDate } from "date-fns/locale/vi";
import type { Locale } from "./config";
import { de } from "./messages/de";
import { en } from "./messages/en";
import { vi, type Messages } from "./messages/vi";

export type { Messages };

const MESSAGES: Record<Locale, Messages> = { vi, en, de };
const DATE_LOCALES: Record<Locale, DateLocale> = { vi: viDate, en: enUS, de: deDate };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export function getDateLocale(locale: Locale): DateLocale {
  return DATE_LOCALES[locale];
}
