"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
}

export default function SidebarLinks({ workspaces }: { workspaces: Workspace[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {workspaces.map((ws) => {
        const isActive = pathname === `/r/${ws.id}`;
        return (
          <Link
            key={ws.id}
            href={`/r/${ws.id}`}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border border-transparent ${
              isActive
                ? "bg-ink text-paper border-ink-border"
                : "hover:bg-surface text-ink"
            }`}
          >
            <FolderKanban className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{ws.name}</span>
          </Link>
        );
      })}

      {workspaces.length === 0 && (
        <div className="text-[11px] text-ink-muted italic p-3">Ningún espacio creado.</div>
      )}
    </nav>
  );
}
