"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { catReminderAction } from "@/actions/tasks";
import { WalkingCat } from "@/components/cats";
import { formatInTz } from "@/core/time";
import { useI18n } from "@/i18n/provider";

// Tuỳ chọn riêng từng thiết bị (localStorage): tắt mèo, và thời điểm sớm nhất mèo được ra lần sau.
const ENABLED_KEY = "workbench.cat.enabled";
const NEXT_AT_KEY = "workbench.cat.nextAt";

/** Phát sự kiện này (nút "Gọi mèo ra ngay" ở Cài đặt) để mèo ra ngay, bỏ qua lịch. */
export const CAT_EVENT = "workbench:cat";

const FIRST_CHECK_MS = 8_000; // sau khi mở app
const CHECK_EVERY_MS = 5 * 60_000;
const GAP_MS = 45 * 60_000; // giữa hai lần mèo ra
const NOTHING_MS = 30 * 60_000; // không có gì để nhắc → hỏi lại sau
const SNOOZE_MS = 2 * 3_600_000; // bấm "Để sau"
const STAY_MS = 25_000; // không ai bấm gì thì mèo tự đi
const OFFSTAGE_PX = 220; // ngoài mép phải màn hình

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
    // trình duyệt chặn bộ nhớ (chế độ riêng tư…) → mèo vẫn chạy, chỉ không nhớ tuỳ chọn
  }
}

export function isCatEnabled() {
  return read(ENABLED_KEY) !== "0";
}

export function setCatEnabled(on: boolean) {
  write(ENABLED_KEY, on ? "1" : "0");
}

type Phase = "hidden" | "entering" | "idle" | "leaving";
type Bubble = { text: string; taskId: string | null };

/** Mèo thỉnh thoảng đi vào góc dưới màn hình, nhắc task quá hạn / sắp đến hạn, rồi chạy đi. */
export function CatReminder({ tz }: { tz: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [x, setX] = useState(OFFSTAGE_PX);
  const [facingRight, setFacingRight] = useState(false);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const phaseRef = useRef<Phase>("hidden");
  const busy = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const appear = useCallback(
    async (force: boolean) => {
      if (busy.current || phaseRef.current !== "hidden") return;
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
        setBubble({ text, taskId: task?.id ?? null });
        setFacingRight(false);
        write(NEXT_AT_KEY, String(now + GAP_MS));
        if (reducedMotion) {
          setX(0);
          setPhase("idle");
        } else {
          setX(OFFSTAGE_PX);
          setPhase("entering");
        }
      } catch {
        // mạng lỗi / phiên hết hạn → lần sau thử lại
      } finally {
        busy.current = false;
      }
    },
    [locale, reducedMotion, t, tz],
  );

  // Đi vào: vẽ mèo ở ngoài màn hình trước, khung hình sau mới đổi vị trí để CSS transition chạy
  useEffect(() => {
    if (phase !== "entering") return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setX(0));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [phase]);

  const leave = useCallback(
    (snoozeMs?: number) => {
      if (snoozeMs) write(NEXT_AT_KEY, String(Date.now() + snoozeMs));
      if (reducedMotion) {
        setPhase("hidden");
        return;
      }
      setFacingRight(true);
      setPhase("leaving");
      setX(OFFSTAGE_PX);
    },
    [reducedMotion],
  );

  // Không ai để ý thì mèo tự đi
  useEffect(() => {
    if (phase !== "idle") return;
    const id = setTimeout(() => leave(), STAY_MS);
    return () => clearTimeout(id);
  }, [phase, leave]);

  // Lịch kiểm tra + sự kiện "gọi mèo"
  useEffect(() => {
    const tick = () => {
      if (!isCatEnabled() || document.visibilityState !== "visible" || document.querySelector("dialog[open]")) return;
      if (Date.now() < Number(read(NEXT_AT_KEY) ?? 0)) return;
      void appear(false);
    };
    const force = () => void appear(true);
    const first = setTimeout(tick, FIRST_CHECK_MS);
    const interval = setInterval(tick, CHECK_EVERY_MS);
    window.addEventListener(CAT_EVENT, force);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      window.removeEventListener(CAT_EVENT, force);
    };
  }, [appear]);

  if (phase === "hidden") return null;

  const walking = phase === "entering" || phase === "leaving";
  const c = t.catReminder;

  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-30 flex flex-col items-end md:right-8 md:bottom-6">
      {phase === "idle" && bubble && (
        <div
          role="status"
          className="cat-bubble pointer-events-auto relative mr-6 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-card p-4 pr-9 text-sm shadow-xl"
        >
          <p className="font-semibold leading-snug">{bubble.text}</p>
          <div className="mt-3 flex gap-2">
            {bubble.taskId && (
              <button
                type="button"
                onClick={() => {
                  router.push(`/?task=${bubble.taskId}`);
                  leave();
                }}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90"
              >
                {c.view}
              </button>
            )}
            <button
              type="button"
              onClick={() => leave(SNOOZE_MS)}
              className="rounded-full border border-line-strong px-4 py-1.5 text-xs font-semibold hover:bg-hover"
            >
              {c.later}
            </button>
          </div>
          <button
            type="button"
            onClick={() => leave()}
            aria-label={c.close}
            className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-fg-2 hover:bg-hover hover:text-fg"
          >
            <X size={14} />
          </button>
          {/* Đuôi bong bóng chỉ xuống mèo */}
          <span aria-hidden className="absolute -bottom-1.5 right-10 h-3 w-3 rotate-45 border-r border-b border-line bg-card" />
        </div>
      )}
      <div
        aria-hidden
        onTransitionEnd={(e) => {
          if (e.target !== e.currentTarget) return;
          if (phase === "entering") setPhase("idle");
          if (phase === "leaving") setPhase("hidden");
        }}
        style={{
          transform: `translateX(${x}px)`,
          transition: reducedMotion ? "none" : `transform ${phase === "leaving" ? "1.4s ease-in" : "2.4s linear"}`,
        }}
      >
        <div style={{ transform: facingRight ? "scaleX(-1)" : undefined }}>
          <WalkingCat walking={walking} className="w-28 drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
}
