"use client";

import { Bell, CalendarDays, LogOut, Search, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { markNotificationsReadAction } from "@/actions/settings";
import { EmptyState } from "@/components/cats";
import { LanguageMenu } from "@/components/language-switcher";
import { formatInTz } from "@/core/time";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/cn";
import { useClickOutside } from "@/lib/use-click-outside";
import { useSignOut } from "./sidebar";

type NotificationItem = { id: string; title: string; body: string; taskId: string | null; createdAt: Date; readAt: Date | null };

export function Header({
  user,
  notifications,
  unread,
  todayLabel,
  tz,
}: {
  user: { name: string; email: string; image: string | null; role: string };
  notifications: NotificationItem[];
  unread: number;
  todayLabel: string;
  tz: string;
}) {
  const { t } = useI18n();
  const firstName = user.name.split(" ").filter(Boolean).pop() ?? user.name;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 pb-4 pt-6 md:px-8 md:pt-8">
      <h1 className="text-xl font-bold">{t.header.greeting(firstName)}</h1>
      <div className="flex items-center gap-1 md:gap-3">
        <SearchBox />
        <NotificationBell items={notifications} unread={unread} tz={tz} />
        <LanguageMenu />
        <span className="hidden items-center gap-2 text-sm font-medium text-fg-2 lg:flex">
          <CalendarDays size={18} className="text-fg" /> {todayLabel}
        </span>
        <UserMenu user={user} />
      </div>
    </header>
  );
}

function SearchBox() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(Boolean(params.get("q")));
  const [value, setValue] = useState(params.get("q") ?? "");
  const target = pathname === "/list" ? "/list" : "/";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(pathname === target ? params : undefined);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    router.push(`${target}${next.size ? `?${next}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="flex items-center" role="search">
      {open && (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.header.searchPlaceholder}
          aria-label={t.header.searchLabel}
          className="mr-1 w-36 rounded-full border border-line-strong bg-card px-4 py-2 text-sm outline-none focus:border-brand md:w-56"
        />
      )}
      <button
        type={open ? "submit" : "button"}
        onClick={() => !open && setOpen(true)}
        aria-label={t.header.search}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-hover"
      >
        <Search size={20} />
      </button>
    </form>
  );
}

function NotificationBell({ items, unread, tz }: { items: NotificationItem[]; unread: number; tz: string }) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) startTransition(() => markNotificationsReadAction());
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? t.header.notificationsUnread(unread) : t.header.notifications}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-hover"
      >
        <Bell size={20} />
        {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-app bg-pink" />}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold">{t.header.notifications}</div>
          <ul className="max-h-96 overflow-y-auto thin-scroll">
            {items.length === 0 && (
              <li className="px-4 py-6">
                <EmptyState size="sm">{t.header.noNotifications}</EmptyState>
              </li>
            )}
            {items.map((n) => (
              <li key={n.id} className={cn("border-b border-line last:border-0", !n.readAt && "bg-brand/5")}>
                <Link
                  href={n.taskId ? `/?task=${n.taskId}` : "/"}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 hover:bg-hover"
                >
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[13px] text-fg-2">{n.body}</p>}
                  <p className="mt-1 text-xs text-fg-2">{formatInTz(new Date(n.createdAt), tz, t.formats.notification, locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }: { user: { name: string; email: string; image: string | null; role: string } }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const signOut = useSignOut();

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={t.header.account} aria-expanded={open}>
        <Avatar name={user.name} image={user.image} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-card py-2 shadow-xl">
          <div className="px-4 pb-3 pt-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-fg-2">{user.email}</p>
          </div>
          <MenuLink href="/settings" icon={<Settings size={16} />} onClick={() => setOpen(false)}>
            {t.nav.settings}
          </MenuLink>
          {user.role === "ADMIN" && (
            <MenuLink href="/admin" icon={<ShieldCheck size={16} />} onClick={() => setOpen(false)}>
              {t.nav.admin}
            </MenuLink>
          )}
          <button type="button" onClick={signOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-hover">
            <LogOut size={16} /> {t.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, onClick, children }: { href: string; icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-hover">
      {icon}
      {children}
    </Link>
  );
}

export function Avatar({ name, image, size = 40 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- ảnh từ Google, không qua tối ưu ảnh của Next
    return <img src={image} alt={name} width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = name.split(" ").filter(Boolean).slice(-2).map((p) => p[0]).join("").toUpperCase();
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary" style={{ width: size, height: size }}>
      {initials || "?"}
    </span>
  );
}
