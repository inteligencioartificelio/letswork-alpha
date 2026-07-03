/**
 * Esquema DDL idempotente (CREATE TABLE IF NOT EXISTS).
 * Fuente de verdad para la creación de tablas en PGlite (local) y Postgres (prod).
 * Mantener sincronizado con src/db/schema.ts.
 */
export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" varchar(50) UNIQUE NOT NULL,
  "email" varchar(255) UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "display_name" varchar(100),
  "avatar_data" text,
  "theme_preset" varchar(2) NOT NULL DEFAULT '00',
  "dual_ink_mode" boolean NOT NULL DEFAULT true,
  "compact_layout" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "description" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role" varchar(20) NOT NULL DEFAULT 'member',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id","user_id")
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "name" varchar(150) NOT NULL,
  "description" text,
  "status" varchar(20) NOT NULL DEFAULT 'planned',
  "color" varchar(7),
  "due_date" timestamptz,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "title" varchar(255) NOT NULL,
  "description" text,
  "status" varchar(20) NOT NULL DEFAULT 'todo',
  "priority" varchar(15) NOT NULL DEFAULT 'medium',
  "due_date" timestamptz,
  "assigned_to" uuid REFERENCES "users"("id") ON DELETE set null,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "labels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "name" varchar(40) NOT NULL,
  "color" varchar(7) DEFAULT '#080808',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id","name")
);

CREATE TABLE IF NOT EXISTS "task_labels" (
  "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE cascade,
  "label_id" uuid NOT NULL REFERENCES "labels"("id") ON DELETE cascade,
  PRIMARY KEY ("task_id","label_id")
);

CREATE TABLE IF NOT EXISTS "task_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activity_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "user_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "entity_type" varchar(30) NOT NULL,
  "entity_id" uuid,
  "action" varchar(30) NOT NULL,
  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "type" varchar(40) NOT NULL,
  "body" text NOT NULL,
  "link" varchar(255),
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "wm_workspace_idx" ON "workspace_members" ("workspace_id");
CREATE INDEX IF NOT EXISTS "proj_workspace_idx" ON "projects" ("workspace_id");
CREATE INDEX IF NOT EXISTS "task_workspace_idx" ON "tasks" ("workspace_id");
CREATE INDEX IF NOT EXISTS "task_project_idx" ON "tasks" ("project_id");
CREATE INDEX IF NOT EXISTS "task_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "task_assigned_idx" ON "tasks" ("assigned_to");
CREATE INDEX IF NOT EXISTS "comment_task_idx" ON "task_comments" ("task_id");
CREATE INDEX IF NOT EXISTS "activity_workspace_idx" ON "activity_log" ("workspace_id");
CREATE INDEX IF NOT EXISTS "notif_user_idx" ON "notifications" ("user_id");
`;
