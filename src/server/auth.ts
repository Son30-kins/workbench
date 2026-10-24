import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getEnv } from "@/lib/env";
import { getAccessPolicy, isEmailAllowed } from "./app-settings";
import { seedDefaultTemplates } from "./seed";

function createAuth() {
  const env = getEnv();
  const db = getDb();

  return betterAuth({
    appName: "ManagementTask",
    baseURL: env.APP_URL,
    secret: env.AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    // Chỉ đăng nhập bằng Google — không có mật khẩu
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", input: false, defaultValue: "USER" },
        banned: { type: "boolean", input: false, defaultValue: false },
        timezone: { type: "string", input: false, defaultValue: env.TZ },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      useSecureCookies: env.APP_URL.startsWith("https://"),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!user.emailVerified) {
              throw APIError.from("FORBIDDEN", { code: "EMAIL_NOT_VERIFIED", message: "Email Google chưa được xác minh" });
            }
            const policy = await getAccessPolicy();
            const [{ total }] = await db.select({ total: count() }).from(schema.user);
            const isFirstUser = total === 0;
            if (!isFirstUser && !policy.registrationOpen) {
              throw APIError.from("FORBIDDEN", { code: "REGISTRATION_CLOSED", message: "Bản cài này đã đóng đăng ký" });
            }
            if (!isEmailAllowed(user.email, policy)) {
              throw APIError.from("FORBIDDEN", { code: "EMAIL_NOT_ALLOWED", message: "Email này không được phép đăng nhập" });
            }
            // Người đăng nhập đầu tiên của bản cài là admin
            return { data: { ...user, role: isFirstUser ? "ADMIN" : "USER", timezone: env.TZ } };
          },
          after: async (user) => {
            await seedDefaultTemplates(user.id);
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const [u] = await db
              .select({ banned: schema.user.banned })
              .from(schema.user)
              .where(eq(schema.user.id, session.userId));
            if (u?.banned) {
              throw APIError.from("FORBIDDEN", { code: "ACCOUNT_BANNED", message: "Tài khoản đã bị khoá" });
            }
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { __mtAuth?: Auth };

/** Khởi tạo khi dùng lần đầu — lúc build image chưa có biến môi trường. */
export function getAuth(): Auth {
  globalForAuth.__mtAuth ??= createAuth();
  return globalForAuth.__mtAuth;
}
