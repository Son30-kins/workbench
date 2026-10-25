"use client";

import { useState, useTransition } from "react";
import { saveAccessPolicyAction } from "@/actions/admin";
import { Button, Field, Notice, Textarea } from "@/components/ui";
import { useI18n } from "@/i18n/provider";
import type { AccessPolicy } from "@/lib/types";

export function AccessPolicyForm({ policy }: { policy: AccessPolicy }) {
  const { t } = useI18n();
  const a = t.admin;
  const [emails, setEmails] = useState(policy.allowedEmails.join("\n"));
  const [domains, setDomains] = useState(policy.allowedDomains.join("\n"));
  const [open, setOpen] = useState(policy.registrationOpen);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await saveAccessPolicyAction({ allowedEmails: emails, allowedDomains: domains, registrationOpen: open });
      setNotice(res.ok ? { tone: "success", text: res.message ?? t.common.saved } : { tone: "danger", text: res.error });
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{a.policyTitle}</h2>
        <p className="text-sm text-fg-2">{a.policyHint}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={a.allowedEmails} hint={a.allowedEmailsHint}>
          <Textarea value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={a.allowedEmailsPlaceholder} />
        </Field>
        <Field label={a.allowedDomains} hint={a.allowedDomainsHint}>
          <Textarea value={domains} onChange={(e) => setDomains(e.target.value)} placeholder={a.allowedDomainsPlaceholder} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="h-4 w-4" />
        {a.registrationOpen}
      </label>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <Button onClick={save} disabled={pending}>
        {pending ? t.common.saving : a.savePolicy}
      </Button>
    </div>
  );
}
