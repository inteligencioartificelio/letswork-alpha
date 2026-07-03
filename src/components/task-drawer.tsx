"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Trash2,
  Calendar,
  User as UserIcon,
  Flag,
  MessageSquare,
  Plus,
  Tag,
  Check,
  Send,
} from "lucide-react";
import { getTaskContextAction, createCommentAction } from "@/app/data-actions";
import {
  updateTaskAction,
  deleteTaskAction,
  toggleTaskLabelAction,
} from "@/app/actions";
import { toast } from "sonner";
import {
  TASK_STATUS_META,
  PRIORITY_META,
  formatDateLong,
  monogram,
  cn,
} from "@/lib/utils";
import type { Task, Project, Label } from "@/db/schema";

interface Context {
  task: Task;
  projects: Project[];
  members: { id: string; username: string; displayName: string | null }[];
  labels: Label[];
  taskLabelIds: string[];
  comments: {
    id: string;
    body: string;
    createdAt: Date | string;
    userId: string;
    username: string;
    displayName: string | null;
  }[];
  currentUserId: string;
}

export default function TaskDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const [ctx, setCtx] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTaskContextAction(task.id).then((data) => {
      if (!alive) return;
      setCtx((data as Context) ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [task.id]);

  const patch = async (changes: Partial<Task>) => {
    if (!ctx) return;
    setCtx({ ...ctx, task: { ...ctx.task, ...changes } });
    startTransition(async () => {
      const res = await updateTaskAction(ctx.task.workspaceId, ctx.task.id, changes as any);
      if (res?.error) toast.error(res.error);
    });
  };

  const handleDelete = async () => {
    if (!ctx) return;
    if (confirm("¿Eliminar esta tarea permanentemente?")) {
      await deleteTaskAction(ctx.task.workspaceId, ctx.task.id);
      onClose();
    }
  };

  const toggleLabel = async (labelId: string) => {
    if (!ctx) return;
    const has = ctx.taskLabelIds.includes(labelId);
    setCtx({
      ...ctx,
      taskLabelIds: has
        ? ctx.taskLabelIds.filter((id) => id !== labelId)
        : [...ctx.taskLabelIds, labelId],
    });
    startTransition(async () => {
      await toggleTaskLabelAction(ctx.task.workspaceId, ctx.task.id, labelId);
    });
  };

  const submitComment = async () => {
    if (!ctx || !comment.trim()) return;
    const body = comment.trim();
    setComment("");
    const newComment = {
      id: `tmp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      userId: ctx.currentUserId,
      username:
        ctx.members.find((m) => m.id === ctx.currentUserId)?.username || "tú",
      displayName: ctx.members.find((m) => m.id === ctx.currentUserId)?.displayName || null,
    };
    setCtx({ ...ctx, comments: [...ctx.comments, newComment] });
    startTransition(async () => {
      await createCommentAction(ctx.task.workspaceId, ctx.task.id, body);
    });
  };

  return (
    <div className="fixed inset-0 z-[75] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg h-full bg-paper border-l border-ink-border flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-border bg-surface">
          <span className="text-[10px] font-technical uppercase tracking-widest text-ink-muted">
            Detalle de Tarea
          </span>
          <div className="flex items-center gap-1">
            <button onClick={handleDelete} className="p-1.5 hover:bg-ink hover:text-paper" title="Eliminar">
              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-ink hover:text-paper" title="Cerrar">
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {loading || !ctx ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-ink-muted italic">
            Cargando…
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
            {/* Title */}
            <input
              value={ctx.task.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="w-full bg-transparent text-lg font-editorial font-medium tracking-tight border-b border-transparent focus:border-ink focus:outline-none py-1"
            />

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estado" icon={<Check className="w-3 h-3" strokeWidth={2.5} />}>
                <SelectInput
                  value={ctx.task.status}
                  onChange={(v) => patch({ status: v as Task["status"] })}
                  options={Object.entries(TASK_STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
                />
              </Field>
              <Field label="Prioridad" icon={<Flag className="w-3 h-3" strokeWidth={2.5} />}>
                <SelectInput
                  value={ctx.task.priority}
                  onChange={(v) => patch({ priority: v as Task["priority"] })}
                  options={Object.entries(PRIORITY_META).map(([v, m]) => ({ value: v, label: m.label }))}
                />
              </Field>
              <Field label="Proyecto" icon={<Tag className="w-3 h-3" strokeWidth={2.5} />}>
                <SelectInput
                  value={ctx.task.projectId ?? ""}
                  onChange={(v) => patch({ projectId: v || null })}
                  options={[
                    { value: "", label: "Independiente" },
                    ...ctx.projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </Field>
              <Field label="Asignado a" icon={<UserIcon className="w-3 h-3" strokeWidth={2.5} />}>
                <SelectInput
                  value={ctx.task.assignedTo ?? ""}
                  onChange={(v) => patch({ assignedTo: v || null })}
                  options={[
                    { value: "", label: "Sin asignar" },
                    ...ctx.members.map((m) => ({ value: m.id, label: m.displayName || m.username })),
                  ]}
                />
              </Field>
              <Field label="Vence" icon={<Calendar className="w-3 h-3" strokeWidth={2.5} />}>
                <input
                  type="date"
                  value={ctx.task.dueDate ? new Date(ctx.task.dueDate).toISOString().slice(0, 10) : ""}
                  onChange={(e) => patch({ dueDate: e.target.value ? new Date(e.target.value) : null })}
                  className="w-full bg-transparent text-[11px] font-medium px-2 py-1.5 border border-ink-border focus:border-ink focus:outline-none"
                />
              </Field>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
                Descripción
              </label>
              <textarea
                value={ctx.task.description ?? ""}
                onChange={(e) => patch({ description: e.target.value })}
                rows={4}
                placeholder="Añade detalles…"
                className="w-full bg-transparent text-xs font-medium px-3 py-2 border border-ink-border focus:border-ink focus:outline-none resize-none"
              />
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest block">
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ctx.labels.map((l) => {
                  const active = ctx.taskLabelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      className={cn(
                        "px-2 py-1 text-[10px] font-technical uppercase tracking-wider border",
                        active ? "bg-ink text-paper border-ink-border" : "border-ink-border hover:bg-surface",
                      )}
                      style={active && l.color ? { backgroundColor: l.color, borderColor: l.color } : undefined}
                    >
                      {l.name}
                    </button>
                  );
                })}
                {ctx.labels.length === 0 && (
                  <span className="text-[10px] text-ink-muted italic">Sin etiquetas en este espacio.</span>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2 pt-4 border-t border-ink-border">
              <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" strokeWidth={2.5} /> Comentarios ({ctx.comments.length})
              </label>
              <div className="space-y-3">
                {ctx.comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-6 h-6 shrink-0 bg-paper border border-ink-border flex items-center justify-center font-technical font-bold text-[9px] uppercase">
                      {monogram(c.displayName || c.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-bold truncate">{c.displayName || c.username}</span>
                        <span className="text-[9px] font-technical uppercase text-ink-muted">
                          {formatDateLong(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-ink mt-0.5 whitespace-pre-wrap break-words m-0">{c.body}</p>
                    </div>
                  </div>
                ))}
                {ctx.comments.length === 0 && (
                  <p className="text-[10px] text-ink-muted italic">Sin comentarios todavía.</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder="Escribe un comentario… (Enter para enviar)"
                  className="flex-1 bg-transparent text-xs px-3 py-2 border border-ink-border focus:border-ink focus:outline-none"
                />
                <button
                  onClick={submitComment}
                  className="px-3 border border-ink-border hover:bg-ink hover:text-paper"
                  title="Enviar"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-technical uppercase text-ink-muted tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-[11px] font-medium px-2 py-1.5 border border-ink-border focus:border-ink focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
