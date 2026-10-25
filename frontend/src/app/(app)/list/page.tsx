import type { Metadata } from "next";
import { TaskTable } from "@/components/tasks/task-table";
import { TasksToolbar } from "@/components/tasks/toolbar";
import { getI18n } from "@/i18n/server";
import { listTasks, TASK_VIEWS, type TaskView } from "@/server/queries";
import { requireUser } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.list };
}

export default async function ListPage({ searchParams }: PageProps<"/list">) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = TASK_VIEWS.includes(sp.view as TaskView) ? (sp.view as TaskView) : "all";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const now = new Date();
  const tasks = await listTasks({ view, q });

  return (
    <>
      <TasksToolbar />
      <TaskTable tasks={tasks} tz={user.timezone} now={now.getTime()} />
    </>
  );
}
