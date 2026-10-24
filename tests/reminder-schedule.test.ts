import { describe, expect, it } from "vitest";
import { avoidQuietHours, nextOverdueReminder, planReminders, quietHoursEnd } from "@/core/reminder-schedule";
import { formatInTz } from "@/core/time";
import { DEFAULT_USER_SETTINGS, resolveUserSettings } from "@/core/user-settings";

const TZ = "Asia/Ho_Chi_Minh";
const vn = (s: string) => new Date(`${s}+07:00`);
const fmt = (d: Date) => formatInTz(d, TZ);
const quiet = DEFAULT_USER_SETTINGS.quietHours; // 22:00 → 07:00

describe("quietHoursEnd", () => {
  it("khung qua nửa đêm", () => {
    expect(fmt(quietHoursEnd(vn("2026-10-24T23:30"), quiet, TZ)!)).toBe("25/10/2026 07:00");
    expect(fmt(quietHoursEnd(vn("2026-10-25T03:00"), quiet, TZ)!)).toBe("25/10/2026 07:00");
    expect(quietHoursEnd(vn("2026-10-25T07:00"), quiet, TZ)).toBeNull();
    expect(quietHoursEnd(vn("2026-10-24T21:59"), quiet, TZ)).toBeNull();
  });

  it("khung trong ngày và khi tắt", () => {
    const lunch = { enabled: true, start: "12:00", end: "13:30" };
    expect(fmt(quietHoursEnd(vn("2026-10-24T12:15"), lunch, TZ)!)).toBe("24/10/2026 13:30");
    expect(quietHoursEnd(vn("2026-10-24T12:15"), { ...lunch, enabled: false }, TZ)).toBeNull();
  });
});

describe("avoidQuietHours", () => {
  const now = vn("2026-10-24T10:00");

  it("dời tới 07:00 nếu vẫn trước hạn", () => {
    const t = avoidQuietHours(vn("2026-10-24T23:00"), { quiet, tz: TZ, now, deadline: vn("2026-10-25T09:00") });
    expect(fmt(t)).toBe("25/10/2026 07:00");
  });

  it("dời tới 07:00 sẽ trễ hạn → nhắc sớm lúc 21:59 hôm trước", () => {
    const t = avoidQuietHours(vn("2026-10-25T05:00"), { quiet, tz: TZ, now, deadline: vn("2026-10-25T06:00") });
    expect(fmt(t)).toBe("24/10/2026 21:59");
  });
});

describe("planReminders", () => {
  const now = vn("2026-10-24T10:00");

  it("HIGH: 1 ngày + 2 giờ trước hạn, cộng mốc quá hạn", () => {
    const r = planReminders({ dueAt: vn("2026-10-26T17:00"), priority: "HIGH", settings: DEFAULT_USER_SETTINGS, tz: TZ, now });
    expect(r.map((x) => `${x.kind} ${fmt(x.fireAt)}`)).toEqual([
      "BEFORE_DUE 25/10/2026 17:00",
      "BEFORE_DUE 26/10/2026 15:00",
      "OVERDUE 26/10/2026 17:00",
    ]);
  });

  it("bỏ các mốc đã qua", () => {
    const r = planReminders({ dueAt: vn("2026-10-24T11:00"), priority: "URGENT", settings: DEFAULT_USER_SETTINGS, tz: TZ, now });
    expect(r.map((x) => fmt(x.fireAt))).toEqual(["24/10/2026 10:45", "24/10/2026 11:00"]);
  });

  it("URGENT bỏ qua giờ yên lặng, MEDIUM thì dời", () => {
    const due = vn("2026-10-26T08:00");
    const urgent = planReminders({ dueAt: due, priority: "URGENT", settings: DEFAULT_USER_SETTINGS, tz: TZ, now });
    expect(urgent.map((x) => fmt(x.fireAt))).toContain("26/10/2026 05:00");
    const medium = planReminders({
      dueAt: vn("2026-10-26T06:00"),
      priority: "MEDIUM",
      settings: DEFAULT_USER_SETTINGS,
      tz: TZ,
      now,
    });
    // 1 ngày trước = 25/10 06:00 (trong giờ yên lặng) → 07:00
    expect(fmt(medium[0].fireAt)).toBe("25/10/2026 07:00");
  });

  it("LOW không nhắc trước, không hạn thì không nhắc", () => {
    const low = planReminders({ dueAt: vn("2026-10-26T17:00"), priority: "LOW", settings: DEFAULT_USER_SETTINGS, tz: TZ, now });
    expect(low.map((x) => x.kind)).toEqual(["OVERDUE"]);
    expect(planReminders({ dueAt: null, priority: "HIGH", settings: DEFAULT_USER_SETTINGS, tz: TZ, now })).toEqual([]);
  });
});

describe("nextOverdueReminder", () => {
  it("lặp lại sau 24 giờ và tránh giờ yên lặng", () => {
    const now = vn("2026-10-24T23:00");
    expect(fmt(nextOverdueReminder(vn("2026-10-24T23:00"), DEFAULT_USER_SETTINGS, TZ, now))).toBe("26/10/2026 07:00");
  });
});

describe("resolveUserSettings", () => {
  it("dữ liệu sai → dùng mặc định", () => {
    expect(resolveUserSettings({ foo: 1 })).toEqual(DEFAULT_USER_SETTINGS);
    expect(resolveUserSettings(null)).toEqual(DEFAULT_USER_SETTINGS);
  });
});
