"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { moveTaskAction } from "@/actions/tasks";
import { BOARD_STATUSES, STATUS_LABEL, type StatusValue } from "@/core/priority";
import { cn } from "@/lib/cn";
import { compareTasks, type TaskDTO } from "./task-bits";
import { TaskCard } from "./task-card";
import { useTaskDialog } from "./task-dialog";

export function Board({ tasks, tz, now, openTask }: { tasks: TaskDTO[]; tz: string; now: number; openTask?: TaskDTO | null }) {
  const [items, setItems] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { openEdit, openNew } = useTaskDialog();

  // Dữ liệu mới từ server (sau khi lưu / tự làm mới) thay cho bản lạc quan
  // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ props → state cục bộ cho kéo thả
  useEffect(() => setItems(tasks), [tasks]);

  // Mở task từ link thông báo / Telegram (?task=<id>)
  const openTaskId = openTask?.id;
  useEffect(() => {
    if (openTask) openEdit(openTask);
    // chỉ chạy khi id thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const map = Object.fromEntries(BOARD_STATUSES.map((s) => [s, [] as TaskDTO[]])) as Record<StatusValue, TaskDTO[]>;
    for (const t of items) map[t.status]?.push(t);
    for (const s of BOARD_STATUSES) map[s].sort(compareTasks);
    return map;
  }, [items]);

  const active = activeId ? items.find((t) => t.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const to = e.over?.id as StatusValue | undefined;
    const task = items.find((t) => t.id === id);
    if (!task || !to || task.status === to) return;

    const previous = items;
    setItems((all) =>
      all.map((t) => (t.id === id ? { ...t, status: to, completedAt: to === "DONE" ? new Date() : null } : t)),
    );
    startTransition(async () => {
      const res = await moveTaskAction(id, to);
      if (!res.ok) {
        setItems(previous);
        setError(res.error);
      }
    });
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid gap-5 lg:grid-cols-3">
          {BOARD_STATUSES.map((status) => (
            <Column key={status} status={status} count={columns[status].length} onAdd={() => openNew(status)}>
              {columns[status].map((t) => (
                <DraggableCard key={t.id} task={t} hidden={t.id === activeId}>
                  <TaskCard task={t} tz={tz} now={now} onOpen={() => openEdit(t)} />
                </DraggableCard>
              ))}
            </Column>
          ))}
        </div>
        <DragOverlay>{active ? <TaskCard task={active} tz={tz} now={now} onOpen={() => {}} dragging /> : null}</DragOverlay>
      </DndContext>
    </>
  );
}

function Column({
  status,
  count,
  onAdd,
  children,
}: {
  status: StatusValue;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABEL[status]}
      className={cn(
        "flex min-h-[420px] flex-col rounded-2xl border border-dashed border-line-strong bg-column p-4 transition",
        isOver && "border-brand bg-brand/5",
      )}
    >
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-fg-2">
          {STATUS_LABEL[status]} ({count})
        </h2>
        <button type="button" onClick={onAdd} className="flex items-center gap-1.5 text-sm font-semibold hover:text-brand">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-hover">
            <Plus size={12} />
          </span>
          Thêm task
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        {children}
        <div
          className={cn(
            "min-h-24 flex-1 items-center justify-center rounded-2xl border border-dashed border-line-strong text-sm text-fg-2",
            count > 0 ? "hidden lg:flex" : "flex",
          )}
        >
          Kéo task vào đây…
        </div>
      </div>
    </section>
  );
}

function DraggableCard({ task, hidden, children }: { task: TaskDTO; hidden: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-manipulation", hidden && "opacity-30")}>
      {children}
    </div>
  );
}
