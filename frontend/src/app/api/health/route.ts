import { API_URL } from "@/server/api";

export const dynamic = "force-dynamic";

/** Docker healthcheck của web: chạy được và gọi được API (API tự kiểm tra database). */
export async function GET() {
  try {
    const res = await fetch(`${API_URL}/actuator/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 503 });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
