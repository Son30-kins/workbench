"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveAccessPolicy } from "@/server/app-settings";
import { requireAdmin } from "@/server/session";
import { setUserBanned, setUserRole } from "@/server/users";
import type { SimpleResult } from "./settings";

const list = (s: string) =>
  [...new Set(s.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean))];

export async function saveAccessPolicyAction(input: {
  allowedEmails: string;
  allowedDomains: string;
  registrationOpen: boolean;
}): Promise<SimpleResult> {
  await requireAdmin();
  const emails = list(input.allowedEmails);
  const domains = list(input.allowedDomains).map((d) => d.replace(/^@/, ""));
  const badEmail = emails.find((e) => !z.email().safeParse(e).success);
  if (badEmail) return { ok: false, error: `Email không hợp lệ: ${badEmail}` };
  const badDomain = domains.find((d) => !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
  if (badDomain) return { ok: false, error: `Tên miền không hợp lệ: ${badDomain}` };
  await saveAccessPolicy({ allowedEmails: emails, allowedDomains: domains, registrationOpen: input.registrationOpen });
  revalidatePath("/admin");
  return { ok: true, message: "Đã lưu chính sách đăng nhập" };
}

export async function setBannedAction(userId: string, banned: boolean): Promise<SimpleResult> {
  const admin = await requireAdmin();
  try {
    await setUserBanned(admin.id, userId, banned);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function setRoleAction(userId: string, role: "ADMIN" | "USER"): Promise<SimpleResult> {
  const admin = await requireAdmin();
  try {
    await setUserRole(admin.id, userId, z.enum(["ADMIN", "USER"]).parse(role));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/admin");
  return { ok: true };
}
