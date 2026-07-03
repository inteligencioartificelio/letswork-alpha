"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDB } from "@/lib/db";
import {
  users,
  workspaces,
  workspaceMembers,
  projects,
  tasks,
  labels,
  taskLabels,
  notifications,
} from "@/db/schema";
import {
  getCurrentUser,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { recordActivity, notifyUser, emitRefresh } from "@/lib/activity";
import { TASK_STATUS_META } from "@/lib/utils";
import type { Task, Project } from "@/db/schema";

export type ActionResult = { error?: string; success: boolean };

function bad(message: string): ActionResult {
  return { error: message, success: false };
}

/* ============ AUTH ============ */

export async function loginAction(prevState: any, formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) return bad("Usuario y contraseña requeridos.");

  const db = await getDB();
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return bad("Credenciales inválidas.");
  }

  await setSessionCookie(user);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function registerAction(prevState: any, formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirmPassword") || "");

  if (username.length < 3) return bad("El usuario debe tener al menos 3 caracteres.");
  if (password.length < 6) return bad("La contraseña debe tener al menos 6 caracteres.");
  if (password !== confirm) return bad("Las contraseñas no coinciden.");

  const db = await getDB();
  const [existing] = await db.select().from(users).where(eq(users.username, username));
  if (existing) return bad("Ese nombre de usuario ya está registrado.");

  const [user] = await db
    .insert(users)
    .values({ username, passwordHash: hashPassword(password), displayName: username })
    .returning();

  await setSessionCookie(user);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}

/* ============ USER SETTINGS ============ */

export async function updateUserSettingsAction(
  themePreset: string,
  dualInkMode: boolean,
  compactLayout: boolean,
) {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  await db
    .update(users)
    .set({ themePreset, dualInkMode, compactLayout })
    .where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { success: true };
}

/* ============ WORKSPACES ============ */

export async function createWorkspaceAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) return bad("El nombre es obligatorio.");

  const db = await getDB();
  const [ws] = await db
    .insert(workspaces)
    .values({ name, description, createdBy: user.id })
    .returning();
  await db
    .insert(workspaceMembers)
    .values({ workspaceId: ws.id, userId: user.id, role: "owner" });
  await recordActivity({
    workspaceId: ws.id,
    userId: user.id,
    entityType: "workspace",
    entityId: ws.id,
    action: "create",
    text: `creó el espacio "${ws.name}"`,
  });
  revalidatePath("/", "layout");
  redirect(`/r/${ws.id}`);
}

export async function updateWorkspaceAction(id: string, name: string, description: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  await db.update(workspaces).set({ name, description }).where(eq(workspaces.id, id));
  await emitRefresh(id, "workspace");
  revalidatePath("/", "layout");
  revalidatePath(`/r/${id}`);
  return { success: true };
}

export async function deleteWorkspaceAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  await db.delete(workspaces).where(eq(workspaces.id, id));
  revalidatePath("/", "layout");
  redirect("/");
}

/* ============ PROJECTS ============ */

export async function createProjectAction(
  workspaceId: string,
  name: string,
  description: string,
  status: Project["status"],
  dueDateStr?: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  if (!name.trim()) return bad("El nombre del proyecto es obligatorio.");
  const db = await getDB();
  const [prj] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: name.trim(),
      description: description.trim(),
      status,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      createdBy: user.id,
    })
    .returning();
  await recordActivity({
    workspaceId,
    userId: user.id,
    entityType: "project",
    entityId: prj.id,
    action: "create",
    text: `creó el proyecto "${prj.name}"`,
  });
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

export async function updateProjectAction(
  workspaceId: string,
  id: string,
  data: Partial<Pick<Project, "name" | "description" | "status" | "dueDate">>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  const patch: any = { ...data };
  if (data.dueDate !== undefined) {
    patch.dueDate = data.dueDate ? new Date(data.dueDate as any) : null;
  }
  await db.update(projects).set(patch).where(eq(projects.id, id));
  await emitRefresh(workspaceId, "project", id);
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

export async function deleteProjectAction(workspaceId: string, id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  const [prj] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, id));
  await db.delete(projects).where(eq(projects.id, id));
  await recordActivity({
    workspaceId,
    userId: user.id,
    entityType: "project",
    entityId: id,
    action: "delete",
    text: `eliminó el proyecto "${prj?.name ?? ""}"`,
  });
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

/* ============ TASKS ============ */

