"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  Plus,
  X,
  KanbanSquare,
  List as ListIcon,
  CalendarDays,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import KanbanBoard from "./kanban-board";
import ListView from "./list-view";
import CalendarView from "./calendar-view";
import WorkspaceSync from "./workspace-sync";
import PresenceAvatars from "./presence-avatars";
import ActivityFeed from "./activity-feed";
import { useApp } from "@/components/app-shell";
import {
  createProjectAction,
  createTaskAction,
  deleteWorkspaceAction,
} from "@/app/actions";
import {
  TASK_STATUS_META,
  PROJECT_STATUS_META,
  cn,
} from "@/lib/utils";
import type { Task, Project } from "@/db/schema";
import type { WorkspaceViewProps } from "@/lib/workspace-types";

type ViewTab = "board" | "list" | "calendar";

export default function WorkspaceView({
  workspace,
  projects,
  tasks,
  members,
  labels,
  currentUser,
  initialActivity,
  initialProjectFilter,
  initialOpenTaskId,
}: WorkspaceViewProps) {
  const { openTask } = useApp();
  const [tab, setTab] = useState<ViewTab>("board");
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectFilter || "all");
  const [mineOnly, setMineOnly] = useState(false);
  const [q, setQ] = useState("");
  const [projectModal, setProjectModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);

  useEffect(() => {
    if (initialOpenTaskId) {
      const t = tasks.find((x) => x.id === initialOpenTaskId);
      if (t) openTask(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenTaskId]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      if (mineOnly && t.assignedTo !== currentUser.id) return false;
      if (q.trim() && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tasks, projectFilter, mineOnly, q, currentUser.id]);

  const handleDeleteWorkspace = async () => {
    if (
      confirm(
        "ADVERTENCIA: ¿Eliminar este Espacio y todos sus proyectos y tareas de forma permanente?",
      )
    ) {
      await deleteWorkspaceAction(workspace.id);
    }
  };

  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "board", label: "Tablero", icon: <KanbanSquare className="w-3.5 h-3.5" strokeWidth={2.5} /> },
    { id: "list", label: "Lista", icon: <ListIcon className="w-3.5 h-3.5" strokeWidth={2.5} /> },
    { id: "calendar", label: "Calendario", icon: <CalendarDays className="w-3.5 h-3.5" strokeWidth={2.5} /> },
  ];

  return (
    <WorkspaceSync
      workspaceId={workspace.id}
      initialActivity={initialActivity}
      currentUserId={currentUser.id}
    >
    <div className="p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-ink-border pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-editorial font-light tracking-tight m-0 text-ink">
            {workspace.name}
          </h1>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-2xl m-0">
            {workspace.description || "Espacio estratégico del equipo."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <PresenceAvatars />
          <button
            onClick={handleDeleteWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-ink-border text-ink hover:text-paper hover:bg-highlight hover:border-highlight text-[11px] font-technical uppercase font-bold tracking-wider"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Eliminar Área</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* View switcher */}
        <div className="flex items-center border border-ink-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-technical uppercase tracking-wider font-bold border-r border-ink-border last:border-r-0",
                tab === t.id ? "bg-ink text-paper" : "hover:bg-surface text-ink-muted",
              )}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 border border-ink-border px-2 py-1">
            <Search className="w-3 h-3 text-ink-muted" strokeWidth={2.5} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar…"
              className="bg-transparent text-[11px] w-28 focus:outline-none placeholder:text-ink-muted"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-transparent text-[10px] font-technical uppercase tracking-wider border border-ink-border px-2 py-1.5 focus:outline-none"
          >
            <option value="all">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMineOnly((v) => !v)}
            className={cn(
              "px-2 py-1 text-[10px] font-technical uppercase tracking-wider border",
              mineOnly ? "bg-ink text-paper border-ink-border" : "border-ink-border hover:bg-surface",
            )}
          >
            Mis Tareas
          </button>

          <button
            onClick={() => setTaskModal(true)}
            className="px-3 py-1.5 text-[10px] font-technical uppercase font-bold tracking-wider border border-ink-border bg-ink text-paper hover:bg-highlight"
          >
            + Nueva Tarea
          </button>
          <button
            onClick={() => setProjectModal(true)}
            className="px-3 py-1.5 text-[10px] font-technical uppercase tracking-wider border border-ink-border hover:bg-surface"
          >
            + Proyecto
          </button>
        </div>
      </div>

      {/* View body + activity rail */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {tab === "board" && (
            <KanbanBoard
              workspaceId={workspace.id}
              tasks={filtered}
              members={members}
              projects={projects}
              labels={labels}
            />
          )}
          {tab === "list" && (
            <ListView workspaceId={workspace.id} tasks={filtered} members={members} projects={projects} />
          )}
          {tab === "calendar" && (
            <CalendarView tasks={filtered} members={members} projects={projects} />
          )}
        </div>
        <div className="hidden xl:block w-72 shrink-0">
          <ActivityFeed initial={initialActivity} />
        </div>
      </div>

      {/* Project modal */}
      {projectModal && (
        <ProjectCreateModal
          workspaceId={workspace.id}
          onClose={() => setProjectModal(false)}
        />
      )}

      {/* Task modal */}
      {taskModal && (
        <TaskCreateModal
          workspaceId={workspace.id}
          projects={projects}
          members={members}
          defaultProject={projectFilter !== "all" ? projectFilter : undefined}
          onClose={() => setTaskModal(false)}
        />
      )}
    </div>
    </WorkspaceSync>
  );
}

