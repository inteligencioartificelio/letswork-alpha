import type { Task, Project } from "@/db/schema";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function monogram(name: string): string {
  return (name || "?").substring(0, 2).toUpperCase();
}

export function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

export function formatDateLong(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function relativeDue(d: Date | string | null | undefined): { label: string; soon: boolean; overdue: boolean } {
  if (!d) return { label: "", soon: false, overdue: false };
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return { label: "Hoy", soon: true, overdue: false };
  if (diff === 1) return { label: "Mañana", soon: true, overdue: false };
  if (diff < 0) return { label: `${Math.abs(diff)}d atrás`, soon: false, overdue: true };
  if (diff <= 3) return { label: `En ${diff}d`, soon: true, overdue: false };
  return { label: formatDateShort(date), soon: false, overdue: false };
}

export const TASK_STATUSES: Task["status"][] = ["backlog", "todo", "in_progress", "in_review", "done"];

export const TASK_STATUS_META: Record<Task["status"], { label: string; hint: string }> = {
  backlog: { label: "Backlog", hint: "Sin empezar" },
  todo: { label: "Por Hacer", hint: "Listo para empezar" },
  in_progress: { label: "En Progreso", hint: "Trabajando ahora" },
  in_review: { label: "En Revisión", hint: "Pendiente de revisar" },
  done: { label: "Hecho", hint: "Completado" },
};

export const PRIORITY_META: Record<Task["priority"], { label: string; style: string }> = {
  low: { label: "Baja", style: "border-ink-border text-ink-muted" },
  medium: { label: "Media", style: "border-ink-border bg-surface text-ink" },
  high: { label: "Alta", style: "border-ink-border bg-ink text-paper" },
  urgent: { label: "Urgente", style: "border-ink-border text-highlight font-bold" },
};

export const PROJECT_STATUS_META: Record<Project["status"], { label: string; style: string }> = {
  planned: { label: "Planificado", style: "border-ink-border text-ink-muted" },
  active: { label: "Activo", style: "border-ink-border bg-surface text-ink" },
  completed: { label: "Completado", style: "bg-ink text-paper border-ink-border" },
  paused: { label: "Pausado", style: "border-dashed border-ink-border text-ink-muted" },
  archived: { label: "Archivado", style: "border-ink-border text-ink-muted italic" },
};

export function progressBar(percent: number): string {
  const p = Math.max(0, Math.min(100, percent));
  const filled = Math.round(p / 10);
  const empty = 10 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${p}%`;
}
