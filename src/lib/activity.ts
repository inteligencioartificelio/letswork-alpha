import "server-only";
import { getDB } from "./db";
import { activityLog, notifications } from "@/db/schema";
import { emit, workspaceChannel, userChannel } from "./realtime";

export interface ActivityInput {
  workspaceId: string;
  userId: string;
  entityType: string; // "task" | "project" | "workspace" | "comment" | "label"
  entityId?: string;
  action: string; // "create" | "update" | "delete" | "move" | "complete" | "assign" | "comment"
  meta?: Record<string, unknown>;
  text: string; // mensaje legible para el feed
}

/** Registra una entrada de activity log y emite evento al canal del workspace. */
export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    const db = await getDB();
    await db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      meta: { ...input.meta, text: input.text },
    });
  } catch {
    /* best-effort */
  }
  await emit(workspaceChannel(input.workspaceId), {
    type: "activity",
    workspaceId: input.workspaceId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    text: input.text,
    userId: input.userId,
  });
}

/** Emite un evento "refresh" al canal del workspace (sin escribir log). */
export async function emitRefresh(
  workspaceId: string,
  entityType: string,
  entityId?: string,
): Promise<void> {
  await emit(workspaceChannel(workspaceId), {
    type: "refresh",
    workspaceId,
    entityType,
    entityId,
  });
}

/** Crea una notificación para un usuario y emite a su canal personal. */
export async function notifyUser(
  userId: string,
  notif: {
    type: string;
    body: string;
    link?: string;
  },
): Promise<void> {
  if (!userId) return;
  try {
    const db = await getDB();
    await db.insert(notifications).values({
      userId,
      type: notif.type,
      body: notif.body,
      link: notif.link ?? null,
    });
  } catch {
    /* best-effort */
  }
  await emit(userChannel(userId), {
    type: "notification",
    userId,
    notifType: notif.type,
    body: notif.body,
    link: notif.link,
  });
}
