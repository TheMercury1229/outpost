import { checkUser } from "@/actions/check-user";
import { getWorkspaces } from "@/actions/dashboard-actions";
import { DashboardPageContent } from "@/features/dashboard/dashboard-content";
import { getWorkspaceScope } from "@/lib/workspace-scope";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect("/sign-in");
  const { orgName, where } = await getWorkspaceScope(user.id);
  const workspaces = await getWorkspaces(where);

  return (
    <DashboardPageContent
      workspaces={{
        all: workspaces.all.map((workspace) => ({
          ...workspace,
          lastActivity: workspace.updatedAt,
        })),
        recent: workspaces.recent.map((workspace) => ({
          ...workspace,
          lastActivity: workspace.updatedAt,
        })),
      }}
      orgName={orgName}
    />
  );
}
