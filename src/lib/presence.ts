import "server-only";
import { emit, workspaceChannel } from "./realtime";

export interface PresenceUser {
  userId: string;
  username: string;
  displayName: string | null;
  lastSeen: number;
}

// workspaceId -> userId -> PresenceUser
const presence = new Map<string, Map<string, PresenceUser>>();
const STALE_MS = 45_000;

function prune(wsId: string): boolean {
  const ws = presence.get(wsId);
  if (!ws) return false;
  const now = Date.now();
  let changed = false;
  for (const [uid, p] of ws) {
    if (now - p.lastSeen > STALE_MS) {
      ws.delete(uid);
      changed = true;
    }
  }
  if (ws.size === 0) presence.delete(wsId);
  return changed;
}

function snapshot(wsId: string): PresenceUser[] {
  const ws = presence.get(wsId);
  if (!ws) return [];
  return [...ws.values()].sort((a, b) =>
    (a.displayName ?? a.username).localeCompare(b.displayName ?? b.username),
  );
}

/** Heartbeat: registra/actualiza la presencia y emite si cambió el conjunto. */
export async function heartbeat(
  wsId: string,
  user: { id: string; username: string; displayName: string | null },
): Promise<PresenceUser[]> {
  let ws = presence.get(wsId);
  if (!ws) {
    ws = new Map();
    presence.set(wsId, ws);
  }
  const prev = ws.get(user.id);
  const isNew = !prev;
  ws.set(user.id, {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    lastSeen: Date.now(),
  });

  let changed = prune(wsId) || isNew;

  if (changed) {
    const list = snapshot(wsId);
    await emit(workspaceChannel(wsId), {
      type: "presence",
      workspaceId: wsId,
      presence: list,
    });
    return list;
  }
  return snapshot(wsId);
}

/** Devuelve la presencia actual (sin emitir). */
export function getPresence(wsId: string): PresenceUser[] {
  prune(wsId);
  return snapshot(wsId);
}

/** Fuerza prune global (llamar periódicamente). */
export function pruneAll(): void {
  let anyChanged = false;
  for (const wsId of [...presence.keys()]) {
    if (prune(wsId)) anyChanged = true;
  }
}
