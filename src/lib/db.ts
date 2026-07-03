import path from "node:path";
import { eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import { MIGRATION_SQL } from "@/db/migrations";
import { hashPassword } from "@/lib/password";

export type DB = NodePgDatabase<typeof schema>;
export type DbType = "pg" | "pglite";

let _db: any = null;
let _client: any = null;
let _dbType: DbType = "pglite";
let _initPromise: Promise<void> | null = null;

export function getDbType(): DbType {
  return _dbType;
}

async function createClient(): Promise<void> {
  const url = process.env.DATABASE_URL;

  if (url && url.trim().length > 0) {
    _dbType = "pg";
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({
      connectionString: url,
      max: 8,
      ssl: url.includes("railway") || url.includes("render") || url.includes("supabase")
        ? { rejectUnauthorized: false }
        : undefined,
    });
    _client = pool;
    _db = drizzle(pool, { schema });
  } else {
    _dbType = "pglite";
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dataDir = path.join(process.cwd(), ".pglite");
    const pglite = new PGlite(dataDir);
    _client = pglite;
    _db = drizzle(pglite, { schema });
  }
}

async function runMigrations(): Promise<void> {
  if (_dbType === "pglite") {
    // PGlite exec accepts multi-statement SQL
    await _client.exec(MIGRATION_SQL);
  } else {
    // node-postgres simple query supports multi-statement
    await _client.query(MIGRATION_SQL);
  }
}

async function seedIfEmpty(): Promise<void> {
  const db = _db as DB;
  const userRows = await db.select({ c: sql<number>`count(*)` }).from(schema.users);
  const count = Number(userRows[0]?.c ?? 0);
  if (count > 0) return;

  const adminHash = hashPassword("admin123");
  const [admin] = await db
    .insert(schema.users)
    .values({
      username: "admin",
      passwordHash: adminHash,
      displayName: "Administrador",
      themePreset: "00",
    })
    .returning();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const [ws1] = await db
    .insert(schema.workspaces)
    .values({
      name: "Dirección Estratégica",
      description: "Liderazgo, planificación de recursos, alineamiento de objetivos y KPI principales.",
      sortOrder: 1,
      createdBy: admin.id,
    })
    .returning();
  const [ws2] = await db
    .insert(schema.workspaces)
    .values({
      name: "Operaciones e Ingeniería",
      description: "Desarrollo de software, despliegue continuo, arquitectura de sistemas y soporte técnico.",
      sortOrder: 2,
      createdBy: admin.id,
    })
    .returning();
  const [ws3] = await db
    .insert(schema.workspaces)
    .values({
      name: "Marketing y Crecimiento",
      description: "Campañas, relaciones públicas, adquisición de leads y embajadores de marca.",
      sortOrder: 3,
      createdBy: admin.id,
    })
    .returning();

  await db
    .insert(schema.workspaceMembers)
    .values([
      { workspaceId: ws1.id, userId: admin.id, role: "owner" },
      { workspaceId: ws2.id, userId: admin.id, role: "owner" },
      { workspaceId: ws3.id, userId: admin.id, role: "owner" },
    ]);

  const [prj1] = await db
    .insert(schema.projects)
    .values({
      workspaceId: ws2.id,
      name: "Migración a Next.js 15 y Drizzle",
      description: "Refactorizar el backend para reducir la latencia de la API a menos de 5ms.",
      status: "active",
      dueDate: new Date(now + 15 * day),
      sortOrder: 1,
      createdBy: admin.id,
    })
    .returning();
  const [prj2] = await db
    .insert(schema.projects)
    .values({
      workspaceId: ws2.id,
      name: "Infraestructura de Tinta Electrónica",
      description: "Middleware de compresión y Bayer Dithering para pantallas e-ink.",
      status: "planned",
      dueDate: new Date(now + 45 * day),
      sortOrder: 2,
      createdBy: admin.id,
    })
    .returning();

  await db
    .insert(schema.labels)
    .values([
      { workspaceId: ws2.id, name: "Frontend", color: "#2B5C8F" },
      { workspaceId: ws2.id, name: "Backend", color: "#5E7D43" },
      { workspaceId: ws2.id, name: "Urgente", color: "#CD4E1E" },
    ]);

  const [labFe] = await db
    .insert(schema.labels)
    .values({ workspaceId: ws2.id, name: "Frontend", color: "#2B5C8F" })
    .onConflictDoNothing()
    .returning();
  const [labBe] = await db
    .insert(schema.labels)
    .values({ workspaceId: ws2.id, name: "Backend", color: "#5E7D43" })
    .onConflictDoNothing()
    .returning();

  const [t1] = await db
    .insert(schema.tasks)
    .values({
      workspaceId: ws2.id,
      projectId: prj1.id,
      title: "Configurar variables CSS y catálogo de 27 presets",
      description: "Garantizar que todos los tokens cromáticos respondan a 0ms de transición.",
      status: "done",
      priority: "high",
      assignedTo: admin.id,
      sortOrder: 1,
      createdBy: admin.id,
    })
    .returning();
  const [t2] = await db
    .insert(schema.tasks)
    .values({
      workspaceId: ws2.id,
      projectId: prj1.id,
      title: "Implementar algoritmo de dithering en perfil",
      description: "Helper en canvas para triturar avatares a blanco y negro Bayer 4x4.",
      status: "in_progress",
      priority: "medium",
      assignedTo: admin.id,
      sortOrder: 1,
      createdBy: admin.id,
    })
    .returning();
  const [t3] = await db
    .insert(schema.tasks)
    .values({
      workspaceId: ws2.id,
      projectId: prj2.id,
      title: "Diseñar grid de Kanban arrastrable",
      description: "Columnas por estado con drag & drop y reordenamiento.",
      status: "todo",
      priority: "high",
      assignedTo: admin.id,
      sortOrder: 1,
      createdBy: admin.id,
    })
    .returning();
  const [t4] = await db
    .insert(schema.tasks)
    .values({
      workspaceId: ws2.id,
      title: "Auditar costes de Railway para el equipo",
      description: "Optimizar variables de entorno para bajar RAM por debajo de 256MB.",
      status: "backlog",
      priority: "low",
      assignedTo: admin.id,
      sortOrder: 1,
      createdBy: admin.id,
    })
    .returning();
  const [t5] = await db
    .insert(schema.tasks)
    .values({
      workspaceId: ws2.id,
      projectId: prj1.id,
      title: "Revisar accesibilidad de la paleta Dual-Ink",
      description: "Contraste WCAG AA en los 27 presets.",
      status: "in_review",
      priority: "medium",
      assignedTo: admin.id,
      sortOrder: 2,
      createdBy: admin.id,
    })
    .returning();

  const labelIds = [labFe?.id, labBe?.id].filter(Boolean) as string[];
  if (labelIds.length && labFe && labBe) {
    await db
      .insert(schema.taskLabels)
      .values([
        { taskId: t2.id, labelId: labFe.id },
        { taskId: t2.id, labelId: labBe.id },
        { taskId: t3.id, labelId: labFe.id },
        { taskId: t1.id, labelId: labFe.id },
      ])
      .onConflictDoNothing();
  }
}

export async function ensureDB(): Promise<void> {
  if (!_initPromise) {
    _initPromise = (async () => {
      await createClient();
      await runMigrations();
      await seedIfEmpty();
    })().catch((err) => {
      _initPromise = null;
      throw err;
    });
  }
  await _initPromise;
}

/** Returns the typed Drizzle instance (migrated & seeded). */
export async function getDB(): Promise<DB> {
  await ensureDB();
  return _db as DB;
}

/** Returns the raw underlying client (PGlite instance or pg Pool) for LISTEN/NOTIFY etc. */
export async function getRawClient(): Promise<any> {
  await ensureDB();
  return _client;
}
