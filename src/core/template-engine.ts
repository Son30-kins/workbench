import { getISOWeek } from "date-fns";
import type { PriorityValue } from "./priority";
import {
  ANCHOR_SUBMITTED,
  extractVariables,
  type TemplateField,
  type TemplateRule,
} from "./template-schema";
import { addLocalDays, formatInTz, fromLocal, localParts, parseLocalDateTime, setLocalTime } from "./time";

export type FormValues = Record<string, string | boolean>;

export type PlannedTask = {
  ruleId: string;
  title: string;
  description: string;
  priority: PriorityValue;
  dueAt: Date | null;
  subtasks: string[];
  tags: string[];
};

type Ctx = { fields: TemplateField[]; values: FormValues; tz: string; now: Date };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Giờ mặc định khi mốc hạn là một ngày (không có giờ) và quy tắc không đặt giờ. */
const DEFAULT_DATE_TIME = "23:59";

/** Kiểm tra & chuẩn hoá dữ liệu người dùng điền vào form. */
export function validateValues(
  fields: TemplateField[],
  raw: Record<string, unknown>,
): { values: FormValues; errors: Record<string, string> } {
  const values: FormValues = {};
  const errors: Record<string, string> = {};

  for (const f of fields) {
    const input = raw[f.key];
    if (f.type === "CHECKBOX") {
      values[f.key] = input === true || input === "on" || input === "true";
      continue;
    }
    const v = typeof input === "string" ? input.trim() : "";
    if (!v) {
      if (f.required) errors[f.key] = "Bắt buộc";
      values[f.key] = "";
      continue;
    }
    if (f.type === "NUMBER" && !Number.isFinite(Number(v))) errors[f.key] = "Phải là số";
    if (f.type === "DATE" && !DATE_RE.test(v)) errors[f.key] = "Ngày không hợp lệ";
    if (f.type === "DATETIME" && !DATETIME_RE.test(v)) errors[f.key] = "Ngày giờ không hợp lệ";
    if (f.type === "SELECT" && !f.options.includes(v)) errors[f.key] = "Lựa chọn không hợp lệ";
    values[f.key] = v.slice(0, 2000);
  }
  return { values, errors };
}

function displayValue(field: TemplateField | undefined, value: string | boolean | undefined, tz: string): string {
  if (value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (field?.type === "DATE") return formatInTz(fromLocal(value, "12:00", tz), tz, "dd/MM/yyyy");
  if (field?.type === "DATETIME") {
    const d = parseLocalDateTime(value, tz);
    return d ? formatInTz(d, tz) : value;
  }
  return value;
}

/** Thay {{biến}} bằng giá trị đã điền (biến không có giá trị → chuỗi rỗng). */
export function renderText(template: string, ctx: Ctx): string {
  const builtins: Record<string, string> = {
    today: formatInTz(ctx.now, ctx.tz, "dd/MM/yyyy"),
    week: String(getISOWeek(new Date(localParts(ctx.now, ctx.tz).dateKey + "T12:00:00Z"))),
    month: String(localParts(ctx.now, ctx.tz).m),
    year: String(localParts(ctx.now, ctx.tz).y),
  };
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const field = ctx.fields.find((f) => f.key === key);
    if (field) return displayValue(field, ctx.values[key], ctx.tz);
    return builtins[key] ?? "";
  });
}

function conditionMet(rule: TemplateRule, values: FormValues): boolean {
  if (!rule.condition) return true;
  const v = values[rule.condition.field];
  if (rule.condition.equals === "") return v === true || (typeof v === "string" && v !== "");
  return String(v) === rule.condition.equals;
}

function computeDue(rule: TemplateRule, ctx: Ctx): { dueAt: Date | null; missingAnchor: boolean } {
  const { anchor, offsetDays, offsetHours, time } = rule.due;
  if (!anchor) return { dueAt: null, missingAnchor: false };

  let base: Date | null;
  let anchorIsDate = false;
  if (anchor === ANCHOR_SUBMITTED) {
    base = ctx.now;
  } else {
    const field = ctx.fields.find((f) => f.key === anchor);
    const v = ctx.values[anchor];
    if (!field || typeof v !== "string" || !v) return { dueAt: null, missingAnchor: true };
    if (field.type === "DATE") {
      base = fromLocal(v, "00:00", ctx.tz);
      anchorIsDate = true;
    } else {
      base = parseLocalDateTime(v, ctx.tz);
    }
    if (!base) return { dueAt: null, missingAnchor: true };
  }

  let due = addLocalDays(base, offsetDays, ctx.tz);
  due = new Date(due.getTime() + offsetHours * 3_600_000);
  if (time) due = setLocalTime(due, time, ctx.tz);
  else if (anchorIsDate && offsetHours === 0) due = setLocalTime(due, DEFAULT_DATE_TIME, ctx.tz);
  return { dueAt: due, missingAnchor: false };
}

/** Từ template + dữ liệu form → danh sách task sẽ tạo (chưa lưu). */
export function planTasks(
  template: { fields: TemplateField[]; rules: TemplateRule[] },
  values: FormValues,
  opts: { tz: string; now: Date },
): { tasks: PlannedTask[]; warnings: string[] } {
  const ctx: Ctx = { fields: template.fields, values, tz: opts.tz, now: opts.now };
  const tasks: PlannedTask[] = [];
  const warnings: string[] = [];

  for (const rule of template.rules) {
    if (!conditionMet(rule, values)) continue;
    const title = renderText(rule.title, ctx).trim() || "(không có tiêu đề)";
    const { dueAt, missingAnchor } = computeDue(rule, ctx);
    if (missingAnchor) warnings.push(`"${title}": chưa điền ngày làm mốc nên task không có hạn`);
    if (dueAt && dueAt < opts.now) warnings.push(`"${title}": hạn chót đã ở trong quá khứ`);

    tasks.push({
      ruleId: rule.id,
      title: title.slice(0, 200),
      description: renderText(rule.description, ctx).slice(0, 5000),
      priority: rule.priority,
      dueAt,
      subtasks: rule.subtasks.map((s) => renderText(s, ctx).trim()).filter(Boolean),
      tags: [...new Set(rule.tags.map((s) => renderText(s, ctx).trim()).filter(Boolean))],
    });
  }
  return { tasks, warnings };
}

/** Các biến đang dùng trong một quy tắc — để hiển thị gợi ý trong trình tạo template. */
export function variablesUsed(rule: TemplateRule): string[] {
  return [...new Set([rule.title, rule.description, ...rule.subtasks, ...rule.tags].flatMap(extractVariables))];
}
