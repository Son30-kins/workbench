"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Làm mới dữ liệu (chuông thông báo, task được đánh dấu xong từ Telegram) mỗi phút khi tab đang mở. */
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && !document.querySelector("dialog[open]")) router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
