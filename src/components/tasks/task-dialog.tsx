"use client";

import { Plus, Trash, X } from "lucide-react";
import { createContext, use, useState, useTransition } from "react";
import { createTaskAction, deleteTaskAction, updateTaskAction, type TaskFormData } from "@/actions/tasks";
import { Modal } from "@/components/modal";
import { Button, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type PriorityValue, type StatusValue } from "@/core/priority";
import { formatInTz, toLocalInputValue } from "@/core/time";
import { cn } from "@/lib/cn";
import type { TaskDTO } from "./task-bits";

type DialogState = { mode: "new"; status: StatusValue } | { mode: "edit"; task: TaskDTO } | null;

const Ctx = createContext<{ openNew: (status?: StatusValue) => void; openEdit: (task: TaskDTO) => void } | null>(null);

export function useTaskDialog() {
  const ctx = use(Ctx);
  if (!ctx) throw new Error("useTaskDialog phải nằm trong TaskDialogProvider");
  return ctx;
}

export function TaskDialogProvider({ tz, children }: { tz: string; children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [version, setVersion] = useState(0);

  const open = (s: DialogState) => {
    setState(s);
    setVersion((v) => v + 1); // form mới mỗi lần mở
  };

  return (
    <Ctx value={{ openNew: (status = "TODO") => open({ mode: "new", status }), openEdit: (task) => open({ mode: "edit", task }) }}>
      {children}
      <Modal open={state !== null} onClose={() => setState(null)} title={state?.mode === "edit" ? "Chi tiết task" : "Tạo task mới"}>
        {state && <TaskForm key={version} state={state} tz={tz} onDone={() => setState(null)} />}
      </Modal>
    </Ctx>
  );
}

function TaskForm({ state, tz, onDone }: { state: NonNullable<DialogState>; tz: string; onDone: () => void }) {
  const task = state.mode === "edit" ? state.task : null;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [due, setDue] = useState(task?.dueAt ? toLocalInputValue(new Date(task.dueAt), tz) : "");
  const [priority, setPriority] = useState<PriorityValue>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<StatusValue>(task?.status ?? (state.mode === "new" ? state.status : "TODO"));
  const [tags, setTags] = useState((task?.tags ?? []).join(", "));
  const [subtasks, setSubtasks] = useState(task?.subtasks.map((s) => ({ title: s.title, done: s.done })) ?? []);
  const [newSub, setNewSub] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addSub() {
    if (!newSub.trim()) return;
    setSubtasks((s) => [...s, { title: newSub.trim(), done: false }]);
    setNewSub("");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const data: TaskFormData = {
      title,
      description,
      due,
      priority,
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      subtasks: newSub.trim() ? [...subtasks, { title: newSub.trim(), done: false }] : subtasks,
    };
    startTransition(async () => {
      const res = task ? await updateTaskAction(task.id, data) : await createTaskAction(data);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  function remove() {
    if (!task || !confirm(`Xoá task "${task.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteTaskAction(task.id);
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {error && <Notice tone="danger">{error}</Notice>}
      <Field label="Tiêu đề">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus placeholder="Việc cần làm" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hạn chót" hint={`Giờ theo múi giờ ${tz}`}>
          <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Trạng thái">
          <Select value={status} onChange={(e) => setStatus(e.target.value as StatusValue)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-[13px] font-semibold text-fg-2">Mức ưu tiên</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-pressed={priority === p}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-semibold transition",
                priority === p ? "border-transparent bg-primary text-on-primary" : "border-line-strong hover:bg-hover",
              )}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Mô tả">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} placeholder="Ghi chú thêm…" />
      </Field>

      <div className="space-y-2">
        <span className="text-[13px] font-semibold text-fg-2">
          Task con {subtasks.length > 0 && `(${subtasks.filter((s) => s.done).length}/${subtasks.length})`}
        </span>
        <ul className="space-y-1.5">
          {subtasks.map((s, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
              <input
                type="checkbox"
                checked={s.done}
                onChange={(e) => setSubtasks((all) => all.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))}
                className="h-4 w-4 accent-[var(--color-brand)]"
                aria-label={`Hoàn thành: ${s.title}`}
              />
              <span className={cn("flex-1 text-sm", s.done && "text-fg-2 line-through")}>{s.title}</span>
              <button
                type="button"
                onClick={() => setSubtasks((all) => all.filter((_, j) => j !== i))}
                aria-label="Xoá task con"
                className="text-fg-2 hover:text-danger"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSub();
              }
            }}
            placeholder="Thêm task con rồi nhấn Enter"
            maxLength={200}
          />
          <Button variant="secondary" onClick={addSub} aria-label="Thêm task con" className="px-4">
            <Plus size={16} />
          </Button>
        </div>
      </div>

      <Field label="Nhãn" hint="Cách nhau bằng dấu phẩy">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="công việc, cá nhân" />
      </Field>

      {task && (
        <p className="text-xs text-fg-2">
          Tạo lúc {formatInTz(new Date(task.createdAt), tz)}
          {task.templateName && ` · từ form mẫu "${task.templateName}"`}
          {task.completedAt && ` · hoàn thành ${formatInTz(new Date(task.completedAt), tz)}`}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        {task ? (
          <Button variant="danger" onClick={remove} disabled={pending}>
            <Trash size={16} /> Xoá
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDone} disabled={pending}>
            Huỷ
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Đang lưu…" : task ? "Lưu thay đổi" : "Tạo task"}
          </Button>
        </div>
      </div>
    </form>
  );
}
