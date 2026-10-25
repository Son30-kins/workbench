"use client";

import { useMemo, useState, useTransition } from "react";
import { savePreferencesAction } from "@/actions/settings";
import { Button, Card, Field, Input, Notice, Select } from "@/components/ui";
import { PRIORITIES, PRIORITY_LABEL, type PriorityValue } from "@/core/priority";
import { REMINDER_OFFSET_CHOICES, type UserSettings } from "@/core/user-settings";
import { cn } from "@/lib/cn";

export function PreferencesForm({ timezone, settings }: { timezone: string; settings: UserSettings }) {
  const [tz, setTz] = useState(timezone);
  const [s, setS] = useState<UserSettings>(settings);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const zones = useMemo(() => {
    const list = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    return list.includes(timezone) ? list : [timezone, ...list];
  }, [timezone]);

  function toggleOffset(p: PriorityValue, minutes: number) {
    setS((cur) => {
      const has = cur.reminderOffsets[p].includes(minutes);
      const next = has ? cur.reminderOffsets[p].filter((m) => m !== minutes) : [...cur.reminderOffsets[p], minutes].sort((a, b) => b - a);
      return { ...cur, reminderOffsets: { ...cur.reminderOffsets, [p]: next.slice(0, 10) } };
    });
  }

  function save() {
    startTransition(async () => {
      const res = await savePreferencesAction({ timezone: tz, settings: s });
      setNotice(res.ok ? { tone: "success", text: res.message ?? "Đã lưu" } : { tone: "danger", text: res.error });
    });
  }

  return (
    <>
      <Card className="space-y-5 p-6">
        <div>
          <h2 className="text-lg font-bold">Lịch nhắc theo mức ưu tiên</h2>
          <p className="text-sm text-fg-2">Chọn các mốc nhắc trước hạn chót. Ngoài ra app luôn nhắc khi task vừa quá hạn.</p>
        </div>
        {PRIORITIES.map((p) => (
          <div key={p} className="space-y-2">
            <p className="text-sm font-semibold">{PRIORITY_LABEL[p]}</p>
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_OFFSET_CHOICES.map((c) => {
                const on = s.reminderOffsets[p].includes(c.minutes);
                return (
                  <button
                    key={c.minutes}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleOffset(p, c.minutes)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      on ? "border-transparent bg-primary text-on-primary" : "border-line-strong text-fg-2 hover:text-fg",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <Field label="Nhắc lại khi quá hạn mỗi" className="max-w-xs">
          <Select value={s.overdueRepeatHours} onChange={(e) => setS({ ...s, overdueRepeatHours: Number(e.target.value) })}>
            {[4, 8, 12, 24, 48].map((h) => (
              <option key={h} value={h}>
                {h} giờ
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="text-lg font-bold">Thời gian</h2>
        <Field label="Múi giờ" className="max-w-md">
          <Select value={tz} onChange={(e) => setTz(e.target.value)}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={s.quietHours.enabled}
              onChange={(e) => setS({ ...s, quietHours: { ...s.quietHours, enabled: e.target.checked } })}
              className="h-4 w-4"
            />
            Giờ yên lặng — không nhắc trong khoảng này (trừ task Khẩn cấp)
          </label>
          {s.quietHours.enabled && (
            <div className="flex max-w-sm gap-3">
              <Field label="Từ" className="flex-1">
                <Input type="time" value={s.quietHours.start} onChange={(e) => setS({ ...s, quietHours: { ...s.quietHours, start: e.target.value } })} />
              </Field>
              <Field label="Đến" className="flex-1">
                <Input type="time" value={s.quietHours.end} onChange={(e) => setS({ ...s, quietHours: { ...s.quietHours, end: e.target.value } })} />
              </Field>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={s.digest.enabled}
              onChange={(e) => setS({ ...s, digest: { ...s.digest, enabled: e.target.checked } })}
              className="h-4 w-4"
            />
            Bản tin buổi sáng — tóm tắt việc hôm nay và việc quá hạn
          </label>
          {s.digest.enabled && (
            <Field label="Gửi lúc" className="max-w-[10rem]">
              <Input type="time" value={s.digest.time} onChange={(e) => setS({ ...s, digest: { ...s.digest, time: e.target.value } })} />
            </Field>
          )}
        </div>
      </Card>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <div className="flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu cài đặt"}
        </Button>
      </div>
    </>
  );
}
