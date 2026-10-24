"use client";

import { LayoutGrid, ListTodo, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { useTaskDialog } from "./task-dialog";

const VIEW_LABEL: Record<string, string> = { today: "Hôm nay", overdue: "Quá hạn", week: "7 ngày tới" };

export function TasksToolbar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { openNew } = useTaskDialog();
  const query = params.toString();
  const view = params.get("view");
  const q = params.get("q");

  const tab = (href: string, icon: React.ReactNode, label: string) => (
    <Link
      href={`${href}${query ? `?${query}` : ""}`}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "-mb-px flex items-center gap-2 border-b-2 px-4 pb-3 text-[15px] font-semibold transition",
        pathname === href ? "border-fg text-fg" : "border-transparent text-fg-2 hover:text-fg",
      )}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line">
        <nav className="flex">
          {tab("/", <LayoutGrid size={18} />, "Bảng")}
          {tab("/list", <ListTodo size={18} />, "Danh sách")}
        </nav>
        <div className="flex items-center gap-2 pb-3">
          <button
            type="button"
            onClick={() => openNew()}
            className="flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2.5 text-sm font-semibold hover:bg-hover"
          >
            <Plus size={16} /> Task
          </button>
          <Link href="/templates" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:opacity-90">
            Điền form mẫu
          </Link>
        </div>
      </div>
      {/* Bộ lọc nhanh khi màn hình nhỏ (panel bên trái bị ẩn) */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
        {[
          ["all", "Tất cả"],
          ["today", "Hôm nay"],
          ["overdue", "Quá hạn"],
          ["week", "7 ngày tới"],
        ].map(([v, label]) => {
          const next = new URLSearchParams(params);
          next.delete("task");
          if (v === "all") next.delete("view");
          else next.set("view", v);
          const active = (view ?? "all") === v;
          return (
            <Link
              key={v}
              href={`${pathname}${next.size ? `?${next}` : ""}`}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
                active ? "bg-primary text-on-primary" : "bg-hover text-fg-2",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
      {(view || q) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-fg-2">Đang lọc:</span>
          {view && VIEW_LABEL[view] && <Chip label={VIEW_LABEL[view]} href={withoutParam(pathname, params, "view")} />}
          {q && <Chip label={`“${q}”`} href={withoutParam(pathname, params, "q")} />}
        </div>
      )}
    </div>
  );
}

function withoutParam(pathname: string, params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  next.delete(key);
  return `${pathname}${next.size ? `?${next}` : ""}`;
}

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-full bg-hover px-3 py-1.5 font-medium hover:bg-line">
      {label} <X size={14} />
    </Link>
  );
}
