"use client";

import { ChevronDown, Moon, Plus, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PeekingCat } from "@/components/cats";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/cn";

type Counts = { all: number; today: number; overdue: number; week: number };

const FILTERS = ["all", "today", "overdue", "week"] as const;

export function Panel({ counts, templates }: { counts: Counts; templates: { id: string; name: string }[] }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const params = useSearchParams();
  const base = pathname === "/list" ? "/list" : "/";
  const currentView = pathname === base ? (params.get("view") ?? "all") : null;

  return (
    <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col border-r border-line bg-panel px-7 py-8 xl:flex">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t.panel.title}</h2>
        <Link
          href="/templates/new"
          aria-label={t.panel.newTemplate}
          title={t.panel.newTemplate}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-hover text-fg-2 transition hover:text-fg"
        >
          <Plus size={16} />
        </Link>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto thin-scroll">
        <Section title={t.panel.filters}>
          {FILTERS.map((view) => (
            <TreeLink
              key={view}
              href={view === "all" ? base : `${base}?view=${view}`}
              active={currentView === view}
              tone={view === "overdue" && counts.overdue > 0 ? "danger" : undefined}
            >
              {t.views[view]} ({counts[view]})
            </TreeLink>
          ))}
        </Section>

        <Section title={t.panel.templates}>
          {templates.length === 0 && <p className="pl-10 text-sm text-fg-2">{t.panel.noTemplates}</p>}
          {templates.map((t) => (
            <TreeLink key={t.id} href={`/templates/${t.id}/run`} active={pathname === `/templates/${t.id}/run`}>
              {t.name}
            </TreeLink>
          ))}
          <TreeLink href="/templates/new" active={pathname === "/templates/new"}>
            <span className="inline-flex items-center gap-1.5 text-brand">
              <Plus size={14} /> {t.panel.newTemplate}
            </span>
          </TreeLink>
        </Section>
      </div>

      <ThemeSwitch />
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between text-[15px] font-semibold"
        aria-expanded={open}
      >
        {title}
        <ChevronDown size={18} className={cn("transition", !open && "-rotate-90")} />
      </button>
      {open && <div className="relative space-y-1 border-l border-line pl-0 ml-2">{children}</div>}
    </div>
  );
}

function TreeLink({
  href,
  active,
  tone,
  children,
}: {
  href: string;
  active: boolean;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center pl-6">
      <span aria-hidden className="absolute left-0 top-1/2 h-px w-4 bg-line" />
      <Link
        href={href}
        className={cn(
          "block truncate rounded-full px-4 py-2 text-[15px] font-medium transition",
          active ? "bg-card text-fg shadow-sm ring-1 ring-line" : "text-fg-2 hover:text-fg",
          tone === "danger" && !active && "text-danger",
        )}
      >
        {children}
      </Link>
    </div>
  );
}

export function ThemeSwitch() {
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ biết theme sau khi mount
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const item = (isDark: boolean, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "dark" : "light")}
      aria-pressed={dark === isDark}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition",
        dark === isDark ? "bg-card text-fg shadow-sm" : "text-fg-2",
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="relative mt-16 flex rounded-full bg-hover p-1">
      <PeekingCat className="pointer-events-none absolute -top-[52px] left-1/2 w-24 -translate-x-1/2" />
      {item(false, <Sun size={16} />, t.panel.light)}
      {item(true, <Moon size={16} />, t.panel.dark)}
    </div>
  );
}
