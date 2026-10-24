"use client";

import { useState, useTransition } from "react";
import { setBannedAction, setRoleAction } from "@/actions/admin";
import { Avatar } from "@/components/shell/header";
import { Notice } from "@/components/ui";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "USER";
  banned: boolean;
  createdAt: Date;
  taskCount: number;
  telegram: boolean;
};

export function UserTable({ users, currentUserId }: { users: Row[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res.ok ? null : (res.error ?? "Lỗi"));
    });

  return (
    <div className="space-y-3">
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-fg-2">
              <th className="px-4 py-3 font-semibold">Người dùng</th>
              <th className="px-4 py-3 font-semibold">Quyền</th>
              <th className="px-4 py-3 font-semibold">Task</th>
              <th className="px-4 py-3 font-semibold">Telegram</th>
              <th className="px-4 py-3 font-semibold">Ngày tham gia</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === currentUserId;
              return (
                <tr key={u.id} className={cn("border-b border-line last:border-0", u.banned && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} image={u.image} size={32} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {u.name} {self && <span className="text-xs font-normal text-fg-2">(bạn)</span>}
                        </p>
                        <p className="truncate text-xs text-fg-2">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", u.role === "ADMIN" ? "bg-brand/10 text-brand" : "bg-hover text-fg-2")}>
                      {u.role === "ADMIN" ? "Admin" : "Người dùng"}
                    </span>
                    {u.banned && <span className="ml-2 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Đã khoá</span>}
                  </td>
                  <td className="px-4 py-3 text-fg-2">{u.taskCount}</td>
                  <td className="px-4 py-3 text-fg-2">{u.telegram ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-fg-2">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    {!self && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => setRoleAction(u.id, u.role === "ADMIN" ? "USER" : "ADMIN"))}
                          className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold hover:bg-hover"
                        >
                          {u.role === "ADMIN" ? "Bỏ admin" : "Cấp admin"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (u.banned || confirm(`Khoá tài khoản ${u.email}? Người này sẽ bị đăng xuất ngay.`)) {
                              run(() => setBannedAction(u.id, !u.banned));
                            }
                          }}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold",
                            u.banned ? "border border-line-strong hover:bg-hover" : "bg-danger/10 text-danger hover:bg-danger/20",
                          )}
                        >
                          {u.banned ? "Mở khoá" : "Khoá"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
