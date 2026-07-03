"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User as UserIcon, Check } from "lucide-react";
import type { Project } from "@/db/schema";
import type { TaskWithLabels, Member } from "@/lib/workspace-types";
import { PRIORITY_META, relativeDue, monogram, cn } from "@/lib/utils";
import { useApp } from "@/components/app-shell";

interface Props {
  task: TaskWithLabels;
  members: Member[];
  projects: Project[];
  isOverlay?: boolean;
}

export default function TaskCard({ task, members, projects, isOverlay = false }: Props) {
  const { openTask } = useApp();
  const sortable = useSortable({ id: task.id, data: { task } });
  const { attributes, listeners, setNodeRef, transform, isDragging } = sortable;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    cursor: isOverlay ? "grabbing" : "grab",
  };

  const assignee = members.find((m) => m.id === task.assignedTo);
  const prj = projects.find((p) => p.id === task.projectId);
  const due = relativeDue(task.dueDate);
  const isDone = task.status === "done";

  const inner = (
    <div
      className={cn(
        "border border-ink-border bg-paper p-3 space-y-2 select-none hover:bg-surface",
        isOverlay && "shadow-2xl",
        isDragging && !isOverlay && "dragging-task",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            openTask(task);
          }}
          className="text-left text-xs font-bold leading-snug hover:text-highlight"
        >
          {task.title}
        </button>
        <Check
          className={cn("w-3.5 h-3.5 shrink-0", isDone ? "text-ink" : "text-ink-border")}
          strokeWidth={2.5}
        />
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="px-1.5 py-0.5 text-[8px] font-technical uppercase tracking-wider border"
              style={l.color ? { backgroundColor: l.color, borderColor: l.color, color: "#fff" } : undefined}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-ink-border text-[9px] font-technical uppercase tracking-wider text-ink-muted">
        <span className="flex items-center gap-1.5">
          {prj && <span className="truncate max-w-[90px] text-ink">{prj.name}</span>}
          {due.label && (
            <span className={cn("flex items-center gap-0.5", due.overdue && !isDone && "text-highlight")}>
              <Calendar className="w-2.5 h-2.5" strokeWidth={2.5} />
              {due.label}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("px-1 py-0.5 border text-[8px]", PRIORITY_META[task.priority].style)}>
            {task.priority}
          </span>
          {assignee && (
            <span
              className="w-4 h-4 bg-paper border border-ink-border flex items-center justify-center text-[7px] font-bold"
              title={assignee.displayName || assignee.username}
            >
              {monogram(assignee.displayName || assignee.username)}
            </span>
          )}
        </span>
      </div>
    </div>
  );

  if (isOverlay) {
    return <div style={style}>{inner}</div>;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {inner}
    </div>
  );
}
