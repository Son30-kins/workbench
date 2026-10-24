import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Kiểm tra nhanh: chưa có cookie phiên → về trang đăng nhập.
 * Đây chỉ là bước lọc sớm; quyền thật được kiểm tra lại ở từng trang / Server Action (requireUser).
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|api/health|login|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webp|jpg)$).*)"],
};
