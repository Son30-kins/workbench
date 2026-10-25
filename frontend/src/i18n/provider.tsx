"use client";

import { createContext, use, useEffect } from "react";
import { LOCALE_COOKIE, type Locale } from "./config";
import { getMessages, type Messages } from "./index";

const I18nContext = createContext<{ locale: Locale; t: Messages } | null>(null);

/** Đặt ở root layout: mọi client component bên dưới dùng được useI18n(). */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext value={{ locale, t: getMessages(locale) }}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = use(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/**
 * Tài khoản đã chọn ngôn ngữ khác cookie (vd. đổi trên máy khác) → ghi lại cookie, để lần gọi API sau và trang
 * đăng nhập dùng đúng ngôn ngữ của tài khoản.
 */
export function SyncLocaleCookie({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);
  return null;
}
