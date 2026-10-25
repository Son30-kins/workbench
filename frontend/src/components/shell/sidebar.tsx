"use client";

import { FileStack, LayoutGrid, ListTodo, LogOut, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { signOutAction } from "@/actions/settings";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", icon: LayoutGrid, label: "Bảng công việc", short: "Bảng" },
  { href: "/list", icon: ListTodo, label: "Danh sách", short: "Danh sách" },
  { href: "/templates", icon: FileStack, label: "Form mẫu", short: "Form mẫu" },
  { href: "/settings", icon: Settings, label: "Cài đặt", short: "Cài đặt" },
];
const ADMIN = { href: "/admin", icon: ShieldCheck, label: "Quản trị", short: "Quản trị" };

function useNav(isAdmin: boolean) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV, ADMIN] : NAV;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return { items, isActive };
}

export function useSignOut() {
  return () => signOutAction();
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const { items, isActive } = useNav(isAdmin);
  const signOut = useSignOut();

  return (
    <aside className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col items-center bg-sidebar py-6 text-white md:flex">
      <div className="mb-8 flex gap-1.5" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
      </div>
      <Link href="/" aria-label="Trang chủ" className="mb-10">
        <Logo className="h-8 w-8 text-white" />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-3">
        {items.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition",
              isActive(href) ? "bg-white/10 text-white" : "text-white/50 hover:text-white",
            )}
          >
            <Icon size={21} strokeWidth={1.8} />
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={signOut}
        title="Đăng xuất"
        aria-label="Đăng xuất"
        className="flex h-12 w-12 items-center justify-center rounded-full text-white/50 transition hover:text-white"
      >
        <LogOut size={21} strokeWidth={1.8} />
      </button>
    </aside>
  );
}

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const { items, isActive } = useNav(isAdmin);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-white/10 bg-sidebar px-2 pb-[env(safe-area-inset-bottom)] text-white md:hidden">
      {items.map(({ href, icon: Icon, label, short }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]", isActive(href) ? "text-white" : "text-white/50")}
        >
          <Icon size={20} strokeWidth={1.8} />
          {short}
        </Link>
      ))}
    </nav>
  );
}
