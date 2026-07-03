import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscribe, workspaceChannel, userChannel } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const workspaceId = req.nextUrl.searchParams.get("workspace");
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      const send = (data: unknown) => safeEnqueue(`data: ${JSON.stringify(data)}\n\n`);

      send({ type: "connected", userId: user.id });

      const unsubs: Array<() => Promise<void>> = [];

      // Canal del workspace (eventos de tareas/proyectos/presencia/activity)
      if (workspaceId) {
        try {
          const unsub = await subscribe(workspaceChannel(workspaceId), (payload) => {
            try {
              send(JSON.parse(payload));
            } catch {
              send({ raw: payload });
            }
          });
          unsubs.push(unsub);
        } catch (err) {
          console.error("[realtime] subscribe workspace failed:", err);
        }
      }

      // Canal personal de notificaciones
      try {
        const userUnsub = await subscribe(userChannel(user.id), (payload) => {
          try {
            send(JSON.parse(payload));
          } catch {
            send({ raw: payload });
          }
        });
        unsubs.push(userUnsub);
      } catch (err) {
        console.error("[realtime] subscribe user failed:", err);
      }

      // Keepalive para evitar que proxies (localtunnel/Railway) corten la conexión
      const keepalive = setInterval(() => safeEnqueue(`: keepalive\n\n`), 25_000);

      const cleanup = async () => {
        closed = true;
        clearInterval(keepalive);
        for (const u of unsubs) {
          try {
            await u();
          } catch {
            /* ignore */
          }
        }
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };

      req.signal.addEventListener("abort", () => {
        void cleanup();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
