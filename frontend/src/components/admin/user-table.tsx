"use client";

import { useState, useTransition } from "react";
import { setBannedAction, setRoleAction } from "@/actions/admin";
import { Avatar } from "@/components/shell/header";
import { Notice } from "@/components/ui";
import { useI18n } from "@/i18n/provider";
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
  const { locale, t } = useI18n();
  const a = t.admin;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res.ok ? null : (res.error ?? t.common.error));
    });

  return (
    <div className="space-y-3">
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-fg-2">
              <th className="px-4 py-3 font-semibold">{a.colUser}</th>
              <th className="px-4 py-3 font-semibold">{a.colRole}</th>
              <th className="px-4 py-3 font-semibold">{a.colTasks}</th>
              <th className="px-4 py-3 font-semibold">{a.colTelegram}</th>
              <th className="px-4 py-3 font-semibold">{a.colJoined}</th>
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
                          {u.name} {self && <span className="text-xs font-normal text-fg-2">{a.you}</span>}
                        </p>
                        <p className="truncate text-xs text-fg-2">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", u.role === "ADMIN" ? "bg-brand/10 text-brand" : "bg-hover text-fg-2")}>
                      {u.role === "ADMIN" ? a.roleAdmin : a.roleUser}
                    </span>
                    {u.banned && <span className="ml-2 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">{a.banned}</span>}
                  </td>
                  <td className="px-4 py-3 text-fg-2">{u.taskCount}</td>
                  <td className="px-4 py-3 text-fg-2">{u.telegram ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-fg-2">{new Date(u.createdAt).toLocaleDateString(locale)}</td>
                  <td className="px-4 py-3 text-right">
                    {!self && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => setRoleAction(u.id, u.role === "ADMIN" ? "USER" : "ADMIN"))}
                          className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold hover:bg-hover"
                        >
                          {u.role === "ADMIN" ? a.revokeAdmin : a.grantAdmin}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (u.banned || confirm(a.confirmBan(u.email))) {
                              run(() => setBannedAction(u.id, !u.banned));
                            }
                          }}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold",
                            u.banned ? "border border-line-strong hover:bg-hover" : "bg-danger/10 text-danger hover:bg-danger/20",
                          )}
                        >
                          {u.banned ? a.unban : a.ban}
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
