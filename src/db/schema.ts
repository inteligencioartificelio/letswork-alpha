import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/pg-core";

/* ---------- Users ---------- */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: varchar("username", { length: 50 }).unique().notNull(),
    email: varchar("email", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 100 }),
    avatarData: text("avatar_data"),
    themePreset: varchar("theme_preset", { length: 2 }).default("00").notNull(),
    dualInkMode: boolean("dual_ink_mode").default(true).notNull(),
    compactLayout: boolean("compact_layout").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

/* ---------- Workspaces (Espacios) ---------- */
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

/* ---------- Workspace members (colaboración) ---------- */
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 20 }).default("member").notNull(), // owner | admin | member
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("workspace_member_unique").on(t.workspaceId, t.userId),
    index("wm_workspace_idx").on(t.workspaceId),
  ],
);

/* ---------- Projects ---------- */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("planned").notNull(), // planned|active|completed|paused|archived
    color: varchar("color", { length: 7 }),
    dueDate: timestamp("due_date"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdBy: uuid("created_by").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("proj_workspace_idx").on(t.workspaceId)],
);

/* ---------- Tasks ---------- */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("todo").notNull(), // backlog|todo|in_progress|in_review|done
    priority: varchar("priority", { length: 15 }).default("medium").notNull(), // low|medium|high|urgent
    dueDate: timestamp("due_date"),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdBy: uuid("created_by").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("task_workspace_idx").on(t.workspaceId),
    index("task_project_idx").on(t.projectId),
    index("task_status_idx").on(t.status),
    index("task_assigned_idx").on(t.assignedTo),
  ],
);

/* ---------- Labels ---------- */
export const labels = pgTable(
  "labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 40 }).notNull(),
    color: varchar("color", { length: 7 }).default("#080808"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("label_workspace_unique").on(t.workspaceId, t.name)],
);

/* ---------- Task <-> Labels ---------- */
export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    labelId: uuid("label_id")
      .references(() => labels.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.labelId] })],
);

/* ---------- Task comments (Phase 2) ---------- */
export const taskComments = pgTable(
  "task_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("comment_task_idx").on(t.taskId)],
);

/* ---------- Activity log (Phase 2/3) ---------- */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    entityType: varchar("entity_type", { length: 30 }).notNull(),
    entityId: uuid("entity_id"),
    action: varchar("action", { length: 30 }).notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("activity_workspace_idx").on(t.workspaceId)],
);

/* ---------- Notifications (Phase 2/3) ---------- */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 40 }).notNull(),
    body: text("body").notNull(),
    link: varchar("link", { length: 255 }),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("notif_user_idx").on(t.userId)],
);

/* ---------- Type helpers ---------- */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Label = typeof labels.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
