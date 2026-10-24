import type { Metadata } from "next";
import { Board } from "@/components/tasks/board";
import { TasksToolbar } from "@/components/tasks/toolbar";
import { requireUser } from "@/server/session";
import { getTask, listTasks, TASK_VIEWS, type TaskView } from "@/server/tasks";

export const metadata: Metadata = { title: "Bảng công việc" };

export default async function BoardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = TASK_VIEWS.includes(sp.view as TaskView) ? (sp.view as TaskView) : "all";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const now = new Date();
  const [tasks, openTask] = await Promise.all([
    listTasks(user.id, { view, q, tz: user.timezone, now }),
    typeof sp.task === "string" ? getTask(user.id, sp.task) : null,
  ]);

  return (
    <>
      <TasksToolbar />
      <Board tasks={tasks} tz={user.timezone} now={now.getTime()} openTask={openTask} />
    </>
  );
}
