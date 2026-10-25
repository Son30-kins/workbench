"use client";

import { Flag } from "lucide-react";
import { PRIORITY_RANK, type PriorityValue } from "@/core/priority";
import { formatInTz } from "@/core/time";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";

export type TaskDTO = Task;

const PRIORITY_STYLE: Record<PriorityValue, string> = {
  URGENT: "bg-urgent/10 text-urgent",
  HIGH: "bg-warning/15 text-[#c96d12] dark:text-warning",
  MEDIUM: "bg-calm/10 text-calm",
  LOW: "bg-muted/15 text-muted",
};

export function PriorityBadge({ priority, className }: { priority: PriorityValue; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", PRIORITY_STYLE[priority], className)}>
      <Flag size={12} strokeWidth={2.4} />
      {t.priority[priority]}
    </span>
  );
}

export type DueTone = "normal" | "soon" | "overdue" | "done";

export function dueTone(task: Pick<Task, "dueAt" | "status">, now: number): DueTone {
  if (task.status === "DONE" || task.status === "CANCELLED") return "done";
  if (!task.dueAt) return "normal";
  const diff = new Date(task.dueAt).getTime() - now;
  if (diff < 0) return "overdue";
  if (diff < 24 * 3_600_000) return "soon";
  return "normal";
}

const DUE_STYLE: Record<DueTone, string> = {
  normal: "bg-muted/10 text-muted",
  done: "bg-muted/10 text-muted",
  soon: "bg-warning/10 text-warning",
  overdue: "bg-danger/10 text-danger",
};

export function DueChip({ task, tz, now }: { task: Pick<Task, "dueAt" | "status">; tz: string; now: number }) {
  const { locale, t } = useI18n();
  if (!task.dueAt) return <span className="rounded-full bg-muted/10 px-4 py-2 text-[13px] font-medium text-muted">{t.task.noDue}</span>;
  const tone = dueTone(task, now);
  const due = new Date(task.dueAt);
  return (
    <span
      className={cn("rounded-full px-4 py-2 text-[13px] font-medium", DUE_STYLE[tone])}
      title={tone === "overdue" ? t.task.overdueTitle : tone === "soon" ? t.task.soonTitle : undefined}
    >
      {formatInTz(due, tz, t.formats.shortDateTime, locale)}
    </span>
  );
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="h-1 rounded-full bg-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-1 rounded-full transition-all", pct === 100 ? "bg-success" : "bg-brand")} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Sắp xếp giống server: ưu tiên → hạn gần → mới tạo. */
export function compareTasks(a: TaskDTO, b: TaskDTO) {
  if (a.status === "DONE" && b.status === "DONE") {
    return new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime();
  }
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p) return p;
  const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
  const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
  if (ad !== bd) return ad - bd;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
