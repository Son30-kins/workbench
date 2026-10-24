import { formatDistanceStrict } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { PRIORITY_LABEL } from "@/core/priority";
import { formatInTz } from "@/core/time";
import type { Task } from "@/db/schema";
import { escapeHtml } from "@/lib/telegram-api";

const PRIORITY_ICON = { URGENT: "🔴", HIGH: "🟠", MEDIUM: "🔵", LOW: "⚪" } as const;

export type ReminderKind = "BEFORE_DUE" | "OVERDUE" | "SNOOZE";

/** Nội dung nhắc việc: tiêu đề cho thông báo trong app + HTML cho Telegram. */
export function reminderMessage(task: Task, kind: ReminderKind, tz: string, now: Date) {
  const due = task.dueAt;
  const dist = due ? formatDistanceStrict(due, now, { locale: vi }) : null;
  const dueText = due ? formatInTz(due, tz, "HH:mm EEEE dd/MM") : "không có hạn";

  const head =
    kind === "OVERDUE" ? "Quá hạn" : kind === "SNOOZE" ? "Nhắc lại" : "Sắp đến hạn";
  const when =
    !due ? "" : due > now ? `còn ${dist}` : `trễ ${dist}`;

  const title = `${head}: ${task.title}`;
  const body = due ? `Hạn ${dueText} (${when})` : "";

  const icon = kind === "OVERDUE" ? "🔴" : kind === "SNOOZE" ? "🔔" : "⏰";
  const html = [
    `${icon} <b>${head}</b>`,
    `<b>${escapeHtml(task.title)}</b>`,
    due ? `🗓 Hạn: ${escapeHtml(dueText)} — <i>${when}</i>` : null,
    `${PRIORITY_ICON[task.priority]} Ưu tiên: ${PRIORITY_LABEL[task.priority]}`,
    task.description ? `\n${escapeHtml(task.description.slice(0, 500))}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { title, body, html };
}

export function digestMessage(list: Task[], tz: string, now: Date) {
  const overdue = list.filter((t) => t.dueAt && t.dueAt < now);
  const today = list.filter((t) => t.dueAt && t.dueAt >= now);
  const line = (t: Task, fmt: string) =>
    `${PRIORITY_ICON[t.priority]} ${escapeHtml(t.title)} — <i>${formatInTz(t.dueAt!, tz, fmt)}</i>`;

  const parts = [`☀️ <b>Bản tin ${formatInTz(now, tz, "EEEE dd/MM")}</b>`];
  if (overdue.length) {
    parts.push("", `<b>Quá hạn (${overdue.length})</b>`, ...overdue.slice(0, 15).map((t) => line(t, "dd/MM HH:mm")));
  }
  if (today.length) {
    parts.push("", `<b>Hôm nay (${today.length})</b>`, ...today.slice(0, 15).map((t) => line(t, "HH:mm")));
  }
  const summary = [
    today.length ? `${today.length} việc đến hạn hôm nay` : null,
    overdue.length ? `${overdue.length} việc quá hạn` : null,
  ].filter(Boolean);
  const title = `Bản tin: ${summary.join(", ")}`;
  return { title, html: parts.join("\n") };
}
