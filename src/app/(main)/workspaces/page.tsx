import { checkUser } from "@/actions/check-user";
import { getWorkspaces } from "@/actions/workspaces-actions";
import { WorkspaceContent } from "@/features/workspaces/workspace-content";
import { getWorkspaceScope } from "@/lib/workspace-scope";
import { withLastActivity } from "@/lib/workspace-status";
import { redirect } from "next/navigation";

export default async function WorkspacesPage() {
  const user = await checkUser();
  if (!user) redirect("/sign-in");
  const { orgName, where } = await getWorkspaceScope(user.id);
  const { all: workspaces } = await getWorkspaces(where);
  return (
    <WorkspaceContent
      workspaces={workspaces.map(withLastActivity)}
      orgName={orgName}
    />
  );
}
