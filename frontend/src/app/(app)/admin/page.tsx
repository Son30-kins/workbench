import type { Metadata } from "next";
import { AccessPolicyForm } from "@/components/admin/access-policy-form";
import { UserTable } from "@/components/admin/user-table";
import { Card, Notice, PageHeader } from "@/components/ui";
import { getI18n } from "@/i18n/server";
import { getAccessPolicy, getAdminStatus, listUsersForAdmin } from "@/server/queries";
import { requireAdmin } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.admin };
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const { t } = await getI18n();
  const a = t.admin;
  const [users, policy, status] = await Promise.all([listUsersForAdmin(), getAccessPolicy(), getAdminStatus()]);
  const telegramConfigured = status.telegramConfigured;
  const bot = { username: status.botUsername };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={a.title} description={a.description} />

      {!telegramConfigured && (
        <Notice tone="warning">
          {a.noTokenBefore} <code>TELEGRAM_BOT_TOKEN</code> {a.noTokenMiddle} <code>.env</code> {a.noTokenAfter}{" "}
          <code>docker compose up -d</code>.
        </Notice>
      )}
      {telegramConfigured && !bot?.username && (
        <Notice tone="warning">
          {a.botNotConnected} <code>docker compose logs api</code>.
        </Notice>
      )}
      {telegramConfigured && bot?.username && <Notice tone="success">{a.botActive(bot.username)}</Notice>}

      <Card className="p-6">
        <AccessPolicyForm policy={policy} />
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{a.users(users.length)}</h2>
        <UserTable users={users} currentUserId={admin.id} />
      </section>
    </div>
  );
}
