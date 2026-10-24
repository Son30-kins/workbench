"use client";

import { Copy, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { deleteTemplateAction, duplicateTemplateAction } from "@/actions/templates";

export function TemplateCardActions({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const cls = "flex h-8 w-8 items-center justify-center rounded-full border border-line text-fg-2 transition hover:bg-hover hover:text-fg disabled:opacity-50";

  return (
    <div className="flex gap-1.5">
      <Link href={`/templates/${id}/edit`} className={cls} aria-label="Sửa" title="Sửa">
        <Pencil size={14} />
      </Link>
      <button
        type="button"
        className={cls}
        disabled={pending}
        aria-label="Nhân bản"
        title="Nhân bản"
        onClick={() => startTransition(() => duplicateTemplateAction(id))}
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        className={cls}
        disabled={pending}
        aria-label="Xoá"
        title="Xoá"
        onClick={() => {
          if (confirm(`Xoá form mẫu "${name}"? Các task đã tạo từ form này vẫn được giữ.`)) {
            startTransition(() => deleteTemplateAction(id));
          }
        }}
      >
        <Trash size={14} />
      </button>
    </div>
  );
}
