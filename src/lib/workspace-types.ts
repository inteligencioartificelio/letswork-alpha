import type { Task, Project, Label, User, Workspace } from "@/db/schema";

export type Member = { id: string; username: string; displayName: string | null };
export type LabelRef = { id: string; name: string; color: string | null };
export type TaskWithLabels = Task & { labels: LabelRef[] };

export interface ActivityItem {
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

export interface WorkspaceViewProps {
  workspace: Workspace;
  projects: Project[];
  tasks: TaskWithLabels[];
  members: Member[];
  labels: Label[];
  currentUser: User;
  initialActivity: ActivityItem[];
  initialProjectFilter?: string;
  initialOpenTaskId?: string;
}
