"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/cn";

/** Hộp thoại dùng <dialog> gốc của trình duyệt (có sẵn focus trap, phím Esc). */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-2xl rounded-3xl border border-line bg-card p-0 text-fg shadow-2xl",
        className,
      )}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto thin-scroll">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-card px-6 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-hover"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
