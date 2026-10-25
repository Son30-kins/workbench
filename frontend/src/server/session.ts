import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { CurrentUser } from "@/lib/types";
import { apiGetIfLoggedIn } from "./api";

/** Gọi /api/me tối đa 1 lần cho mỗi request (layout, trang và i18n dùng chung). null = chưa đăng nhập. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => apiGetIfLoggedIn<CurrentUser>("/api/me"));

/** Người dùng đang đăng nhập (API đọc lại từ DB); chưa đăng nhập → trang đăng nhập. */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
