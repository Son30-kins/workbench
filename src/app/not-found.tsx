import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-fg-2">404</p>
      <h1 className="text-xl font-bold">Không tìm thấy trang</h1>
      <p className="text-fg-2">Trang không tồn tại hoặc bạn không có quyền xem.</p>
      <Link href="/" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary">
        Về bảng công việc
      </Link>
    </main>
  );
}
