import { AutoRefresh } from "@/components/shell/auto-refresh";
import { Header } from "@/components/shell/header";
import { Panel } from "@/components/shell/panel";
import { MobileNav, Sidebar } from "@/components/shell/sidebar";
import { TaskDialogProvider } from "@/components/tasks/task-dialog";
import { formatInTz } from "@/core/time";
import { countTasks, listNotifications, listTemplates } from "@/server/queries";
import { requireUser } from "@/server/session";

// Mọi trang trong app đều theo người dùng đang đăng nhập — không render sẵn lúc build
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [counts, templates, notifications] = await Promise.all([
    countTasks(),
    listTemplates(),
    listNotifications(),
  ]);

  return (
    <TaskDialogProvider tz={user.timezone}>
      <div className="flex min-h-screen">
        <Sidebar isAdmin={user.role === "ADMIN"} />
        <Panel counts={counts} templates={templates.map((t) => ({ id: t.id, name: t.name }))} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            user={{ name: user.name, email: user.email, image: user.image, role: user.role }}
            notifications={notifications.items}
            unread={notifications.unread}
            todayLabel={formatInTz(new Date(), user.timezone, "dd MMMM yyyy")}
            tz={user.timezone}
          />
          <main className="flex-1 px-4 pb-28 md:px-8 md:pb-10">{children}</main>
        </div>
        <MobileNav isAdmin={user.role === "ADMIN"} />
      </div>
      <AutoRefresh />
    </TaskDialogProvider>
  );
}
