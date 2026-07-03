"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Task } from "@/db/schema";
import CollapsibleSidebarContainer from "./collapsible-sidebar-container";
import CommandPalette from "./command-palette";
import TaskDrawer from "./task-drawer";
import NotificationsSync from "./notifications-sync";

interface AppContextValue {
  activeTask: Task | null;
  openTask: (task: Task) => void;
  closeTask: () => void;
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
}

const AppContext = createContext<AppContextValue>({
  activeTask: null,
  openTask: () => {},
  closeTask: () => {},
  paletteOpen: false,
  openPalette: () => {},
  closePalette: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

interface WorkspaceRef {
  id: string;
  name: string;
}

export default function AppShell({
  sidebar,
  children,
  workspaces,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  workspaces: WorkspaceRef[];
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openTask = useCallback((task: Task) => setActiveTask(task), []);
  const closeTask = useCallback(() => setActiveTask(null), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setActiveTask(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AppContext.Provider
      value={{ activeTask, openTask, closeTask, paletteOpen, openPalette, closePalette }}
    >
      <NotificationsSync>
        <CollapsibleSidebarContainer sidebar={sidebar}>{children}</CollapsibleSidebarContainer>
        {paletteOpen && <CommandPalette workspaces={workspaces} onClose={closePalette} />}
        {activeTask && <TaskDrawer task={activeTask} onClose={closeTask} />}
      </NotificationsSync>
    </AppContext.Provider>
  );
}
