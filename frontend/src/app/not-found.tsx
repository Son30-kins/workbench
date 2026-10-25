import Link from "next/link";
import { CatInBox } from "@/components/cats";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <CatInBox className="w-48" />
      <p className="text-5xl font-extrabold text-brand">404</p>
      <h1 className="text-xl font-bold">Không tìm thấy trang</h1>
      <p className="text-fg-2">Mèo lục khắp thùng rồi mà không thấy — trang không tồn tại hoặc bạn không có quyền xem.</p>
      <Link href="/" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary">
        Về bảng công việc
      </Link>
    </main>
  );
}
