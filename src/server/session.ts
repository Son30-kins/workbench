import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { resolveUserSettings, type UserSettings } from "@/core/user-settings";
import { getAuth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "USER";
  timezone: string;
  settings: UserSettings;
};

/** Người dùng đang đăng nhập, hoặc null. Gọi nhiều lần trong 1 request chỉ đọc DB 1 lần. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Đọc request trước (đánh dấu trang là động) rồi mới khởi tạo auth — lúc build không có .env
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const [u] = await getDb().select().from(user).where(eq(user.id, session.user.id));
  if (!u || u.banned) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    timezone: u.timezone,
    settings: resolveUserSettings(u.settings),
  };
});

/** Dùng trong trang và Server Action: chưa đăng nhập → về trang đăng nhập. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/");
  return u;
}
