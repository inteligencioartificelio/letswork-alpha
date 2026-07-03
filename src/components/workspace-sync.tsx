"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getActivityFeedAction } from "@/app/data-actions";

export interface PresenceUser {
  userId: string;
  username: string;
  displayName: string | null;
}
export interface ActivityEvent {
  id: string;
  text: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  userId?: string | null;
  username?: string;
  displayName?: string | null;
  createdAt: Date | string;
}

interface WsContextValue {
  presence: PresenceUser[];
  activity: ActivityEvent[];
}

const WsContext = createContext<WsContextValue>({ presence: [], activity: [] });

export function useWorkspaceRealtime() {
  return useContext(WsContext);
}

export default function WorkspaceSync({
  workspaceId,
  initialActivity,
  currentUserId,
  children,
}: {
  workspaceId: string;
  initialActivity: ActivityEvent[];
  currentUserId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSE
  useEffect(() => {
    const es = new EventSource(`/api/realtime?workspace=${encodeURIComponent(workspaceId)}`, {
      withCredentials: true,
    });
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "presence") {
          setPresence((data.presence as PresenceUser[]) ?? []);
        } else if (data.type === "activity") {
          // prepend live activity (dedupe by id/text+time)
          setActivity((prev) => {
            const next: ActivityEvent = {
              id: `live-${Date.now()}`,
              text: data.text,
              action: data.action,
              entityType: data.entityType,
              entityId: data.entityId,
              userId: data.userId,
              username: data.username,
              displayName: data.displayName ?? null,
              createdAt: new Date().toISOString(),
            };
            return [next, ...prev].slice(0, 40);
          });
          // also refresh server data
          scheduleRefresh();
        } else if (data.type === "refresh") {
          scheduleRefresh();
        } else if (data.type === "notification") {
          // handled globally by NotificationsSync; just refresh counts indirectly
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // Debounced router.refresh to avoid hammering on rapid events
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      router.refresh();
    }, 250);
  }, [router]);

  // Presence heartbeat
  useEffect(() => {
    const beat = () => {
      void fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
        credentials: "include",
      }).catch(() => {});
    };
    beat();
    const interval = setInterval(beat, 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [workspaceId]);

  return (
    <WsContext.Provider value={{ presence, activity }}>{children}</WsContext.Provider>
  );
}
