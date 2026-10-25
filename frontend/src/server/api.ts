// Client gọi Workbench API (Spring Boot) từ PHÍA SERVER của Next.js — trình duyệt không gọi API trực tiếp.
// Chuyển tiếp cookie phiên WORKBENCH_SESSION, gửi kèm X-Requested-By (API dùng header này chống CSRF) và
// Accept-Language theo ngôn ngữ đang chọn (API trả thông báo lỗi đúng ngôn ngữ).
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requestLocale } from "@/i18n/request";

export const SESSION_COOKIE = "WORKBENCH_SESSION";

/** Địa chỉ nội bộ của API: dev = http://localhost:8080, Docker = http://api:8080. */
export const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export type Violation = { path: string; message: string };

/** Lỗi API dạng RFC 9457 Problem Details. */
export type ApiFailure = {
  status: number;
  message: string;
  errors: Violation[];
  fieldErrors: Record<string, string>;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

async function call(method: string, path: string, body?: unknown): Promise<Response> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-language": await requestLocale(),
    "x-requested-by": "workbench-web",
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (session) headers.cookie = `${SESSION_COOKIE}=${session}`;
  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
}

async function failure(res: Response): Promise<ApiFailure> {
  const problem = (await res.json().catch(() => ({}))) as {
    detail?: string;
    errors?: Violation[];
    fieldErrors?: Record<string, string>;
  };
  return {
    status: res.status,
    message: problem.detail ?? getMessages(await requestLocale()).common.genericError,
    errors: problem.errors ?? [],
    fieldErrors: problem.fieldErrors ?? {},
  };
}

/** GET; 401 → về trang đăng nhập, 404 → null. */
export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await call("GET", path);
  if (res.status === 401) redirect("/login");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** POST / PUT / PATCH / DELETE cho Server Action. Lỗi nghiệp vụ trả về {ok:false}, không throw. */
export async function apiSend<T = void>(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<ApiResult<T>> {
  const res = await call(method, path, body);
  if (res.status === 401) redirect("/login");
  if (!res.ok) return { ok: false, error: await failure(res) };
  const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  return { ok: true, data: data as T };
}

/** Dùng ở trang đăng nhập: chỉ cần biết đã đăng nhập chưa, không chuyển hướng. */
export async function apiGetIfLoggedIn<T>(path: string): Promise<T | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  const res = await call("GET", path);
  return res.ok ? ((await res.json()) as T) : null;
}
