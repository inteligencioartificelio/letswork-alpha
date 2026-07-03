"use client";

import { useState } from "react";
import { Check, Trash2, ChevronLeft, ChevronRight, Calendar, User as UserIcon, Clock } from "lucide-react";
import { deleteTaskAction, toggleTaskDoneAction } from "@/app/actions";
import { PRIORITY_META, relativeDue, cn, monogram } from "@/lib/utils";
import { useApp } from "@/components/app-shell";
import { toast } from "sonner";
import type { Task, Project } from "@/db/schema";
import type { TaskWithLabels, Member } from "@/lib/workspace-types";

interface Props {
  workspaceId: string;
  tasks: TaskWithLabels[];
  members: Member[];
  projects: Project[];
}

const PER_PAGE = 8;

export default function ListView({ workspaceId, tasks, members, projects }: Props) {
  const { openTask } = useApp();
  const [page, setPage] = useState(1);

  const sorted = [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const total = sorted.length;
  const totalPages = Math.ceil(total / PER_PAGE) || 1;
  const start = (page - 1) * PER_PAGE;
  const pageTasks = sorted.slice(start, start + PER_PAGE);

  const toggle = async (t: TaskWithLabels) => {
    await toggleTaskDoneAction(workspaceId, t.id);
  };
  const remove = async (id: string) => {
    if (confirm("¿Eliminar esta tarea?")) {
      const res = await deleteTaskAction(workspaceId, id);
      if (res?.error) toast.error(res.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-ink-border text-[10px] font-technical uppercase tracking-widest text-ink-muted">
              <th className="py-2 px-1 w-8">OK</th>
              <th className="py-2 px-2">Detalles</th>
              <th className="py-2 px-2 w-32">Proyecto</th>
              <th className="py-2 px-2 w-20">Prioridad</th>
              <th className="py-2 px-2 w-28">Vence</th>
              <th className="py-2 px-2 w-10 text-right">×</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-border">
            {pageTasks.map((t) => {
              const isDone = t.status === "done";
              const prj = projects.find((p) => p.id === t.projectId);
              const assignee = members.find((m) => m.id === t.assignedTo);
              const due = relativeDue(t.dueDate);
              return (
                <tr key={t.id} className={cn("hover:bg-surface/50", isDone && "opacity-50")}>
                  <td className="py-3 px-1">
                    <button
                      onClick={() => toggle(t)}
                      className={cn(
                        "w-5 h-5 border border-ink-border flex items-center justify-center",
                        isDone ? "bg-ink text-paper" : "hover:bg-surface",
                      )}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <button onClick={() => openTask(t)} className="text-left w-full">
                      <div className={cn("text-xs font-bold", isDone ? "line-through text-ink-muted" : "text-ink hover:text-highlight")}>
                        {t.title}
                      </div>
                      {t.description && (
                        <p className="text-[10px] text-ink-muted mt-0.5 max-w-sm leading-relaxed line-clamp-1 m-0">
                          {t.description}
                        </p>
                      )}
                      {t.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.labels.map((l) => (
                            <span
                              key={l.id}
                              className="px-1 py-0.5 text-[8px] font-technical uppercase border"
                              style={l.color ? { backgroundColor: l.color, borderColor: l.color, color: "#fff" } : undefined}
                            >
                              {l.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    {prj ? (
                      <span className="text-[10px] font-technical font-bold uppercase truncate block max-w-[110px]">
                        {prj.name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-technical uppercase text-ink-muted italic">Independiente</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className={cn("px-1.5 py-0.5 border text-[8px] font-bold font-technical uppercase", PRIORITY_META[t.priority].style)}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-[10px] font-technical uppercase text-ink-muted">
                    {due.label ? (
                      <span className={cn("flex items-center gap-1", due.overdue && !isDone && "text-highlight")}>
                        <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {due.label}
                      </span>
                    ) : (
                      <span className="text-ink-border">—</span>
                    )}
                    {assignee && (
                      <span className="flex items-center gap-1 mt-1">
                        <span className="w-3.5 h-3.5 border border-ink-border flex items-center justify-center text-[6px] font-bold">
                          {monogram(assignee.displayName || assignee.username)}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button onClick={() => remove(t.id)} className="p-1 text-ink hover:text-highlight" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {pageTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs italic text-ink-muted">
                  No hay tareas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pt-3 border-t border-ink-border flex justify-between items-center text-[10px] font-technical uppercase tracking-wider">
        <span className="text-ink-muted">
          Pág {page} de {totalPages} · {total} tareas
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 border border-ink-border hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 border border-ink-border hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
