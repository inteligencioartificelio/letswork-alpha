"use client";

import { useWorkspaceRealtime } from "./workspace-sync";
import { monogram, cn } from "@/lib/utils";

export default function PresenceAvatars() {
  const { presence } = useWorkspaceRealtime();
  const shown = presence.slice(0, 5);
  const extra = presence.length - shown.length;

  if (presence.length === 0) {
    return (
      <span className="text-[9px] font-technical uppercase tracking-widest text-ink-muted">
        Nadie online
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-highlight" title="En vivo" />
      <div className="flex -space-x-1.5">
        {shown.map((p) => (
          <div
            key={p.userId}
            className="w-6 h-6 bg-paper border border-ink flex items-center justify-center font-technical font-bold text-[9px] uppercase"
            title={`${p.displayName || p.username} · online`}
          >
            {monogram(p.displayName || p.username)}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-6 h-6 bg-surface border border-ink flex items-center justify-center font-technical font-bold text-[8px]">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}
