import { z } from "zod";
import { PRIORITIES } from "./priority";

export const FIELD_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "DATE", "DATETIME", "SELECT", "CHECKBOX"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Chữ (1 dòng)",
  TEXTAREA: "Chữ (nhiều dòng)",
  NUMBER: "Số",
  DATE: "Ngày",
  DATETIME: "Ngày + giờ",
  SELECT: "Danh sách chọn",
  CHECKBOX: "Có / Không",
};

/** Mốc hạn chót = lúc điền form */
export const ANCHOR_SUBMITTED = "__submitted__";

/** Biến có sẵn, dùng được trong mọi template */
export const BUILTIN_VARIABLES = {
  today: "Ngày điền form (dd/MM/yyyy)",
  week: "Số tuần trong năm",
  month: "Tháng",
  year: "Năm",
} as const;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ dạng HH:mm");

export const templateFieldSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,39}$/, "Mã trường: chữ thường không dấu, số, gạch dưới; bắt đầu bằng chữ"),
  label: z.string().trim().min(1, "Nhập tên trường").max(80),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  defaultValue: z.string().max(500).default(""),
});

export const templateRuleSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().trim().min(1, "Nhập tiêu đề task").max(200),
  description: z.string().max(5000).default(""),
  priority: z.enum(PRIORITIES),
  due: z.object({
    /** null = không có hạn; ANCHOR_SUBMITTED; hoặc mã của một trường DATE/DATETIME */
    anchor: z.string().nullable(),
    offsetDays: z.number().int().min(-365).max(365).default(0),
    offsetHours: z.number().int().min(-23).max(23).default(0),
    time: hhmm.nullable().default(null),
  }),
  /** Chỉ tạo task này khi trường `field` có giá trị (checkbox được tick) hoặc bằng `equals` */
  condition: z
    .object({ field: z.string().min(1), equals: z.string().max(80).default("") })
    .nullable()
    .default(null),
  subtasks: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export type TemplateField = z.infer<typeof templateFieldSchema>;
export type TemplateRule = z.infer<typeof templateRuleSchema>;

const VARIABLE_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function extractVariables(text: string): string[] {
  return [...text.matchAll(VARIABLE_RE)].map((m) => m[1]);
}

export const templateInputSchema = z
  .object({
    name: z.string().trim().min(1, "Nhập tên template").max(100),
    description: z.string().trim().max(1000).default(""),
    fields: z.array(templateFieldSchema).max(30),
    rules: z.array(templateRuleSchema).min(1, "Cần ít nhất 1 task").max(30),
  })
  .superRefine((t, ctx) => {
    const keys = new Map<string, TemplateField>();
    t.fields.forEach((f, i) => {
      if (keys.has(f.key)) {
        ctx.addIssue({ code: "custom", path: ["fields", i, "key"], message: `Mã "${f.key}" bị trùng` });
      }
      if (f.key in BUILTIN_VARIABLES) {
        ctx.addIssue({ code: "custom", path: ["fields", i, "key"], message: `"${f.key}" là biến có sẵn, đặt mã khác` });
      }
      if (f.type === "SELECT" && f.options.length === 0) {
        ctx.addIssue({ code: "custom", path: ["fields", i, "options"], message: "Danh sách chọn cần ít nhất 1 lựa chọn" });
      }
      keys.set(f.key, f);
    });

    t.rules.forEach((r, i) => {
      const anchor = r.due.anchor;
      if (anchor && anchor !== ANCHOR_SUBMITTED) {
        const f = keys.get(anchor);
        if (!f || (f.type !== "DATE" && f.type !== "DATETIME")) {
          ctx.addIssue({ code: "custom", path: ["rules", i, "due", "anchor"], message: "Mốc hạn phải là trường kiểu Ngày" });
        }
      }
      if (r.condition && !keys.has(r.condition.field)) {
        ctx.addIssue({ code: "custom", path: ["rules", i, "condition"], message: "Điều kiện dùng trường không tồn tại" });
      }
      const texts = [r.title, r.description, ...r.subtasks, ...r.tags];
      for (const v of texts.flatMap(extractVariables)) {
        if (!keys.has(v) && !(v in BUILTIN_VARIABLES)) {
          ctx.addIssue({ code: "custom", path: ["rules", i, "title"], message: `Biến {{${v}}} không có trong form` });
        }
      }
    });
  });

export type TemplateInput = z.infer<typeof templateInputSchema>;
