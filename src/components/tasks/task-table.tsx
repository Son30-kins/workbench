"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { moveTaskAction } from "@/actions/tasks";
import { STATUS_LABEL } from "@/core/priority";
import { cn } from "@/lib/cn";
import { DueChip, PriorityBadge, type TaskDTO } from "./task-bits";
import { useTaskDialog } from "./task-dialog";

export function TaskTable({ tasks, tz, now }: { tasks: TaskDTO[]; tz: string; now: number }) {
  const { openEdit } = useTaskDialog();
  const [pending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-fg-2">
        Không có task nào. Bấm “+ Task” hoặc “Điền form mẫu” để bắt đầu.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[13px] text-fg-2">
            <th className="w-12 px-4 py-3" aria-label="Hoàn thành" />
            <th className="px-4 py-3 font-semibold">Task</th>
            <th className="px-4 py-3 font-semibold">Ưu tiên</th>
            <th className="px-4 py-3 font-semibold">Hạn chót</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 font-semibold">Tiến độ</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const done = t.status === "DONE";
            const subDone = t.subtasks.filter((s) => s.done).length;
            return (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-hover">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => void (await moveTaskAction(t.id, done ? "TODO" : "DONE")))}
                    aria-label={done ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 transition",
                      done ? "border-success bg-success text-white" : "border-line-strong hover:border-success",
                    )}
                  >
                    {done && <Check size={14} strokeWidth={3} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => openEdit(t)} className="text-left">
                    <span className={cn("font-semibold", done && "text-fg-2 line-through")}>{t.title}</span>
                    {(t.templateName || t.tags.length > 0) && (
                      <span className="block text-xs text-fg-2">{t.templateName ?? `#${t.tags.join(" #")}`}</span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3">
                  <DueChip task={t} tz={tz} now={now} />
                </td>
                <td className="px-4 py-3 text-fg-2">{STATUS_LABEL[t.status]}</td>
                <td className="px-4 py-3 text-fg-2">{t.subtasks.length ? `${subDone}/${t.subtasks.length}` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
