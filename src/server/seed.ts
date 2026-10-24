import "server-only";
import { getDb } from "@/db";
import { templates } from "@/db/schema";
import { ANCHOR_SUBMITTED, type TemplateInput } from "@/core/template-schema";

/** Template mẫu tự thêm cho mỗi tài khoản mới. */
export const DEFAULT_TEMPLATES: TemplateInput[] = [
  {
    name: "Báo cáo tuần",
    description: "Thu thập số liệu, viết và gửi báo cáo trước hạn nộp.",
    fields: [
      { key: "tuan", label: "Tuần số", type: "NUMBER", required: true, options: [], defaultValue: "" },
      { key: "ngay_nop", label: "Hạn nộp", type: "DATE", required: true, options: [], defaultValue: "" },
      { key: "du_an", label: "Dự án", type: "TEXT", required: true, options: [], defaultValue: "" },
      { key: "gui_sep", label: "Gửi báo cáo cho quản lý", type: "CHECKBOX", required: false, options: [], defaultValue: "" },
    ],
    rules: [
      {
        id: "thu-thap",
        title: "Thu thập số liệu {{du_an}} — tuần {{tuan}}",
        description: "",
        priority: "HIGH",
        due: { anchor: "ngay_nop", offsetDays: -2, offsetHours: 0, time: "17:00" },
        condition: null,
        subtasks: ["Số liệu tiến độ", "Vấn đề tồn đọng", "Kế hoạch tuần sau"],
        tags: ["báo cáo"],
      },
      {
        id: "viet",
        title: "Viết báo cáo tuần {{tuan}}",
        description: "Dự án: {{du_an}}",
        priority: "HIGH",
        due: { anchor: "ngay_nop", offsetDays: -1, offsetHours: 0, time: "17:00" },
        condition: null,
        subtasks: [],
        tags: ["báo cáo"],
      },
      {
        id: "gui",
        title: "Gửi báo cáo tuần {{tuan}} cho quản lý",
        description: "",
        priority: "URGENT",
        due: { anchor: "ngay_nop", offsetDays: 0, offsetHours: 0, time: "17:00" },
        condition: { field: "gui_sep", equals: "" },
        subtasks: [],
        tags: ["báo cáo"],
      },
    ],
  },
  {
    name: "Chuẩn bị cuộc họp",
    description: "Các bước trước và sau một cuộc họp.",
    fields: [
      { key: "chu_de", label: "Chủ đề", type: "TEXT", required: true, options: [], defaultValue: "" },
      { key: "thoi_gian", label: "Thời gian họp", type: "DATETIME", required: true, options: [], defaultValue: "" },
      {
        key: "hinh_thuc",
        label: "Hình thức",
        type: "SELECT",
        required: true,
        options: ["Trực tiếp", "Online"],
        defaultValue: "Online",
      },
    ],
    rules: [
      {
        id: "agenda",
        title: "Gửi agenda: {{chu_de}}",
        description: "Hình thức: {{hinh_thuc}} — {{thoi_gian}}",
        priority: "MEDIUM",
        due: { anchor: "thoi_gian", offsetDays: -1, offsetHours: 0, time: null },
        condition: null,
        subtasks: [],
        tags: ["họp"],
      },
      {
        id: "phong",
        title: "Đặt phòng họp: {{chu_de}}",
        description: "",
        priority: "HIGH",
        due: { anchor: "thoi_gian", offsetDays: -1, offsetHours: 0, time: null },
        condition: { field: "hinh_thuc", equals: "Trực tiếp" },
        subtasks: [],
        tags: ["họp"],
      },
      {
        id: "bien-ban",
        title: "Gửi biên bản họp: {{chu_de}}",
        description: "",
        priority: "MEDIUM",
        due: { anchor: "thoi_gian", offsetDays: 1, offsetHours: 0, time: null },
        condition: null,
        subtasks: ["Quyết định chính", "Việc cần làm + người phụ trách"],
        tags: ["họp"],
      },
    ],
  },
  {
    name: "Việc nhanh",
    description: "Tạo nhanh 1 task với hạn sau vài ngày.",
    fields: [
      { key: "viec", label: "Việc cần làm", type: "TEXT", required: true, options: [], defaultValue: "" },
      { key: "ghi_chu", label: "Ghi chú", type: "TEXTAREA", required: false, options: [], defaultValue: "" },
    ],
    rules: [
      {
        id: "viec",
        title: "{{viec}}",
        description: "{{ghi_chu}}",
        priority: "MEDIUM",
        due: { anchor: ANCHOR_SUBMITTED, offsetDays: 3, offsetHours: 0, time: "17:00" },
        condition: null,
        subtasks: [],
        tags: [],
      },
    ],
  },
];

export async function seedDefaultTemplates(userId: string) {
  await getDb()
    .insert(templates)
    .values(DEFAULT_TEMPLATES.map((t) => ({ userId, ...t })));
}
