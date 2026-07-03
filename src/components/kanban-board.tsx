"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import TaskCard from "./task-card";
import { moveTaskAction, createTaskAction } from "@/app/actions";
import { TASK_STATUSES, TASK_STATUS_META, cn } from "@/lib/utils";
import type { Task, Project } from "@/db/schema";
import type { TaskWithLabels, Member } from "@/lib/workspace-types";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
  tasks: TaskWithLabels[];
  members: Member[];
  projects: Project[];
  labels: { id: string; name: string; color: string | null }[];
}

type Columns = Record<Task["status"], TaskWithLabels[]>;

function buildColumns(tasks: TaskWithLabels[]): Columns {
  const cols: Columns = { backlog: [], todo: [], in_progress: [], in_review: [], done: [] };
  for (const t of tasks) {
    (cols[t.status] ?? cols.todo).push(t);
  }
  for (const st of TASK_STATUSES) {
    cols[st].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return cols;
}

export default function KanbanBoard({ workspaceId, tasks, members, projects, labels }: Props) {
  const [columns, setColumns] = useState<Columns>(() => buildColumns(tasks));
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setColumns(buildColumns(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeTask = activeId
    ? TASK_STATUSES.map((s) => columns[s]).flat().find((t) => t.id === activeId) ?? null
    : null;

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const activeTaskData = active.data.current?.task as TaskWithLabels | undefined;
    if (!activeTaskData) return;
    const fromStatus = activeTaskData.status;

    let toStatus: Task["status"];
    let toIndexFiltered: number;

    if (overIdStr.startsWith("col-")) {
      toStatus = overIdStr.slice(4) as Task["status"];
      const targetFiltered =
        fromStatus === toStatus ? columns[fromStatus].filter((t) => t.id !== activeIdStr) : columns[toStatus];
      toIndexFiltered = targetFiltered.length;
    } else {
      // locate over card's column
      let foundStatus: Task["status"] | null = null;
      for (const st of TASK_STATUSES) {
        if (columns[st].some((t) => t.id === overIdStr)) {
          foundStatus = st;
          break;
        }
      }
      if (!foundStatus) return;
      toStatus = foundStatus;
      const targetFiltered =
        fromStatus === toStatus
          ? columns[toStatus].filter((t) => t.id !== activeIdStr)
          : columns[toStatus];
      const idx = targetFiltered.findIndex((t) => t.id === overIdStr);
      toIndexFiltered = idx < 0 ? targetFiltered.length : idx;
    }

    // Optimistic local update
    setColumns((prev) => {
      const next = { ...prev };
      const fromArr = next[fromStatus].filter((t) => t.id !== activeIdStr);
      next[fromStatus] = fromArr;
      const toArr =
        fromStatus === toStatus ? fromArr : [...next[toStatus]];
      const moved = { ...activeTaskData, status: toStatus };
      const idx = Math.max(0, Math.min(toIndexFiltered, toArr.length));
      toArr.splice(idx, 0, moved);
      next[toStatus] = toArr;
      return next;
    });

    try {
      const res = await moveTaskAction(workspaceId, activeIdStr, toStatus, toIndexFiltered);
      if (res?.error) toast.error(res.error);
    } catch (e: any) {
      toast.error(e?.message || "Error al mover la tarea");
      setColumns(buildColumns(tasks));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 min-h-[60vh]">
        {TASK_STATUSES.map((st) => {
          const col = columns[st];
          return (
            <KanbanColumn
              key={st}
              status={st}
              count={col.length}
              onQuickAdd={async () => {
                const res = await createTaskAction({
                  workspaceId,
                  title: "Nueva tarea",
                  status: st,
                });
                if (res?.error) toast.error(res.error);
              }}
            >
              <SortableContext items={col.map((t) => t.id)} strategy={verticalListSortingStrategy} id={st}>
                <div className="space-y-2 min-h-[60px]">
                  {col.map((t) => (
                    <TaskCard key={t.id} task={t} members={members} projects={projects} />
                  ))}
                  {col.length === 0 && (
                    <div className="text-[10px] italic text-ink-muted text-center py-6 border border-dashed border-ink-border">
                      Suelta tareas aquí
                    </div>
                  )}
                </div>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} members={members} projects={projects} isOverlay /> : null}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  count,
  children,
  onQuickAdd,
}: {
  status: Task["status"];
  count: number;
  children: React.ReactNode;
  onQuickAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  const meta = TASK_STATUS_META[status];
  return (
    <div className="w-[280px] shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-ink-border">
        <h3 className="text-[10px] font-bold font-technical uppercase tracking-widest m-0">
          {meta.label} <span className="text-ink-muted">({count})</span>
        </h3>
        <button onClick={onQuickAdd} className="text-ink-muted hover:text-ink" title="Añadir rápida">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn("flex-1 p-1.5 rounded-[var(--radius)]", isOver && "bg-surface")}
      >
        {children}
      </div>
    </div>
  );
}
