import { describe, expect, it } from "vitest";
import { planTasks, renderText, validateValues } from "@/core/template-engine";
import { ANCHOR_SUBMITTED, templateInputSchema, type TemplateField, type TemplateRule } from "@/core/template-schema";
import { formatInTz } from "@/core/time";

const TZ = "Asia/Ho_Chi_Minh";
const NOW = new Date("2026-10-24T03:00:00Z"); // 10:00 giờ VN, thứ Bảy

const fields: TemplateField[] = [
  { key: "tuan", label: "Tuần số", type: "NUMBER", required: true, options: [], defaultValue: "" },
  { key: "ngay_nop", label: "Hạn nộp", type: "DATE", required: true, options: [], defaultValue: "" },
  { key: "du_an", label: "Dự án", type: "SELECT", required: true, options: ["A", "B"], defaultValue: "" },
  { key: "gui_sep", label: "Gửi sếp", type: "CHECKBOX", required: false, options: [], defaultValue: "" },
];

const rule = (r: Partial<TemplateRule> & Pick<TemplateRule, "id" | "title">): TemplateRule => ({
  description: "",
  priority: "HIGH",
  due: { anchor: "ngay_nop", offsetDays: 0, offsetHours: 0, time: null },
  condition: null,
  subtasks: [],
  tags: [],
  ...r,
});

const weeklyReport = {
  fields,
  rules: [
    rule({ id: "r1", title: "Thu thập số liệu dự án {{du_an}} — tuần {{tuan}}", due: { anchor: "ngay_nop", offsetDays: -2, offsetHours: 0, time: "17:00" } }),
    rule({ id: "r2", title: "Viết báo cáo tuần {{tuan}}", due: { anchor: "ngay_nop", offsetDays: -1, offsetHours: 0, time: "17:00" } }),
    rule({
      id: "r3",
      title: "Gửi báo cáo tuần {{tuan}} cho sếp",
      priority: "URGENT",
      due: { anchor: "ngay_nop", offsetDays: 0, offsetHours: 0, time: "17:00" },
      condition: { field: "gui_sep", equals: "" },
    }),
  ],
};

describe("validateValues", () => {
  it("báo lỗi trường bắt buộc, số, lựa chọn không hợp lệ", () => {
    const { errors } = validateValues(fields, { tuan: "abc", ngay_nop: "", du_an: "Z" });
    expect(errors).toEqual({ tuan: "Phải là số", ngay_nop: "Bắt buộc", du_an: "Lựa chọn không hợp lệ" });
  });

  it("checkbox nhận 'on' từ form HTML", () => {
    const { values, errors } = validateValues(fields, { tuan: "43", ngay_nop: "2026-10-31", du_an: "A", gui_sep: "on" });
    expect(errors).toEqual({});
    expect(values.gui_sep).toBe(true);
  });
});

describe("planTasks", () => {
  it("sinh đúng 3 task với hạn tương đối theo ngày nộp, giờ VN", () => {
    const { values } = validateValues(fields, { tuan: "43", ngay_nop: "2026-10-31", du_an: "A", gui_sep: "on" });
    const { tasks, warnings } = planTasks(weeklyReport, values, { tz: TZ, now: NOW });

    expect(warnings).toEqual([]);
    expect(tasks.map((t) => t.title)).toEqual([
      "Thu thập số liệu dự án A — tuần 43",
      "Viết báo cáo tuần 43",
      "Gửi báo cáo tuần 43 cho sếp",
    ]);
    expect(tasks.map((t) => formatInTz(t.dueAt!, TZ))).toEqual(["29/10/2026 17:00", "30/10/2026 17:00", "31/10/2026 17:00"]);
    // 17:00 giờ VN = 10:00 UTC
    expect(tasks[2].dueAt!.toISOString()).toBe("2026-10-31T10:00:00.000Z");
    expect(tasks[2].priority).toBe("URGENT");
  });

  it("bỏ task có điều kiện khi checkbox không được tick", () => {
    const { values } = validateValues(fields, { tuan: "43", ngay_nop: "2026-10-31", du_an: "B" });
    const { tasks } = planTasks(weeklyReport, values, { tz: TZ, now: NOW });
    expect(tasks).toHaveLength(2);
  });

  it("mốc là ngày, không đặt giờ → hạn 23:59 cuối ngày", () => {
    const t = { fields, rules: [rule({ id: "x", title: "X" })] };
    const { tasks } = planTasks(t, { ngay_nop: "2026-11-02" }, { tz: TZ, now: NOW });
    expect(formatInTz(tasks[0].dueAt!, TZ)).toBe("02/11/2026 23:59");
  });

  it("mốc 'lúc điền form' + 3 ngày 2 giờ", () => {
    const t = { fields: [], rules: [rule({ id: "x", title: "X", due: { anchor: ANCHOR_SUBMITTED, offsetDays: 3, offsetHours: 2, time: null } })] };
    const { tasks } = planTasks(t, {}, { tz: TZ, now: NOW });
    expect(formatInTz(tasks[0].dueAt!, TZ)).toBe("27/10/2026 12:00");
  });

  it("không có mốc → không có hạn; mốc trống → cảnh báo", () => {
    const t = {
      fields,
      rules: [
        rule({ id: "a", title: "Không hạn", due: { anchor: null, offsetDays: 0, offsetHours: 0, time: null } }),
        rule({ id: "b", title: "Thiếu ngày" }),
      ],
    };
    const { tasks, warnings } = planTasks(t, { ngay_nop: "" }, { tz: TZ, now: NOW });
    expect(tasks.map((x) => x.dueAt)).toEqual([null, null]);
    expect(warnings).toHaveLength(1);
  });

  it("cảnh báo khi hạn đã qua", () => {
    const t = { fields, rules: [rule({ id: "x", title: "Cũ" })] };
    const { warnings } = planTasks(t, { ngay_nop: "2026-10-01" }, { tz: TZ, now: NOW });
    expect(warnings[0]).toContain("quá khứ");
  });
});

describe("renderText", () => {
  it("định dạng ngày, checkbox và biến có sẵn", () => {
    const out = renderText("{{ngay_nop}} | {{gui_sep}} | {{today}} | tuần {{week}} | {{khong_co}}", {
      fields,
      values: { ngay_nop: "2026-10-31", gui_sep: false },
      tz: TZ,
      now: NOW,
    });
    expect(out).toBe("31/10/2026 | Không | 24/10/2026 | tuần 43 | ");
  });
});

describe("templateInputSchema", () => {
  it("chặn mã trùng, biến lạ và mốc hạn không phải trường ngày", () => {
    const res = templateInputSchema.safeParse({
      name: "T",
      fields: [fields[0], { ...fields[0] }],
      rules: [rule({ id: "r", title: "{{la}}", due: { anchor: "tuan", offsetDays: 0, offsetHours: 0, time: null } })],
    });
    expect(res.success).toBe(false);
    const messages = res.error!.issues.map((i) => i.message).join(" | ");
    expect(messages).toContain("bị trùng");
    expect(messages).toContain("{{la}}");
    expect(messages).toContain("Mốc hạn");
  });

  it("chấp nhận template báo cáo tuần hợp lệ", () => {
    expect(templateInputSchema.safeParse({ name: "Báo cáo tuần", ...weeklyReport }).success).toBe(true);
  });
});
