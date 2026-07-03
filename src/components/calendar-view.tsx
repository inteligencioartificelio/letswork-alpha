"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { useApp } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import type { Project } from "@/db/schema";
import type { TaskWithLabels, Member } from "@/lib/workspace-types";

interface Props {
  tasks: TaskWithLabels[];
  members: Member[];
  projects: Project[];
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarView({ tasks, members, projects }: Props) {
  const { openTask } = useApp();
  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithLabels[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = format(new Date(t.dueDate), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-ink-border pb-2">
        <h2 className="text-xs font-bold font-technical uppercase tracking-wider m-0">
          {format(cursor, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date())}
            className="px-2 py-1 text-[9px] font-technical uppercase border border-ink-border hover:bg-surface"
          >
            Hoy
          </button>
          <button onClick={() => setCursor((c) => addMonths(c, -1))} className="p-1 border border-ink-border hover:bg-surface">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => setCursor((c) => addMonths(c, 1))} className="p-1 border border-ink-border hover:bg-surface">
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border border-ink-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[9px] font-technical uppercase tracking-widest text-ink-muted text-center py-1.5 border-b border-ink-border bg-surface">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          return (
            <div
              key={key}
              className={cn(
                "min-h-[84px] p-1.5 border-b border-r border-ink-border flex flex-col gap-1",
                !inMonth && "bg-surface/40 opacity-60",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-technical w-5 h-5 flex items-center justify-center",
                  today ? "bg-ink text-paper" : "text-ink-muted",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="space-y-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTask(t)}
                    className="block w-full text-left text-[9px] font-medium px-1 py-0.5 border border-ink-border bg-paper hover:bg-surface truncate"
                    title={t.title}
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[8px] font-technical uppercase text-ink-muted px-1">
                    +{dayTasks.length - 3} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.filter((t) => !t.dueDate).length > 0 && (
        <p className="text-[10px] font-technical uppercase tracking-widest text-ink-muted italic pt-2">
          {tasks.filter((t) => !t.dueDate).length} tareas sin fecha de vencimiento (no mostradas en el calendario).
        </p>
      )}
    </div>
  );
}
