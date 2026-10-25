"use client";

import { BellRing, Ellipsis, ListChecks } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import { DueChip, PriorityBadge, ProgressBar, dueTone, type TaskDTO } from "./task-bits";

export function TaskCard({
  task,
  tz,
  now,
  onOpen,
  dragging,
}: {
  task: TaskDTO;
  tz: string;
  now: number;
  onOpen: () => void;
  dragging?: boolean;
}) {
  const { t } = useI18n();
  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  const subtitle = task.templateName ?? task.tags[0] ?? null;
  const tone = dueTone(task, now);

  return (
    <article
      className={cn(
        "group space-y-4 rounded-2xl border border-line bg-card p-5 transition",
        dragging ? "rotate-1 shadow-2xl ring-1 ring-line-strong" : "hover:border-line-strong",
        task.status === "DONE" && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <h3 className={cn("text-base font-bold leading-snug", task.status === "DONE" && "line-through decoration-fg-2/60")}>{task.title}</h3>
          {subtitle && <p className="mt-1 truncate text-sm text-fg-2">{subtitle}</p>}
        </button>
        <button
          type="button"
          onClick={onOpen}
          aria-label={t.task.openDetails}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line hover:bg-hover"
        >
          <Ellipsis size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {tone === "soon" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
            <BellRing size={13} /> {t.task.dueSoon}
          </span>
        )}
        {tone === "overdue" && <span className="text-xs font-semibold text-danger">{t.task.overdue}</span>}
      </div>

      {total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-fg-2">
              <ListChecks size={15} className="text-fg" /> {t.task.progress}
            </span>
            <span className="font-semibold">
              {done}/{total}
            </span>
          </div>
          <ProgressBar done={done} total={total} />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <DueChip task={task} tz={tz} now={now} />
        {task.tags.length > 0 && (
          <span className="truncate text-xs text-fg-2" title={task.tags.join(", ")}>
            #{task.tags.slice(0, 2).join(" #")}
          </span>
        )}
      </div>
    </article>
  );
}
