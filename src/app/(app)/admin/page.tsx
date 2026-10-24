import type { Metadata } from "next";
import { AccessPolicyForm } from "@/components/admin/access-policy-form";
import { UserTable } from "@/components/admin/user-table";
import { Card, Notice, PageHeader } from "@/components/ui";
import { getEnv } from "@/lib/env";
import { getAccessPolicy, getTelegramBotInfo } from "@/server/app-settings";
import { requireAdmin } from "@/server/session";
import { listUsersForAdmin } from "@/server/users";

export const metadata: Metadata = { title: "Quản trị" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, policy, bot] = await Promise.all([listUsersForAdmin(), getAccessPolicy(), getTelegramBotInfo()]);
  const telegramConfigured = Boolean(getEnv().TELEGRAM_BOT_TOKEN);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Quản trị" description="Người dùng và chính sách đăng nhập của bản cài này." />

      {!telegramConfigured && (
        <Notice tone="warning">
          Chưa cấu hình <code>TELEGRAM_BOT_TOKEN</code> trong <code>.env</code> — người dùng sẽ không nhận được nhắc việc qua Telegram
          (vẫn có thông báo trong app). Tạo bot qua @BotFather rồi chạy lại <code>docker compose up -d</code>.
        </Notice>
      )}
      {telegramConfigured && !bot?.username && (
        <Notice tone="warning">Đã có token Telegram nhưng worker chưa kết nối được bot. Kiểm tra log: <code>docker compose logs worker</code>.</Notice>
      )}
      {telegramConfigured && bot?.username && <Notice tone="success">Bot Telegram đang hoạt động: @{bot.username}</Notice>}

      <Card className="p-6">
        <AccessPolicyForm policy={policy} />
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Người dùng ({users.length})</h2>
        <UserTable users={users} currentUserId={admin.id} />
      </section>
    </div>
  );
}
