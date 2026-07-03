"use server";

import { and, eq, ilike, or, asc, desc, inArray } from "drizzle-orm";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import {
  tasks,
  projects,
  workspaces,
  workspaceMembers,
  users,
  labels,
  taskLabels,
  taskComments,
  activityLog,
  notifications,
} from "@/db/schema";

export async function searchAction(query: string) {
  const user = await getCurrentUser();
  if (!user) return { workspaces: [], projects: [], tasks: [] };
  const q = query.trim();
  if (q.length < 1) return { workspaces: [], projects: [], tasks: [] };

  const db = await getDB();

  const memberRows = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id));
  const wsIds = memberRows.map((m) => m.workspaceId);
  if (wsIds.length === 0) return { workspaces: [], projects: [], tasks: [] };

  const pattern = `%${q}%`;
  const [wsResults, prjResults, tskResults] = await Promise.all([
    db
      .select({ id: workspaces.id, name: workspaces.name, description: workspaces.description })
      .from(workspaces)
      .where(and(inArray(workspaces.id, wsIds), or(ilike(workspaces.name, pattern), ilike(workspaces.description, pattern))))
      .limit(5),
    db
      .select({ id: projects.id, name: projects.name, workspaceId: projects.workspaceId })
      .from(projects)
      .where(and(inArray(projects.workspaceId, wsIds), ilike(projects.name, pattern)))
      .limit(5),
    db
      .select({ id: tasks.id, title: tasks.title, workspaceId: tasks.workspaceId, status: tasks.status })
      .from(tasks)
      .where(and(inArray(tasks.workspaceId, wsIds), ilike(tasks.title, pattern)))
      .orderBy(desc(tasks.updatedAt))
      .limit(8),
  ]);

  return { workspaces: wsResults, projects: prjResults, tasks: tskResults };
}

export async function getTaskContextAction(taskId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = await getDB();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) return null;

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, task.workspaceId));
  if (!ws) return null;

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, user.id)));
  if (!membership) return null;

  const [prjList, memberList, labelList, taskLabelRows, commentList] = await Promise.all([
    db.select().from(projects).where(eq(projects.workspaceId, ws.id)).orderBy(asc(projects.sortOrder)),
    db
      .select({ id: users.id, username: users.username, displayName: users.displayName })
      .from(users)
      .innerJoin(workspaceMembers, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, ws.id)),
    db.select().from(labels).where(eq(labels.workspaceId, ws.id)).orderBy(asc(labels.name)),
    db.select().from(taskLabels).where(eq(taskLabels.taskId, taskId)),
    db
      .select({
        id: taskComments.id,
        body: taskComments.body,
        createdAt: taskComments.createdAt,
        userId: taskComments.userId,
        username: users.username,
        displayName: users.displayName,
      })
      .from(taskComments)
      .innerJoin(users, eq(users.id, taskComments.userId))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt)),
  ]);

  return {
    task,
    workspace: ws,
    projects: prjList,
    members: memberList,
    labels: labelList,
    taskLabelIds: taskLabelRows.map((r) => r.labelId),
    comments: commentList,
    currentUserId: user.id,
  };
}

export async function createCommentAction(workspaceId: string, taskId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "No autorizado" };
  if (!body.trim()) return { error: "Comentario vacío" };
  const db = await getDB();
  await db.insert(taskComments).values({ taskId, userId: user.id, body: body.trim() });
  const [t] = await db.select({ title: tasks.title, assignedTo: tasks.assignedTo }).from(tasks).where(eq(tasks.id, taskId));
  await recordActivity({
    workspaceId,
    userId: user.id,
    entityType: "comment",
    entityId: taskId,
    action: "comment",
    text: `comentó en "${t?.title ?? "tarea"}"`,
  });
  // Notifica al asignado si no es el propio autor
  if (t?.assignedTo && t.assignedTo !== user.id) {
    const { notifyUser } = await import("@/lib/activity");
    await notifyUser(t.assignedTo, {
      type: "comment",
      body: `${user.username} comentó en: ${t.title}`,
      link: `/r/${workspaceId}?task=${taskId}`,
    });
  }
  return { success: true };
}

/* ============ NOTIFICATIONS + ACTIVITY (lecturas) ============ */

export async function getNotificationsAction() {
  const user = await getCurrentUser();
  if (!user) return { unread: 0, items: [] };
  const db = await getDB();
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  const unread = items.filter((n) => !n.read).length;
  return { unread, items };
}

export async function getActivityFeedAction(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  const db = await getDB();
  const rows = await db
    .select({
      id: activityLog.id,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      action: activityLog.action,
      meta: activityLog.meta,
      text: activityLog.meta,
      createdAt: activityLog.createdAt,
      userId: activityLog.userId,
      username: users.username,
      displayName: users.displayName,
    })
    .from(activityLog)
    .innerJoin(users, eq(users.id, activityLog.userId))
    .where(eq(activityLog.workspaceId, workspaceId))
    .orderBy(desc(activityLog.createdAt))
    .limit(30);
  // reconstruct text from meta stored separately — we store text in meta.text
  return rows.map((r) => ({
    id: r.id,
    entityType: r.entityType,
    entityId: r.entityId,
    action: r.action,
    text: (r.meta as any)?.text ?? r.action,
    createdAt: r.createdAt,
    userId: r.userId,
    username: r.username,
    displayName: r.displayName,
  }));
}
