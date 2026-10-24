import type { Metadata } from "next";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { TelegramCard } from "@/components/settings/telegram-card";
import { Avatar } from "@/components/shell/header";
import { Card, PageHeader } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { requireUser } from "@/server/session";
import { getTelegramChannel } from "@/server/telegram-link";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const user = await requireUser();
  const channel = await getTelegramChannel(user.id);
  const botConfigured = Boolean(getEnv().TELEGRAM_BOT_TOKEN);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Cài đặt" description="Tài khoản, kênh nhận nhắc việc và lịch nhắc của riêng bạn." />

      <Card className="flex items-center gap-4 p-6">
        <Avatar name={user.name} image={user.image} size={56} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{user.name}</p>
          <p className="truncate text-sm text-fg-2">{user.email} · đăng nhập bằng Google</p>
          {user.role === "ADMIN" && <p className="mt-1 text-xs font-semibold text-brand">Quản trị viên</p>}
        </div>
      </Card>

      <TelegramCard
        botConfigured={botConfigured}
        linked={Boolean(channel?.enabled && channel.chatId)}
        username={channel?.username ?? null}
      />

      <PreferencesForm timezone={user.timezone} settings={user.settings} />
    </div>
  );
}
