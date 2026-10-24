import { z } from "zod";

const csv = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const schema = z.object({
  DATABASE_URL: z.string().min(1, "bắt buộc"),
  APP_URL: z.url("phải là URL, ví dụ http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "cần ít nhất 32 ký tự (openssl rand -base64 32)"),
  GOOGLE_CLIENT_ID: z.string().min(1, "bắt buộc"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "bắt buộc"),
  TELEGRAM_BOT_TOKEN: optional,
  ALLOWED_EMAILS: csv,
  ALLOWED_DOMAINS: csv,
  TZ: z.string().default("Asia/Ho_Chi_Minh"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Đọc & kiểm tra biến môi trường lúc chạy (không phải lúc build — image Docker
 * được build mà không có bí mật nào). Thông báo lỗi chỉ nêu TÊN biến, không in giá trị.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Cấu hình .env không hợp lệ:\n${lines.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}

/** Chỉ cần DATABASE_URL — dùng cho worker/migrate khi kiểm tra từng phần. */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu biến môi trường DATABASE_URL");
  return url;
}
