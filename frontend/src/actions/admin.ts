"use server";

import { revalidatePath } from "next/cache";
import { apiSend } from "@/server/api";
import type { SimpleResult } from "./settings";

const list = (s: string) => [...new Set(s.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];

export async function saveAccessPolicyAction(input: {
  allowedEmails: string;
  allowedDomains: string;
  registrationOpen: boolean;
}): Promise<SimpleResult> {
  const res = await apiSend("PUT", "/api/admin/access-policy", {
    allowedEmails: list(input.allowedEmails),
    allowedDomains: list(input.allowedDomains),
    registrationOpen: input.registrationOpen,
  });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath("/admin");
  return { ok: true, message: "Đã lưu chính sách đăng nhập" };
}

export async function setBannedAction(userId: string, banned: boolean): Promise<SimpleResult> {
  const res = await apiSend("PATCH", `/api/admin/users/${encodeURIComponent(userId)}/banned`, { banned });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function setRoleAction(userId: string, role: "ADMIN" | "USER"): Promise<SimpleResult> {
  const res = await apiSend("PATCH", `/api/admin/users/${encodeURIComponent(userId)}/role`, { role });
  if (!res.ok) return { ok: false, error: res.error.message };
  revalidatePath("/admin");
  return { ok: true };
}
