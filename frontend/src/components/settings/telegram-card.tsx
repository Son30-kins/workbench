"use client";

import { Link2, Send, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTelegramLinkAction, sendTelegramTestAction, unlinkTelegramAction } from "@/actions/settings";
import { Button, Card, Notice } from "@/components/ui";

export function TelegramCard({ botConfigured, linked, username }: { botConfigured: boolean; linked: boolean; username: string | null }) {
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
      setNotice(res.ok ? { tone: "success", text: res.message ?? "Đã gửi" } : { tone: "danger", text: res.error });
    });
  }

  function unlink() {
    if (!confirm("Ngắt kết nối Telegram? Bạn sẽ không nhận nhắc việc qua Telegram nữa.")) return;
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
          <h2 className="text-lg font-bold">Nhắc việc qua Telegram</h2>
          <p className="text-sm text-fg-2">
            {linked
              ? `Đã kết nối${username ? ` với @${username}` : ""}. Tin nhắc có nút Xong / Hoãn ngay trong Telegram.`
              : "Kết nối để nhận nhắc việc trên điện thoại trước khi task đến hạn."}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${linked ? "bg-success/15 text-[#4f8f00] dark:text-success" : "bg-hover text-fg-2"}`}>
          {linked ? "Đã kết nối" : "Chưa kết nối"}
        </span>
      </div>

      {!botConfigured && <Notice tone="warning">Bản cài này chưa cấu hình Telegram bot (TELEGRAM_BOT_TOKEN). Báo admin để bật tính năng này.</Notice>}
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {link && !linked && (
        <Notice tone="info">
          Telegram đã được mở trong tab mới — bấm <b>Start</b> trong cuộc trò chuyện với bot, rồi{" "}
          <button type="button" className="underline" onClick={() => router.refresh()}>
            tải lại trang này
          </button>
          . Link hết hạn sau 10 phút.{" "}
          <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
            Mở lại link
          </a>
        </Notice>
      )}

      <div className="flex flex-wrap gap-2">
        {linked ? (
          <>
            <Button variant="secondary" size="sm" onClick={test} disabled={pending}>
              <Send size={15} /> Gửi tin thử
            </Button>
            <Button variant="danger" size="sm" onClick={unlink} disabled={pending}>
              <Unlink size={15} /> Ngắt kết nối
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={connect} disabled={pending || !botConfigured}>
            <Link2 size={15} /> Kết nối Telegram
          </Button>
        )}
      </div>
    </Card>
  );
}
