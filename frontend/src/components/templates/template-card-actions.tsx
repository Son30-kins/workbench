"use client";

import { Copy, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { deleteTemplateAction, duplicateTemplateAction } from "@/actions/templates";
import { useI18n } from "@/i18n/provider";

export function TemplateCardActions({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const cls = "flex h-8 w-8 items-center justify-center rounded-full border border-line text-fg-2 transition hover:bg-hover hover:text-fg disabled:opacity-50";

  return (
    <div className="flex gap-1.5">
      <Link href={`/templates/${id}/edit`} className={cls} aria-label={t.templates.edit} title={t.templates.edit}>
        <Pencil size={14} />
      </Link>
      <button
        type="button"
        className={cls}
        disabled={pending}
        aria-label={t.templates.duplicate}
        title={t.templates.duplicate}
        onClick={() => startTransition(() => duplicateTemplateAction(id))}
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        className={cls}
        disabled={pending}
        aria-label={t.common.delete}
        title={t.common.delete}
        onClick={() => {
          if (confirm(t.templates.confirmDelete(name))) {
            startTransition(() => deleteTemplateAction(id));
          }
        }}
      >
        <Trash size={14} />
      </button>
    </div>
  );
}
