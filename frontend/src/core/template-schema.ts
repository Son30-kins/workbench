import { z } from "zod";
import { PRIORITIES } from "./priority";

export const FIELD_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "DATE", "DATETIME", "SELECT", "CHECKBOX"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/** Mốc hạn chót = lúc điền form */
export const ANCHOR_SUBMITTED = "__submitted__";

/** Biến có sẵn, dùng được trong mọi template (mô tả theo ngôn ngữ: t.builtinVariables) */
export const BUILTIN_VARIABLES = ["today", "week", "month", "year"] as const;

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const templateFieldSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,39}$/),
  label: z.string().trim().min(1).max(80),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  defaultValue: z.string().max(500).default(""),
});

export const templateRuleSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().trim().min(1).max(200),
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

/**
 * Dữ liệu gửi lên khi tạo / sửa form mẫu. API kiểm tra toàn bộ (Bean Validation + quy tắc liên trường) và trả lỗi
 * theo path, đã dịch sang ngôn ngữ người dùng — client không kiểm tra lại.
 */
export const templateInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).default(""),
  fields: z.array(templateFieldSchema).max(30),
  rules: z.array(templateRuleSchema).min(1).max(30),
});

export type TemplateInput = z.infer<typeof templateInputSchema>;
