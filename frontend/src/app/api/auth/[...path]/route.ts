import { API_URL } from "@/server/api";

export const dynamic = "force-dynamic";

// Chỉ chuyển tiếp những header cần cho đăng nhập — không đẩy mọi header của trình duyệt sang API
const FORWARD_REQUEST = ["cookie", "user-agent", "accept", "accept-language", "content-type", "x-requested-by"];
const FORWARD_RESPONSE = ["location", "content-type", "cache-control"];

/**
 * Chuyển tiếp /api/auth/** (đăng nhập Google: signin, callback; đăng xuất) sang Spring Security.
 * Dùng Route Handler thay cho rewrites() của next.config: rewrites bị ghi cứng lúc build (output standalone),
 * còn ở đây API_URL được đọc lúc chạy → cùng một image chạy được ở mọi bản cài.
 * redirect: "manual" — trả nguyên chuyển hướng (sang Google / về trang chủ) và Set-Cookie cho trình duyệt.
 */
async function forward(request: Request, ctx: RouteContext<"/api/auth/[...path]">) {
  const { path } = await ctx.params;
  const url = new URL(request.url);
  const target = `${API_URL}/api/auth/${path.map(encodeURIComponent).join("/")}${url.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const out = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = response.headers.get(name);
    if (value) out.set(name, value);
  }
  for (const cookie of response.headers.getSetCookie()) out.append("set-cookie", cookie);
  return new Response(response.body, { status: response.status, headers: out });
}

export { forward as GET, forward as POST };