/* ============ Project create modal ============ */
function ProjectCreateModal({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<Project["status"]>("planned");
  const [due, setDue] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await createProjectAction(workspaceId, name, desc, status, due || undefined);
    if (res?.error) toast.error(res.error);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-ink/20 backdrop-blur-sm p-4">
      <div className="bg-paper border border-ink-border p-6 w-[380px] max-w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[10px] font-bold font-technical uppercase tracking-widest m-0">
            Crear Nuevo Proyecto
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <hr className="border-t border-ink-border mb-4" />
        <form onSubmit={submit} className="space-y-3">
          <input
            placeholder="Nombre del proyecto..."
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-xs font-medium px-3 py-2 border border-ink-border focus:border-ink focus:outline-none"
          />
          <textarea
            placeholder="Descripción..."
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-transparent text-xs font-medium px-3 py-1.5 border border-ink-border focus:border-ink focus:outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Project["status"])}
              className="bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
            >
              {Object.entries(PROJECT_STATUS_META).map(([v, m]) => (
                <option key={v} value={v}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 bg-ink text-paper hover:bg-highlight py-2.5 text-xs font-bold font-technical uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Crear Proyecto
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============ Task create modal ============ */
function TaskCreateModal({
  workspaceId,
  projects,
  members,
  defaultProject,
  onClose,
}: {
  workspaceId: string;
  projects: Project[];
  members: { id: string; username: string; displayName: string | null }[];
  defaultProject?: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [projectId, setProjectId] = useState(defaultProject || "");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [due, setDue] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await createTaskAction({
      workspaceId,
      projectId: projectId || undefined,
      title,
      description: desc,
      status,
      priority,
      assignedTo: assignedTo || undefined,
      dueDateStr: due || undefined,
    });
    if (res?.error) toast.error(res.error);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-ink/20 backdrop-blur-sm p-4">
      <div className="bg-paper border border-ink-border p-6 w-[520px] max-w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[10px] font-bold font-technical uppercase tracking-widest m-0">
            Crear Nueva Tarea
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <hr className="border-t border-ink-border mb-4" />
        <form onSubmit={submit} className="space-y-3">
          <input
            placeholder="TÍTULO DE LA TAREA..."
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-xs font-medium px-3 py-2 border border-ink-border focus:border-ink focus:outline-none"
          />
          <textarea
            placeholder="Descripción de la tarea..."
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-transparent text-xs font-medium px-3 py-1.5 border border-ink-border focus:border-ink focus:outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Proyecto">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
              >
                <option value="">Ninguno (Independiente)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Estado">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
              >
                {Object.entries(TASK_STATUS_META).map(([v, m]) => (
                  <option key={v} value={v}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Asignar a">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName || m.username}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Prioridad">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="w-full bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </Labeled>
            <Labeled label="Vence">
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full bg-transparent text-xs font-medium px-2 py-1.5 border border-ink-border focus:outline-none"
              />
            </Labeled>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 bg-ink text-paper hover:bg-highlight py-2.5 text-xs font-bold font-technical uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Crear Tarea
          </button>
        </form>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-technical uppercase text-ink-muted tracking-widest">{label}</span>
      {children}
    </div>
  );
}
