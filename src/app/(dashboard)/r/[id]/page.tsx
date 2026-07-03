import { notFound, redirect } from "next/navigation";
import { eq, asc, desc } from "drizzle-orm";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  workspaces,
  projects,
  tasks,
  labels,
  taskLabels,
  workspaceMembers,
  users,
  activityLog,
} from "@/db/schema";
import WorkspaceView from "@/components/workspace-view";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string; project?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;

  const db = await getDB();
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
  if (!ws) notFound();

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, ws.id));
  const memberRows = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName })
    .from(users)
    .innerJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, ws.id));
  const isMember = memberRows.some((m) => m.id === user.id);
  if (!isMember) redirect("/");

  const [prjList, tskList, labelList] = await Promise.all([
    db.select().from(projects).where(eq(projects.workspaceId, ws.id)).orderBy(asc(projects.sortOrder)),
    db.select().from(tasks).where(eq(tasks.workspaceId, ws.id)).orderBy(asc(tasks.sortOrder)),
    db.select().from(labels).where(eq(labels.workspaceId, ws.id)).orderBy(asc(labels.name)),
  ]);

  const taskLabelRows =
    tskList.length === 0
      ? []
      : await db
          .select({
            taskId: taskLabels.taskId,
            labelId: taskLabels.labelId,
            name: labels.name,
            color: labels.color,
          })
          .from(taskLabels)
          .innerJoin(labels, eq(labels.id, taskLabels.labelId))
          .where(eq(labels.workspaceId, ws.id));

  const labelsByTask = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const r of taskLabelRows) {
    const arr = labelsByTask.get(r.taskId) ?? [];
    arr.push({ id: r.labelId, name: r.name, color: r.color });
    labelsByTask.set(r.taskId, arr);
  }

  const activityRows = await db
    .select({
      id: activityLog.id,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      action: activityLog.action,
      meta: activityLog.meta,
      createdAt: activityLog.createdAt,
      userId: activityLog.userId,
      username: users.username,
      displayName: users.displayName,
    })
    .from(activityLog)
    .innerJoin(users, eq(users.id, activityLog.userId))
    .where(eq(activityLog.workspaceId, ws.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(30);

  const initialActivity = activityRows.map((r) => ({
    id: r.id,
    text: (r.meta as any)?.text ?? r.action,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    userId: r.userId,
    username: r.username,
    displayName: r.displayName,
    createdAt: r.createdAt,
  }));

  return (
    <WorkspaceView
      workspace={ws}
      projects={prjList}
      tasks={tskList.map((t) => ({ ...t, labels: labelsByTask.get(t.id) ?? [] }))}
      members={memberRows}
      labels={labelList}
      currentUser={user}
      initialActivity={initialActivity}
      initialProjectFilter={sp.project}
      initialOpenTaskId={sp.task}
    />
  );
}
