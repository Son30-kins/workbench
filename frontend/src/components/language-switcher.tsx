"use client";

import { Check, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { changeLanguageAction } from "@/actions/language";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import { useClickOutside } from "@/lib/use-click-outside";

function useChangeLanguage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const change = (next: Locale) =>
    startTransition(async () => {
      await changeLanguageAction(next);
      router.refresh();
    });
  return { pending, change };
}

/** Nút nhỏ có menu — header và trang đăng nhập. */
export function LanguageMenu({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const { pending, change } = useChangeLanguage();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(useCallback(() => setOpen(false), []));

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t.common.language}
        title={t.common.language}
        aria-expanded={open}
        disabled={pending}
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold uppercase hover:bg-hover disabled:opacity-60"
      >
        <Languages size={18} />
        {locale}
      </button>
      {open && (
        <ul className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-2xl border border-line bg-card py-1.5 shadow-xl">
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                lang={l}
                onClick={() => {
                  setOpen(false);
                  if (l !== locale) change(l);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-hover"
              >
                {LOCALE_NAMES[l]}
                {l === locale && <Check size={16} className="text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ba nút chọn — trang Cài đặt. */
export function LanguagePills() {
  const { locale } = useI18n();
  const { pending, change } = useChangeLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() => l !== locale && change(l)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
            l === locale ? "border-transparent bg-primary text-on-primary" : "border-line-strong hover:bg-hover",
          )}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
