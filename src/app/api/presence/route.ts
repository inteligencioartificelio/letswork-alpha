import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { heartbeat } from "@/lib/presence";
import { getDB } from "@/lib/db";
import { workspaceMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const workspaceId = body.workspaceId;
  if (!workspaceId) return NextResponse.json({ error: "missing workspaceId" }, { status: 400 });

  // Verifica membresía
  const db = await getDB();
  const [m] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)));
  if (!m) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const presence = await heartbeat(workspaceId, {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  });
  return NextResponse.json({ ok: true, presence });
}
