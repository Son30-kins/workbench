import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { TemplateField, TemplateRule } from "@/core/template-schema";
import type { UserSettings } from "@/core/user-settings";

const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const ts = () => timestamp({ withTimezone: true, mode: "date" });
const createdAt = () => ts().notNull().defaultNow();
const updatedAt = () =>
  ts()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);
export const priorityEnum = pgEnum("priority", ["URGENT", "HIGH", "MEDIUM", "LOW"]);
export const taskStatusEnum = pgEnum("task_status", ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
export const reminderKindEnum = pgEnum("reminder_kind", ["BEFORE_DUE", "OVERDUE", "SNOOZE"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["PENDING", "SENT", "CANCELLED", "FAILED"]);

// ===== Bảng của Better Auth (tên thuộc tính phải khớp với Better Auth) =====

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  // Trường riêng của app
  role: roleEnum().notNull().default("USER"),
  banned: boolean().notNull().default(false),
  timezone: text().notNull().default("Asia/Ho_Chi_Minh"),
  settings: jsonb().$type<UserSettings>(),
  lastDigestOn: text(), // YYYY-MM-DD theo giờ địa phương của người dùng
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: ts().notNull(),
    token: text().notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index().on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: ts(),
    refreshTokenExpiresAt: ts(),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: ts().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.identifier)],
);

// ===== Bảng của app =====

/** Cài đặt của cả bản cài (admin chỉnh). */
export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: updatedAt(),
});

export const templates = pgTable(
  "templates",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text().notNull().default(""),
    fields: jsonb().$type<TemplateField[]>().notNull(),
    rules: jsonb().$type<TemplateRule[]>().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId)],
);

export const templateRuns = pgTable(
  "template_runs",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text().references(() => templates.id, { onDelete: "set null" }),
    templateName: text().notNull(),
    values: jsonb().$type<Record<string, unknown>>().notNull(),
    taskCount: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.createdAt)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text().notNull().default(""),
    dueAt: ts(),
    priority: priorityEnum().notNull().default("MEDIUM"),
    status: taskStatusEnum().notNull().default("TODO"),
    tags: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    templateRunId: text().references(() => templateRuns.id, { onDelete: "set null" }),
    templateName: text(),
    completedAt: ts(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.userId, t.status, t.dueAt)],
);

export const subtasks = pgTable(
  "subtasks",
  {
    id: id(),
    taskId: text()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text().notNull(),
    done: boolean().notNull().default(false),
    position: integer().notNull().default(0),
  },
  (t) => [index().on(t.taskId)],
);

export const reminders = pgTable(
  "reminders",
  {
    id: id(),
    taskId: text()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: reminderKindEnum().notNull(),
    fireAt: ts().notNull(),
    status: reminderStatusEnum().notNull().default("PENDING"),
    sentAt: ts(),
    lastError: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.status, t.fireAt), index().on(t.taskId)],
);

/** Thông báo trong app (chuông trên header). */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text().references(() => tasks.id, { onDelete: "set null" }),
    title: text().notNull(),
    body: text().notNull().default(""),
    readAt: ts(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.createdAt)],
);

/** Kênh nhận thông báo của từng người dùng (hiện tại: Telegram). */
export const notificationChannels = pgTable(
  "notification_channels",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text().notNull().default("TELEGRAM"),
    chatId: text(),
    username: text(),
    enabled: boolean().notNull().default(false),
    linkTokenHash: text(),
    linkTokenExpiresAt: ts(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.userId, t.type), index().on(t.linkTokenHash), index().on(t.chatId)],
);

export type User = typeof user.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Subtask = typeof subtasks.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type TemplateRun = typeof templateRuns.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Priority = (typeof priorityEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
