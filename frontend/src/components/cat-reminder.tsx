"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { catReminderAction } from "@/actions/tasks";
import { SittingKitten } from "@/components/kitten";
import { formatInTz } from "@/core/time";
import { useI18n } from "@/i18n/provider";

// Tuỳ chọn riêng từng thiết bị (localStorage): tắt mèo, và thời điểm sớm nhất mèo được hiện lần sau.
const ENABLED_KEY = "workbench.cat.enabled";
const NEXT_AT_KEY = "workbench.cat.nextAt";

/** Phát sự kiện này (nút "Gọi mèo ra ngay" ở Cài đặt) để mèo hiện ngay, bỏ qua lịch. */
export const CAT_EVENT = "workbench:cat";

const FIRST_CHECK_MS = 8_000; // sau khi mở app
const CHECK_EVERY_MS = 5 * 60_000;
const GAP_MS = 45 * 60_000; // giữa hai lần mèo hiện
const NOTHING_MS = 30 * 60_000; // không có gì để nhắc → hỏi lại sau
const SNOOZE_MS = 2 * 3_600_000; // bấm "Để sau"
const STAY_MS = 25_000; // không ai bấm gì thì thẻ tự ẩn

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // trình duyệt chặn bộ nhớ (chế độ riêng tư…) → mèo vẫn hiện, chỉ không nhớ tuỳ chọn
  }
}

export function isCatEnabled() {
  return read(ENABLED_KEY) !== "0";
}

export function setCatEnabled(on: boolean) {
  write(ENABLED_KEY, on ? "1" : "0");
}

type Reminder = { text: string; taskId: string | null };

/** Thỉnh thoảng hiện thẻ có hình mèo ở góc dưới màn hình, nhắc task quá hạn / sắp đến hạn. */
export function CatReminder({ tz }: { tz: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const visible = useRef(false);
  const busy = useRef(false);

  useEffect(() => {
    visible.current = reminder !== null;
  }, [reminder]);

  const show = useCallback(
    async (force: boolean) => {
      if (busy.current || visible.current) return;
      busy.current = true;
      try {
        const data = await catReminderAction();
        const now = Date.now();
        const task = data.task;
        if (!task && !force) {
          write(NEXT_AT_KEY, String(now + NOTHING_MS));
          return;
        }
        const c = t.catReminder;
        const text = !task
          ? c.allClear
          : task.overdue
            ? data.overdueCount > 1
              ? c.overdueMany(data.overdueCount, task.title)
              : c.overdueOne(task.title)
            : c.soon(task.title, formatInTz(new Date(task.dueAt), tz, t.formats.shortDateTime, locale));
        write(NEXT_AT_KEY, String(now + GAP_MS));
        setReminder({ text, taskId: task?.id ?? null });
      } catch {
        // mạng lỗi / phiên hết hạn → lần sau thử lại
      } finally {
        busy.current = false;
      }
    },
    [locale, t, tz],
  );

  const hide = useCallback((snoozeMs?: number) => {
    if (snoozeMs) write(NEXT_AT_KEY, String(Date.now() + snoozeMs));
    setReminder(null);
  }, []);

  // Không ai để ý thì thẻ tự ẩn
  useEffect(() => {
    if (!reminder) return;
    const id = setTimeout(() => hide(), STAY_MS);
    return () => clearTimeout(id);
  }, [reminder, hide]);

  // Lịch kiểm tra + sự kiện "gọi mèo"
  useEffect(() => {
    const tick = () => {
      if (!isCatEnabled() || document.visibilityState !== "visible" || document.querySelector("dialog[open]")) return;
      if (Date.now() < Number(read(NEXT_AT_KEY) ?? 0)) return;
      void show(false);
    };
    const force = () => void show(true);
    const first = setTimeout(tick, FIRST_CHECK_MS);
    const interval = setInterval(tick, CHECK_EVERY_MS);
    window.addEventListener(CAT_EVENT, force);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      window.removeEventListener(CAT_EVENT, force);
    };
  }, [show]);

  if (!reminder) return null;
  const c = t.catReminder;

  return (
    <div
      role="status"
      aria-label={c.label}
      className="cat-bubble fixed right-4 bottom-20 z-30 flex w-[22rem] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-line bg-card p-3 pr-9 shadow-xl md:right-8 md:bottom-6"
    >
      <SittingKitten className="w-20 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{reminder.text}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reminder.taskId && (
            <button
              type="button"
              onClick={() => {
                router.push(`/?task=${reminder.taskId}`);
                hide();
              }}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90"
            >
              {c.view}
            </button>
          )}
          <button
            type="button"
            onClick={() => hide(SNOOZE_MS)}
            className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-semibold hover:bg-hover"
          >
            {c.later}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => hide()}
        aria-label={c.close}
        className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-fg-2 hover:bg-hover hover:text-fg"
      >
        <X size={14} />
      </button>
    </div>
  );
}
