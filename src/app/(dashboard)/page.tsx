import Link from "next/link";
import { eq, asc, inArray } from "drizzle-orm";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  workspaces,
  projects,
  tasks,
  workspaceMembers,
  users,
} from "@/db/schema";
import { FolderKanban, CheckSquare, Layers, Users, ArrowRight } from "lucide-react";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  const db = await getDB();

  const memberRows = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user!.id));
  const wsIds = memberRows.map((m) => m.workspaceId);

  const wsList =
    wsIds.length === 0
      ? []
      : await db
          .select()
          .from(workspaces)
          .where(inArray(workspaces.id, wsIds))
          .orderBy(asc(workspaces.sortOrder), asc(workspaces.createdAt));

  const allProjects =
    wsIds.length === 0
      ? []
      : await db.select().from(projects).where(inArray(projects.workspaceId, wsIds));

  const allTasks =
    wsIds.length === 0
      ? []
      : await db.select().from(tasks).where(inArray(tasks.workspaceId, wsIds));

  const teamIds = new Set<string>();
  for (const p of allProjects) teamIds.add(p.createdBy);
  for (const t of allTasks) {
    if (t.assignedTo) teamIds.add(t.assignedTo);
    if (t.createdBy) teamIds.add(t.createdBy);
  }
  const team = teamIds.size
    ? await db.select().from(users).where(inArray(users.id, [...teamIds]))
    : [];

  const totalWorkspaces = wsList.length;
  const totalProjects = allProjects.length;
  const pending = allTasks.filter((t) => t.status !== "done").length;
  const completed = allTasks.filter((t) => t.status === "done").length;

  return (
    <div className="p-8 space-y-8 select-none max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-1 border-b border-ink-border pb-6">
        <h1 className="text-2xl font-editorial font-light tracking-tight m-0 text-ink">
          Área de Trabajo Colaborativa
        </h1>
        <p className="text-[11px] font-technical uppercase tracking-widest text-ink-muted m-0">
          Resumen general de espacios y métricas de equipo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Espacios" value={totalWorkspaces} sub="ÁREAS ESTRATÉGICAS" />
        <Stat label="Proyectos Activos" value={totalProjects} sub="INICIATIVAS DE EQUIPO" />
        <Stat label="Tareas Pendientes" value={pending} sub="POR COMPLETAR" />
        <Stat label="Tareas Hechas" value={completed} sub="COMPLETADAS" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Workspaces */}
        <div className="md:col-span-8 border border-ink-border p-6 rounded-[var(--radius)] space-y-4">
          <div className="flex justify-between items-center border-b border-ink-border pb-3">
            <h2 className="text-xs font-bold font-technical uppercase tracking-wider m-0">
              Navegar por Espacios
            </h2>
            <Layers className="w-4 h-4 text-ink-muted" strokeWidth={2} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wsList.map((ws) => {
              const pCount = allProjects.filter((p) => p.workspaceId === ws.id).length;
              const tCount = allTasks.filter((t) => t.workspaceId === ws.id).length;
              return (
                <Link
                  key={ws.id}
                  href={`/r/${ws.id}`}
                  className="group border border-ink-border p-4 flex flex-col justify-between hover:bg-surface text-left"
                >
                  <div>
                    <h3 className="text-xs font-bold uppercase font-technical tracking-wider m-0 group-hover:text-highlight">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-ink-muted mt-1.5 leading-relaxed line-clamp-2 m-0">
                      {ws.description || "Sin descripción."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-border flex justify-between items-center text-[9px] font-technical uppercase tracking-widest text-ink-muted">
                    <span>Proyectos: {pCount} · Tareas: {tCount}</span>
                    <span className="text-ink font-bold group-hover:underline">ENTRAR →</span>
                  </div>
                </Link>
              );
            })}

            {wsList.length === 0 && (
              <div className="col-span-2 text-xs italic text-ink-muted p-4 border border-dashed border-ink-border text-center">
                Crea tu primer espacio desde el panel lateral izquierdo.
              </div>
            )}
          </div>
        </div>

        {/* Team */}
        <div className="md:col-span-4 border border-ink-border p-6 rounded-[var(--radius)] space-y-4">
          <div className="flex justify-between items-center border-b border-ink-border pb-3">
            <h2 className="text-xs font-bold font-technical uppercase tracking-wider m-0">
              Miembros del Equipo
            </h2>
            <Users className="w-4 h-4 text-ink-muted" strokeWidth={2} />
          </div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto scrollbar-hide">
            {team.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 p-2 border border-ink-border bg-surface">
                <div className="w-7 h-7 bg-paper border border-ink-border flex items-center justify-center font-technical font-bold text-[10px] uppercase text-ink shrink-0">
                  {(u.displayName || u.username).substring(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold truncate leading-none">{u.displayName || u.username}</div>
                  <div className="text-[9px] font-technical uppercase text-ink-muted mt-1 leading-none">Activo</div>
                </div>
              </div>
            ))}
            {team.length === 0 && (
              <p className="text-[11px] text-ink-muted italic">Aún no hay miembros.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="border border-ink-border p-6 bg-paper rounded-[var(--radius)] flex flex-col justify-between h-36">
      <span className="text-[10px] font-technical uppercase tracking-widest text-ink-muted leading-none">
        {label}
      </span>
      <span className="text-6xl font-light font-editorial leading-none tracking-tight text-ink">
        {value}
      </span>
      <span className="text-[9px] font-technical uppercase tracking-widest text-ink-muted leading-none">
        {sub}
      </span>
    </div>
  );
}
