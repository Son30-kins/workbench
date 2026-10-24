import type { PriorityValue } from "./priority";
import { addLocalDays, fromLocal, localParts } from "./time";
import type { UserSettings } from "./user-settings";

export type PlannedReminder = { kind: "BEFORE_DUE" | "OVERDUE"; fireAt: Date };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Nếu `t` rơi vào giờ yên lặng thì trả về thời điểm giờ yên lặng kết thúc, ngược lại trả về null.
 * Hỗ trợ khung giờ qua nửa đêm (ví dụ 22:00 → 07:00).
 */
export function quietHoursEnd(t: Date, quiet: UserSettings["quietHours"], tz: string): Date | null {
  if (!quiet.enabled) return null;
  const start = toMinutes(quiet.start);
  const end = toMinutes(quiet.end);
  if (start === end) return null;
  const p = localParts(t, tz);
  const now = p.minutesOfDay;

  if (start < end) {
    // Khung trong ngày, ví dụ 12:00 → 13:30
    return now >= start && now < end ? fromLocal(p.dateKey, quiet.end, tz) : null;
  }
  // Khung qua nửa đêm
  if (now >= start) return fromLocal(localParts(addLocalDays(t, 1, tz), tz).dateKey, quiet.end, tz);
  if (now < end) return fromLocal(p.dateKey, quiet.end, tz);
  return null;
}

/** Thời điểm bắt đầu của khung giờ yên lặng chứa `t` (giả định `t` đang nằm trong khung). */
function quietHoursStart(t: Date, quiet: UserSettings["quietHours"], tz: string): Date {
  const start = toMinutes(quiet.start);
  const p = localParts(t, tz);
  if (p.minutesOfDay >= start) return fromLocal(p.dateKey, quiet.start, tz);
  return fromLocal(localParts(addLocalDays(t, -1, tz), tz).dateKey, quiet.start, tz);
}

/**
 * Dời một mốc nhắc ra khỏi giờ yên lặng:
 * - bình thường: dời tới lúc giờ yên lặng kết thúc
 * - nếu dời như vậy sẽ trễ hạn: nhắc sớm hơn, ngay trước khi giờ yên lặng bắt đầu
 * - nếu cả hai đều không được (đã qua): giữ nguyên
 */
export function avoidQuietHours(
  t: Date,
  opts: { quiet: UserSettings["quietHours"]; tz: string; now: Date; deadline?: Date | null },
): Date {
  const end = quietHoursEnd(t, opts.quiet, opts.tz);
  if (!end) return t;
  if (!opts.deadline || end < opts.deadline) return end;
  const before = new Date(quietHoursStart(t, opts.quiet, opts.tz).getTime() - 60_000);
  return before > opts.now ? before : t;
}

/** Tính các mốc nhắc cho một task. Task khẩn cấp bỏ qua giờ yên lặng. */
export function planReminders(input: {
  dueAt: Date | null;
  priority: PriorityValue;
  settings: UserSettings;
  tz: string;
  now: Date;
}): PlannedReminder[] {
  const { dueAt, priority, settings, tz, now } = input;
  if (!dueAt) return [];

  const result: PlannedReminder[] = [];
  const seen = new Set<number>();
  const add = (kind: PlannedReminder["kind"], fireAt: Date) => {
    if (fireAt <= now || seen.has(fireAt.getTime())) return;
    seen.add(fireAt.getTime());
    result.push({ kind, fireAt });
  };

  for (const minutes of settings.reminderOffsets[priority]) {
    let t = new Date(dueAt.getTime() - minutes * 60_000);
    if (priority !== "URGENT") {
      t = avoidQuietHours(t, { quiet: settings.quietHours, tz, now, deadline: dueAt });
    }
    add("BEFORE_DUE", t);
  }

  // Nhắc khi vừa quá hạn — đúng lúc hết hạn
  add("OVERDUE", dueAt);

  return result.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

/** Lần nhắc quá hạn tiếp theo (lặp lại), luôn tránh giờ yên lặng. */
export function nextOverdueReminder(
  lastFireAt: Date,
  settings: UserSettings,
  tz: string,
  now: Date,
): Date {
  let t = new Date(lastFireAt.getTime() + settings.overdueRepeatHours * 3_600_000);
  if (t <= now) t = new Date(now.getTime() + settings.overdueRepeatHours * 3_600_000);
  return avoidQuietHours(t, { quiet: settings.quietHours, tz, now });
}
