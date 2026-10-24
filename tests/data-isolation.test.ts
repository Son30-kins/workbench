// Test tích hợp với Postgres thật. Chạy khi có DATABASE_URL (CI dùng service postgres).
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "@/db";
import { reminders, templates, user } from "@/db/schema";
import { DEFAULT_TEMPLATES } from "@/server/seed";
import { createTask, deleteTask, getTask, listTasks, setTaskStatus, toggleSubtask, updateTask } from "@/server/tasks";
import { deleteTemplate, getTemplate, listTemplates, runTemplate, saveTemplate } from "@/server/templates";

const TZ = "Asia/Ho_Chi_Minh";
const A = `test-a-${crypto.randomUUID()}`;
const B = `test-b-${crypto.randomUUID()}`;

describe.skipIf(!process.env.DATABASE_URL)("phân quyền dữ liệu giữa người dùng", () => {
  beforeAll(async () => {
    await getDb()
      .insert(user)
      .values([
        { id: A, name: "A", email: `${A}@example.com`, emailVerified: true },
        { id: B, name: "B", email: `${B}@example.com`, emailVerified: true },
      ]);
  });

  afterAll(async () => {
    await getDb().delete(user).where(inArray(user.id, [A, B]));
    await closeDb();
  });

  it("B không đọc / sửa / xoá / đổi trạng thái được task của A", async () => {
    const task = await createTask(A, {
      title: "Việc của A",
      dueAt: new Date(Date.now() + 3 * 86_400_000),
      priority: "HIGH",
      subtasks: [{ title: "con", done: false }],
    });

    expect(await getTask(B, task.id)).toBeNull();
    expect(await updateTask(B, task.id, { title: "B sửa" })).toBeNull();
    expect(await setTaskStatus(B, task.id, "DONE")).toBeNull();
    expect(await deleteTask(B, task.id)).toBe(false);

    const sub = (await getTask(A, task.id))!.subtasks[0];
    expect(await toggleSubtask(B, sub.id, true)).toBe(false);
    expect(await toggleSubtask(A, sub.id, true)).toBe(true);

    expect((await listTasks(B, { tz: TZ })).map((t) => t.id)).not.toContain(task.id);
    expect((await listTasks(A, { tz: TZ })).map((t) => t.id)).toContain(task.id);
    expect((await getTask(A, task.id))!.title).toBe("Việc của A");
  });

  it("B không thấy / sửa / chạy được template của A", async () => {
    const t = (await saveTemplate(A, DEFAULT_TEMPLATES[2]))!;
    expect(await getTemplate(B, t.id)).toBeNull();
    expect((await listTemplates(B)).map((x) => x.id)).not.toContain(t.id);
    expect(await saveTemplate(B, { ...DEFAULT_TEMPLATES[2], name: "hack" }, t.id)).toBeNull();
    expect(await runTemplate(B, t.id, { viec: "x" }, { tz: TZ })).toBeNull();
    expect(await deleteTemplate(B, t.id)).toBe(false);
    expect((await getDb().select().from(templates).where(eq(templates.id, t.id)))[0].name).toBe(DEFAULT_TEMPLATES[2].name);
  });

  it("chạy template tạo task + lịch nhắc; hoàn thành thì huỷ nhắc", async () => {
    const t = (await saveTemplate(A, DEFAULT_TEMPLATES[0]))!;
    const due = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const res = await runTemplate(A, t.id, { tuan: "43", ngay_nop: due, du_an: "Website", gui_sep: "on" }, { tz: TZ });
    expect(res && res.ok && res.count).toBe(3);

    const created = (await listTasks(A, { tz: TZ })).filter((x) => x.templateName === "Báo cáo tuần");
    expect(created).toHaveLength(3);
    const urgent = created.find((x) => x.priority === "URGENT")!;
    const pending = await getDb().select().from(reminders).where(eq(reminders.taskId, urgent.id));
    expect(pending.length).toBe(5); // 4 mốc trước hạn + 1 mốc quá hạn

    await setTaskStatus(A, urgent.id, "DONE");
    const after = await getDb().select().from(reminders).where(eq(reminders.taskId, urgent.id));
    expect(after).toHaveLength(0);
  });

  it("form thiếu trường bắt buộc → trả lỗi, không tạo gì", async () => {
    const t = (await saveTemplate(A, DEFAULT_TEMPLATES[0]))!;
    const res = await runTemplate(A, t.id, { tuan: "", ngay_nop: "" }, { tz: TZ });
    expect(res && !res.ok && res.errors).toMatchObject({ tuan: "Bắt buộc", ngay_nop: "Bắt buộc" });
  });
});
