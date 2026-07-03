"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FolderKanban, Layers, CheckSquare, Home, X } from "lucide-react";
import { searchAction } from "@/app/data-actions";
import { TASK_STATUS_META } from "@/lib/utils";

interface WorkspaceRef {
  id: string;
  name: string;
}

export default function CommandPalette({
  workspaces,
  onClose,
}: {
  workspaces: WorkspaceRef[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ workspaces: any[]; projects: any[]; tasks: any[] }>({
    workspaces: [],
    projects: [],
    tasks: [],
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(async () => {
        if (q.trim().length === 0) {
          setResults({ workspaces: [], projects: [], tasks: [] });
          return;
        }
        const r = await searchAction(q);
        setResults(r as any);
      });
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] bg-ink/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-paper border border-ink-border w-full max-w-xl shadow-2xl rounded-[var(--radius)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Buscar" shouldFilter={false} className="flex flex-col">
          <div className="flex items-center gap-2 px-4 border-b border-ink-border">
            <Search className="w-4 h-4 text-ink-muted shrink-0" strokeWidth={2.5} />
            <Command.Input
              autoFocus
              value={q}
              onValueChange={setQ}
              placeholder="Buscar espacios, proyectos o tareas…"
              className="flex-1 bg-transparent text-sm py-3 focus:outline-none placeholder:text-ink-muted"
            />
            <button onClick={onClose} className="text-ink-muted hover:text-ink">
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto scrollbar-hide">
            <Command.Empty className="py-6 text-center text-[11px] text-ink-muted italic">
              {pending ? "Buscando…" : "Sin resultados."}
            </Command.Empty>

            <Command.Group heading="Navegación" className="text-[9px] font-technical uppercase tracking-widest text-ink-muted px-2 pt-2">
              <Command.Item
                onSelect={() => go("/")}
                className="flex items-center gap-2 px-3 py-2 text-xs aria-selected:bg-surface cursor-pointer"
              >
                <Home className="w-4 h-4" strokeWidth={2} /> Inicio / Dashboard
              </Command.Item>
            </Command.Group>

            {workspaces.length > 0 && (
              <Command.Group heading="Espacios" className="text-[9px] font-technical uppercase tracking-widest text-ink-muted px-2 pt-2">
                {(q.trim() ? results.workspaces : workspaces).map((ws) => (
                  <Command.Item
                    key={ws.id}
                    onSelect={() => go(`/r/${ws.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-xs aria-selected:bg-surface cursor-pointer"
                  >
                    <FolderKanban className="w-4 h-4" strokeWidth={2} /> {ws.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.projects.length > 0 && (
              <Command.Group heading="Proyectos" className="text-[9px] font-technical uppercase tracking-widest text-ink-muted px-2 pt-2">
                {results.projects.map((p) => (
                  <Command.Item
                    key={p.id}
                    onSelect={() => go(`/r/${p.workspaceId}?project=${p.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-xs aria-selected:bg-surface cursor-pointer"
                  >
                    <Layers className="w-4 h-4" strokeWidth={2} /> {p.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.tasks.length > 0 && (
              <Command.Group heading="Tareas" className="text-[9px] font-technical uppercase tracking-widest text-ink-muted px-2 pt-2">
                {results.tasks.map((t) => (
                  <Command.Item
                    key={t.id}
                    onSelect={() => go(`/r/${t.workspaceId}?task=${t.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-xs aria-selected:bg-surface cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" strokeWidth={2} />
                    <span className="truncate">{t.title}</span>
                    <span className="ml-auto text-[9px] font-technical uppercase text-ink-muted">
                      {TASK_STATUS_META[t.status as keyof typeof TASK_STATUS_META]?.label}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
