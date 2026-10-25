import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { CurrentUser } from "@/lib/types";
import { apiGet, apiGetIfLoggedIn } from "./api";

/** Người dùng đang đăng nhập (API đọc lại từ DB). Gọi nhiều lần trong 1 request chỉ gọi API 1 lần. */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await apiGet<CurrentUser>("/api/me");
  if (!user) redirect("/login");
  return user;
});

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Không chuyển hướng — trang đăng nhập dùng để biết đã đăng nhập sẵn chưa. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return apiGetIfLoggedIn<CurrentUser>("/api/me");
}
