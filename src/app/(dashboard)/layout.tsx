import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { workspaces } from "@/db/schema";
import Sidebar from "@/components/sidebar";
import AppShell from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getDB();
  const wsList = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .orderBy(asc(workspaces.sortOrder), asc(workspaces.createdAt));

  return (
    <AppShell sidebar={<Sidebar />} workspaces={wsList}>
      {children}
    </AppShell>
  );
}
