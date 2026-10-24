import { z } from "zod";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ dạng HH:mm");
const offsets = z.array(z.number().int().min(1).max(60 * 24 * 30)).max(10);

export const userSettingsSchema = z.object({
  /** Nhắc trước hạn bao nhiêu phút, theo từng mức ưu tiên */
  reminderOffsets: z.object({
    URGENT: offsets,
    HIGH: offsets,
    MEDIUM: offsets,
    LOW: offsets,
  }),
  quietHours: z.object({ enabled: z.boolean(), start: hhmm, end: hhmm }),
  digest: z.object({ enabled: z.boolean(), time: hhmm }),
  overdueRepeatHours: z.number().int().min(1).max(24 * 7),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  reminderOffsets: {
    URGENT: [1440, 180, 60, 15],
    HIGH: [1440, 120],
    MEDIUM: [1440],
    LOW: [],
  },
  quietHours: { enabled: true, start: "22:00", end: "07:00" },
  digest: { enabled: true, time: "08:00" },
  overdueRepeatHours: 24,
};

/** Đọc settings từ DB; thiếu hoặc sai thì dùng mặc định. */
export function resolveUserSettings(raw: unknown): UserSettings {
  const parsed = userSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_USER_SETTINGS;
}

/** Các mốc nhắc có sẵn để chọn trong trang Cài đặt (phút). */
export const REMINDER_OFFSET_CHOICES = [
  { minutes: 10080, label: "1 tuần" },
  { minutes: 4320, label: "3 ngày" },
  { minutes: 2880, label: "2 ngày" },
  { minutes: 1440, label: "1 ngày" },
  { minutes: 720, label: "12 giờ" },
  { minutes: 360, label: "6 giờ" },
  { minutes: 180, label: "3 giờ" },
  { minutes: 120, label: "2 giờ" },
  { minutes: 60, label: "1 giờ" },
  { minutes: 30, label: "30 phút" },
  { minutes: 15, label: "15 phút" },
  { minutes: 5, label: "5 phút" },
] as const;

export function formatOffset(minutes: number): string {
  const choice = REMINDER_OFFSET_CHOICES.find((c) => c.minutes === minutes);
  if (choice) return choice.label;
  if (minutes % 1440 === 0) return `${minutes / 1440} ngày`;
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  return `${minutes} phút`;
}
