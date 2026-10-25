"use client";

import { Link2, Send, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTelegramLinkAction, sendTelegramTestAction, unlinkTelegramAction } from "@/actions/settings";
import { Button, Card, Notice } from "@/components/ui";
import { useI18n } from "@/i18n/provider";

export function TelegramCard({ botConfigured, linked, username }: { botConfigured: boolean; linked: boolean; username: string | null }) {
  const { t } = useI18n();
  const tg = t.telegram;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  function connect() {
    setNotice(null);
    startTransition(async () => {
      const res = await createTelegramLinkAction();
      if (res.ok) {
        setLink(res.url);
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else setNotice({ tone: "danger", text: res.error });
    });
  }

  function test() {
    startTransition(async () => {
      const res = await sendTelegramTestAction();
      setNotice(res.ok ? { tone: "success", text: res.message ?? tg.sent } : { tone: "danger", text: res.error });
    });
  }

  function unlink() {
    if (!confirm(tg.confirmUnlink)) return;
    startTransition(async () => {
      await unlinkTelegramAction();
      setLink(null);
      router.refresh();
    });
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{tg.title}</h2>
          <p className="text-sm text-fg-2">{linked ? tg.linked(username) : tg.notLinked}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${linked ? "bg-success/15 text-[#4f8f00] dark:text-success" : "bg-hover text-fg-2"}`}>
          {linked ? tg.badgeLinked : tg.badgeNotLinked}
        </span>
      </div>

      {!botConfigured && <Notice tone="warning">{tg.notConfigured}</Notice>}
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {link && !linked && (
        <Notice tone="info">
          {tg.openedBefore} <b>Start</b> {tg.openedMiddle}{" "}
          <button type="button" className="underline" onClick={() => router.refresh()}>
            {tg.reload}
          </button>
          {tg.openedAfter}{" "}
          <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
            {tg.reopen}
          </a>
        </Notice>
      )}

      <div className="flex flex-wrap gap-2">
        {linked ? (
          <>
            <Button variant="secondary" size="sm" onClick={test} disabled={pending}>
              <Send size={15} /> {tg.sendTest}
            </Button>
            <Button variant="danger" size="sm" onClick={unlink} disabled={pending}>
              <Unlink size={15} /> {tg.unlink}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={connect} disabled={pending || !botConfigured}>
            <Link2 size={15} /> {tg.connect}
          </Button>
        )}
      </div>
    </Card>
  );
}
