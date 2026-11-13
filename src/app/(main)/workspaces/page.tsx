import { checkUser } from "@/actions/check-user";
import { getWorkspaces } from "@/actions/workspaces-actions";
import { WorkspaceBoard, type BoardWorkspace } from "@/features/workspaces/components/workspace-board";
import { WorkspaceDialog } from "@/features/workspaces/components/workspace-dialog";
import { Button } from "@/components/ui/button";
import { getWorkspaceScope } from "@/lib/workspace-scope";
import { withLastActivity } from "@/lib/workspace-status";
import { PlusIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function WorkspacesPage() {
  const user = await checkUser();
  if (!user) redirect("/sign-in");
  const { orgName, where } = await getWorkspaceScope(user.id);
  const { all: workspaces } = await getWorkspaces(where);
  const items: BoardWorkspace[] = workspaces.map(withLastActivity);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{orgName}</p>
          <h1 className="text-2xl font-semibold">All workspaces</h1>
        </div>
        <WorkspaceDialog
          trigger={
            <Button className="gap-2">
              <PlusIcon className="size-4" />
              New workspace
            </Button>
          }
        />
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-muted-foreground">
          No workspaces yet. Start one from the dashboard or with the New
          Workspace.
        </p>
      ) : (
        <WorkspaceBoard workspaces={items} />
      )}
    </div>
  );
}
