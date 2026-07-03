"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./notifications-sync";
import { cn, formatDateLong } from "@/lib/utils";

export default function NotificationsBell() {
  const { unread, items, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 border border-ink-border hover:bg-surface"
        title="Notificaciones"
      >
        <Bell className="w-4 h-4" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-highlight text-paper text-[8px] font-bold font-technical flex items-center justify-center border border-ink-border">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-0 right-0 mb-12 w-80 max-w-[90vw] bg-paper border border-ink-border shadow-2xl flex flex-col max-h-[70vh] z-50">
          <div className="flex items-center justify-between p-3 border-b border-ink-border bg-surface">
            <span className="text-[10px] font-bold font-technical uppercase tracking-widest">
              Notificaciones {unread > 0 && `(${unread})`}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => void markAllRead()}
                  className="text-[9px] font-technical uppercase tracking-widest text-ink-muted hover:text-ink flex items-center gap-1"
                  title="Marcar todo como leído"
                >
                  <Check className="w-3 h-3" strokeWidth={2.5} /> Todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {items.length === 0 && (
              <p className="text-[11px] text-ink-muted italic p-4 text-center">Sin notificaciones.</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={async () => {
                  if (!n.read) await markRead(n.id);
                  if (n.link) {
                    setOpen(false);
                    router.push(n.link);
                  }
                }}
                className={cn(
                  "w-full text-left p-3 border-b border-ink-border hover:bg-surface block",
                  !n.read && "bg-surface",
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                      n.read ? "bg-ink-border" : "bg-highlight",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium leading-snug m-0">{n.body}</p>
                    <span className="text-[9px] font-technical uppercase tracking-widest text-ink-muted">
                      {formatDateLong(n.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
