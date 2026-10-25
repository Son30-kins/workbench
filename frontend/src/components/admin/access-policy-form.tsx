"use client";

import { useState, useTransition } from "react";
import { saveAccessPolicyAction } from "@/actions/admin";
import { Button, Field, Notice, Textarea } from "@/components/ui";
import type { AccessPolicy } from "@/lib/types";

export function AccessPolicyForm({ policy }: { policy: AccessPolicy }) {
  const [emails, setEmails] = useState(policy.allowedEmails.join("\n"));
  const [domains, setDomains] = useState(policy.allowedDomains.join("\n"));
  const [open, setOpen] = useState(policy.registrationOpen);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await saveAccessPolicyAction({ allowedEmails: emails, allowedDomains: domains, registrationOpen: open });
      setNotice(res.ok ? { tone: "success", text: res.message ?? "Đã lưu" } : { tone: "danger", text: res.error });
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Ai được đăng nhập</h2>
        <p className="text-sm text-fg-2">Để trống cả hai danh sách = mọi tài khoản Google đều đăng nhập được.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email được phép" hint="Mỗi dòng một email">
          <Textarea value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="ban@gmail.com" />
        </Field>
        <Field label="Tên miền được phép" hint="Ví dụ: congty.com — mọi email @congty.com">
          <Textarea value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="congty.com" />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="h-4 w-4" />
        Cho phép tài khoản mới đăng ký (bỏ tick = chỉ những người đã có tài khoản mới đăng nhập được)
      </label>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <Button onClick={save} disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu chính sách"}
      </Button>
    </div>
  );
}
