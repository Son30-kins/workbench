import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { GoogleSignInButton } from "./google-button";
import { Logo, PawPrint, PeekingCat } from "@/components/cats";

export const metadata: Metadata = { title: "Đăng nhập" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  EMAIL_NOT_ALLOWED: "Email này không có trong danh sách được phép đăng nhập. Liên hệ admin của bản cài.",
  REGISTRATION_CLOSED: "Bản cài này đã đóng đăng ký tài khoản mới.",
  ACCOUNT_BANNED: "Tài khoản của bạn đã bị khoá.",
  EMAIL_NOT_VERIFIED: "Email Google của bạn chưa được xác minh.",
  access_denied: "Bạn đã huỷ đăng nhập Google.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  const code = typeof error === "string" ? error : undefined;
  const message = code ? (ERRORS[code] ?? "Đăng nhập không thành công. Thử lại hoặc liên hệ admin.") : null;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="paw-pattern relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo className="h-10 w-10 text-[#ffd9b8]" />
        <div className="space-y-6">
          <BoardIllustration />
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Điền một form — app tự tạo cả chuỗi công việc cho bạn.
          </h2>
          <p className="max-w-md text-white/60">
            Ưu tiên rõ ràng, hạn chót tự tính — và một chú mèo nhắc việc qua Telegram trước khi quá hạn.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/40">
          <PawPrint className="h-3.5 w-3.5 text-pink" /> Workbench · tự host bằng Docker
        </p>
      </section>

      <section className="flex items-center justify-center bg-app px-6 py-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3">
            <PeekingCat className="w-28 lg:hidden" />
            <h1 className="text-3xl font-bold">Đăng nhập</h1>
            <p className="text-fg-2">Dùng tài khoản Google của bạn để tiếp tục.</p>
          </div>

          {message && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {message}
            </p>
          )}

          <GoogleSignInButton />

          <p className="text-xs leading-relaxed text-fg-2">
            Người đăng nhập đầu tiên của bản cài sẽ là quản trị viên. App chỉ đọc tên, email và ảnh đại diện từ Google.
          </p>
        </div>
      </section>
    </main>
  );
}

const ILLUSTRATION_COLUMNS = [
  [["w-3/4", "bg-danger"], ["w-2/3", "bg-warning"]],
  [["w-4/5", "bg-warning"], ["w-1/2", "bg-pink"]],
  [["w-2/3", "bg-success"], ["w-3/4", "bg-success"]],
];

function BoardIllustration() {
  return (
    <div aria-hidden className="relative max-w-md pt-16">
      {/* Mèo ló đầu, hai chân bám mép trên của bảng */}
      <PeekingCat className="absolute top-1 left-1/2 w-32 -translate-x-1/2" />
      <div className="grid grid-cols-3 gap-3">
        {ILLUSTRATION_COLUMNS.map((col, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-white/10 p-2">
            {col.map(([w, color], j) => (
              <div key={j} className="space-y-2 rounded-xl bg-white/[0.06] p-3">
                <div className={`h-2 rounded-full bg-white/70 ${w}`} />
                <div className="h-1.5 w-1/2 rounded-full bg-white/25" />
                <div className="h-1 rounded-full bg-white/10">
                  <div className={`h-1 rounded-full ${color}`} style={{ width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
