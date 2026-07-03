"use client";

import { useWorkspaceRealtime, type ActivityEvent } from "./workspace-sync";
import { formatDateLong, monogram } from "@/lib/utils";

export default function ActivityFeed({ initial }: { initial: ActivityEvent[] }) {
  const { activity } = useWorkspaceRealtime();
  const items = activity.length > 0 ? activity : initial;

  return (
    <div className="border border-ink-border rounded-[var(--radius)] flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-ink-border bg-surface">
        <h2 className="text-[10px] font-bold font-technical uppercase tracking-widest m-0">
          Actividad Reciente
        </h2>
        <span className="w-1.5 h-1.5 rounded-full bg-highlight" title="En vivo" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
        {items.length === 0 && (
          <p className="text-[11px] text-ink-muted italic text-center py-4">
            Sin actividad todavía.
          </p>
        )}
        {items.map((a, i) => (
          <div key={a.id ?? i} className="flex gap-2.5">
            <div className="w-5 h-5 shrink-0 bg-paper border border-ink-border flex items-center justify-center font-technical font-bold text-[8px] uppercase">
              {monogram(a.displayName || a.username || "?")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-snug m-0">
                <span className="font-bold">{a.displayName || a.username || "Alguien"}</span>{" "}
                <span className="text-ink-muted">{a.text}</span>
              </p>
              <span className="text-[9px] font-technical uppercase tracking-widest text-ink-muted">
                {formatDateLong(a.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
