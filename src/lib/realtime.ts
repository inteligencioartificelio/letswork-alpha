import "server-only";
import { getRawClient, getDbType } from "./db";

/**
 * Real-time layer sobre Postgres LISTEN/NOTIFY.
 * - PGlite (local): pglite.listen() + exec("NOTIFY ...")
 * - node-postgres (prod): pool.connect() dedicado + query("LISTEN/NOTIFY")
 *
 * Multiplexa un único LISTEN subyacente por canal para muchos suscriptores SSE.
 * Funciona single-instance (local) y cross-instance (Railway con varias réplicas).
 */

type Handler = (payload: string) => void;

interface ChannelEntry {
  handlers: Set<Handler>;
  cleanup: () => Promise<void>;
}

const channels = new Map<string, ChannelEntry>();

function fanout(channel: string, payload: string) {
  const entry = channels.get(channel);
  if (!entry) return;
  for (const h of entry.handlers) {
    try {
      h(payload);
    } catch {
      /* ignore handler errors */
    }
  }
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function startListening(channel: string): Promise<() => Promise<void>> {
  const client = await getRawClient();
  const type = getDbType();

  if (type === "pglite") {
    const unsub = await (client as any).listen(channel, (payload: string) => {
      fanout(channel, payload);
    });
    return async () => {
      try {
        await unsub();
      } catch {
        /* ignore */
      }
    };
  }

  // node-postgres: reserva un cliente dedicado del pool para LISTEN
  const pgClient = await (client as any).connect();
  await pgClient.query(`LISTEN ${quoteIdent(channel)}`);
  const onNotif = (msg: { channel: string; payload: string }) => {
    if (msg.channel === channel) fanout(channel, msg.payload);
  };
  pgClient.on("notification", onNotif);
  return async () => {
    try {
      pgClient.off("notification", onNotif);
      await pgClient.query(`UNLISTEN ${quoteIdent(channel)}`);
    } catch {
      /* ignore */
    } finally {
      try {
        pgClient.release();
      } catch {
        /* ignore */
      }
    }
  };
}

/** Suscribe un handler a un canal. Devuelve función para desuscribir. */
export async function subscribe(channel: string, handler: Handler): Promise<() => Promise<void>> {
  let entry = channels.get(channel);
  if (!entry) {
    const handlers = new Set<Handler>();
    const placeholder: ChannelEntry = { handlers, cleanup: async () => {} };
    channels.set(channel, placeholder);
    try {
      const cleanup = await startListening(channel);
      placeholder.cleanup = cleanup;
    } catch (err) {
      channels.delete(channel);
      throw err;
    }
    entry = placeholder;
  }
  entry.handlers.add(handler);
  return async () => {
    const e = channels.get(channel);
    if (!e) return;
    e.handlers.delete(handler);
    if (e.handlers.size === 0) {
      channels.delete(channel);
      try {
        await e.cleanup();
      } catch {
        /* ignore */
      }
    }
  };
}

/** Emite un NOTIFY en un canal (llega a todos los LISTEN del canal, local o remoto). */
export async function notify(channel: string, payload: string): Promise<void> {
  try {
    const client = await getRawClient();
    const type = getDbType();
    const sql = `NOTIFY ${quoteIdent(channel)}, ${quoteLiteral(payload)}`;
    if (type === "pglite") {
      await (client as any).exec(sql);
    } else {
      await (client as any).query(sql);
    }
  } catch {
    /* notify es best-effort */
  }
}

export function workspaceChannel(workspaceId: string): string {
  return `ws_${workspaceId.replace(/[^a-zA-Z0-9]/g, "")}`;
}
export function userChannel(userId: string): string {
  return `user_${userId.replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** Emite un evento tipado a un canal. */
export async function emit(channel: string, event: Record<string, unknown>): Promise<void> {
  await notify(channel, JSON.stringify(event));
}
