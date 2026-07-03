"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
} from "@/app/data-actions";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions";

export interface NotifItem {
  id: string;
  type: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date | string;
}

interface NotifContextValue {
  unread: number;
  items: NotifItem[];
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotifContext = createContext<NotifContextValue>({
  unread: 0,
  items: [],
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

export function useNotifications() {
  return useContext(NotifContext);
}

export default function NotificationsSync({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    const res = (await getNotificationsAction()) as { unread: number; items: NotifItem[] };
    setUnread(res.unread);
    setItems(res.items);
  }, []);

  useEffect(() => {
    void refresh();
    const es = new EventSource(`/api/realtime`, { withCredentials: true });
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "notification") {
          // increment unread + prepend
          setUnread((u) => u + 1);
          setItems((prev) =>
            [
              {
                id: `live-${Date.now()}`,
                type: data.notifType,
                body: data.body,
                link: data.link ?? null,
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 30),
          );
        }
      } catch {
        /* ignore */
      }
    };
    const interval = setInterval(() => void refresh(), 60_000);
    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await markNotificationReadAction(id);
    router.refresh();
  }, [router]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await markAllNotificationsReadAction();
    router.refresh();
  }, [router]);

  return (
    <NotifContext.Provider value={{ unread, items, refresh, markRead, markAllRead }}>
      {children}
    </NotifContext.Provider>
  );
}