export async function createTaskAction(args: {
  workspaceId: string;
  projectId?: string;
  title: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  dueDateStr?: string;
  assignedTo?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  if (!args.title.trim()) return bad("El título es obligatorio.");
  const db = await getDB();
  const [tsk] = await db
    .insert(tasks)
    .values({
      workspaceId: args.workspaceId,
      projectId: args.projectId || null,
      title: args.title.trim(),
      description: args.description?.trim() || null,
      status: args.status ?? "todo",
      priority: args.priority ?? "medium",
      dueDate: args.dueDateStr ? new Date(args.dueDateStr) : null,
      assignedTo: args.assignedTo || null,
      createdBy: user.id,
    })
    .returning();
  await recordActivity({
    workspaceId: args.workspaceId,
    userId: user.id,
    entityType: "task",
    entityId: tsk.id,
    action: "create",
    text: `creó la tarea "${tsk.title}"`,
  });
  if (tsk.assignedTo && tsk.assignedTo !== user.id) {
    await notifyUser(tsk.assignedTo, {
      type: "assignment",
      body: `${user.username} te asignó: ${tsk.title}`,
      link: `/r/${args.workspaceId}?task=${tsk.id}`,
    });
  }
  revalidatePath(`/r/${args.workspaceId}`);
  return { success: true };
}

export async function updateTaskAction(
  workspaceId: string,
  id: string,
  patch: Partial<Omit<Task, "id" | "createdAt" | "workspaceId">>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  const clean: any = { ...patch, updatedAt: new Date() };
  if (patch.dueDate !== undefined) {
    clean.dueDate = patch.dueDate ? new Date(patch.dueDate as any) : null;
  }
  // Notificar reasignación
  if (patch.assignedTo !== undefined && patch.assignedTo && patch.assignedTo !== user.id) {
    const [t] = await db.select({ title: tasks.title, assignedTo: tasks.assignedTo }).from(tasks).where(eq(tasks.id, id));
    if (t && t.assignedTo !== patch.assignedTo) {
      await notifyUser(patch.assignedTo, {
        type: "assignment",
        body: `${user.username} te asignó: ${t.title}`,
        link: `/r/${workspaceId}?task=${id}`,
      });
      await recordActivity({
        workspaceId,
        userId: user.id,
        entityType: "task",
        entityId: id,
        action: "assign",
        text: `asignó "${t.title}"`,
      });
    }
  }
  await db.update(tasks).set(clean).where(eq(tasks.id, id));
  await emitRefresh(workspaceId, "task", id);
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

export async function toggleTaskDoneAction(workspaceId: string, id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!t) return bad("Tarea no encontrada");
  const next: Task["status"] = t.status === "done" ? "todo" : "done";
  await db
    .update(tasks)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(tasks.id, id));
  await recordActivity({
    workspaceId,
    userId: user.id,
    entityType: "task",
    entityId: id,
    action: next === "done" ? "complete" : "reopen",
    text: next === "done" ? `completó "${t.title}"` : `reabrió "${t.title}"`,
    meta: { status: next },
  });
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

export async function deleteTaskAction(workspaceId: string, id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  const [t] = await db.select({ title: tasks.title }).from(tasks).where(eq(tasks.id, id));
  await db.delete(tasks).where(eq(tasks.id, id));
  await recordActivity({
    workspaceId,
    userId: user.id,
    entityType: "task",
    entityId: id,
    action: "delete",
    text: `eliminó la tarea "${t?.title ?? ""}"`,
  });
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

/** Mueve una tarea a un estado/columna y a un índice concreto (Kanban DnD). */
export async function moveTaskAction(
  workspaceId: string,
  taskId: string,
  toStatus: Task["status"],
  toIndex: number,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();

  const [moved] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!moved || moved.workspaceId !== workspaceId) return bad("Tarea no encontrada");

  const affectedStatuses = Array.from(new Set([moved.status, toStatus]));
  for (const st of affectedStatuses) {
    const colTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.status, st)))
      .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));

    const filtered = colTasks.filter((t) => t.id !== taskId);
    if (st === toStatus) {
      const idx = Math.max(0, Math.min(toIndex, filtered.length));
      filtered.splice(idx, 0, { ...moved, status: toStatus });
    }

    for (let i = 0; i < filtered.length; i++) {
      const t = filtered[i];
      if (t.id === taskId) {
        await db
          .update(tasks)
          .set({ status: toStatus, sortOrder: i, updatedAt: new Date() })
          .where(eq(tasks.id, t.id));
      } else if (t.sortOrder !== i) {
        await db.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, t.id));
      }
    }
  }

  await recordActivity({
    workspaceId,
    userId: user.id,
    entityType: "task",
    entityId: taskId,
    action: "move",
    text: `movió "${moved.title}" a ${TASK_STATUS_META[toStatus].label}`,
    meta: { toStatus, toIndex },
  });
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

/* ============ LABELS ============ */

export async function createLabelAction(workspaceId: string, name: string, color: string) {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  if (!name.trim()) return bad("El nombre de la etiqueta es obligatorio.");
  const db = await getDB();
  const [label] = await db
    .insert(labels)
    .values({ workspaceId, name: name.trim(), color })
    .onConflictDoNothing()
    .returning();
  await emitRefresh(workspaceId, "label");
  revalidatePath(`/r/${workspaceId}`);
  return { success: true, label };
}

export async function deleteLabelAction(workspaceId: string, id: string) {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  await db.delete(labels).where(eq(labels.id, id));
  await emitRefresh(workspaceId, "label");
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

export async function toggleTaskLabelAction(workspaceId: string, taskId: string, labelId: string) {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  const [existing] = await db
    .select()
    .from(taskLabels)
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));
  if (existing) {
    await db
      .delete(taskLabels)
      .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));
  } else {
    await db.insert(taskLabels).values({ taskId, labelId }).onConflictDoNothing();
  }
  await emitRefresh(workspaceId, "task", taskId);
  revalidatePath(`/r/${workspaceId}`);
  return { success: true };
}

/* ============ NOTIFICATIONS ============ */

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return bad("No autorizado");
  const db = await getDB();
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
  revalidatePath("/", "layout");
  return { success: true };
}
