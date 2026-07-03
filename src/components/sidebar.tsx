import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { workspaces, users } from "@/db/schema";
import { logoutAction } from "@/app/actions";
import ThemeSelector from "./theme-selector";
import SidebarLinks from "./sidebar-links";
import CreateSpaceModal from "./create-space-modal";
import CommandPaletteTrigger from "./command-palette-trigger";
import NotificationsBell from "./notifications-bell";
import { LogOut } from "lucide-react";
import { monogram } from "@/lib/utils";

export default async function Sidebar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const db = await getDB();
  const wsList = await db
    .select()
    .from(workspaces)
    .orderBy(asc(workspaces.sortOrder), asc(workspaces.createdAt));

  const username = user.displayName || user.username;
  const initials = monogram(username);

  return (
    <aside className="w-[280px] h-screen bg-paper border-r border-ink-border flex flex-col shrink-0 select-none overflow-hidden">
      {/* Brand */}
      <div className="p-6 border-b border-ink-border flex flex-col gap-1">
        <Link href="/" className="group block">
          <h1 className="text-sm font-bold font-technical uppercase tracking-widest text-ink hover:text-highlight m-0">
            LETSWORK ALPHA
          </h1>
          <span className="text-[9px] font-technical uppercase tracking-widest text-ink-muted group-hover:text-ink">
            v1.0 · MINIMAL PRO
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-ink-border">
        <CommandPaletteTrigger />
      </div>

      {/* Workspaces */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-4 space-y-4">
        <div>
          <div className="flex justify-between items-center px-2 mb-2">
            <h2 className="text-[10px] font-bold font-technical uppercase tracking-widest text-ink-muted m-0">
              Espacios
            </h2>
            <CreateSpaceModal />
          </div>
          <SidebarLinks workspaces={wsList} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-ink-border bg-surface space-y-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 bg-paper border border-ink-border flex items-center justify-center font-technical font-bold text-xs uppercase text-ink">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold truncate leading-none text-ink">{username}</div>
            <div className="text-[9px] font-technical uppercase text-ink-muted mt-1 leading-none">
              Equipo Colaborativo
            </div>
          </div>
        </div>

        <ThemeSelector
          initialPreset={user.themePreset}
          initialDualInk={user.dualInkMode}
          initialCompact={user.compactLayout}
        />

        <div className="flex items-center gap-2">
          <NotificationsBell />
          <form action={logoutAction} className="flex-1">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 border border-ink-border hover:text-highlight text-left text-xs font-technical uppercase font-bold tracking-wider"
            >
              <LogOut className="w-4 h-4 shrink-0 text-ink-muted" strokeWidth={2} />
              <span>Salir</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
