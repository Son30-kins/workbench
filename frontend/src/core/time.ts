import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import type { Locale } from "@/i18n/config";
import { getDateLocale } from "@/i18n";

/** Các thành phần ngày giờ của một thời điểm, theo múi giờ `tz`. */
export function localParts(instant: Date, tz: string) {
  const d = new TZDate(instant.getTime(), tz);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = d.getHours();
  const mm = d.getMinutes();
  return {
    y,
    m,
    d: day,
    hh,
    mm,
    minutesOfDay: hh * 60 + mm,
    dateKey: `${y}-${pad(m)}-${pad(day)}`,
  };
}

/** "2026-10-31" + "17:00" theo giờ địa phương `tz` → thời điểm (UTC). */
export function fromLocal(dateKey: string, time: string, tz: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, tz).getTime());
}

/** Giá trị của <input type="datetime-local"> ("YYYY-MM-DDTHH:mm") → thời điểm. */
export function parseLocalDateTime(value: string, tz: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  if (!match) return null;
  return fromLocal(match[1], match[2], tz);
}

/** Thời điểm → giá trị cho <input type="datetime-local">. */
export function toLocalInputValue(instant: Date, tz: string): string {
  const p = localParts(instant, tz);
  return `${p.dateKey}T${pad(p.hh)}:${pad(p.mm)}`;
}

/** Cộng `days` ngày theo lịch địa phương, giữ nguyên giờ trên đồng hồ. */
export function addLocalDays(instant: Date, days: number, tz: string): Date {
  const d = new TZDate(instant.getTime(), tz);
  d.setDate(d.getDate() + days);
  return new Date(d.getTime());
}

/** Đặt giờ "HH:mm" trên cùng ngày địa phương của `instant`. */
export function setLocalTime(instant: Date, time: string, tz: string): Date {
  return fromLocal(localParts(instant, tz).dateKey, time, tz);
}

export function startOfLocalDay(instant: Date, tz: string): Date {
  return setLocalTime(instant, "00:00", tz);
}

/** Định dạng theo múi giờ `tz`; tên thứ / tháng theo ngôn ngữ `locale`. Mẫu ngày lấy từ t.formats. */
export function formatInTz(instant: Date, tz: string, pattern: string, locale: Locale): string {
  return format(new TZDate(instant.getTime(), tz), pattern, { locale: getDateLocale(locale) });
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
