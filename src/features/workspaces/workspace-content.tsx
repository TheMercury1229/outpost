import {
  WorkspaceBoard,
  type BoardWorkspace,
} from "@/features/workspaces/components/workspace-board";
import { WorkspaceDialog } from "@/features/workspaces/components/workspace-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export const WorkspaceContent = ({
  workspaces,
  orgName,
}: {
  workspaces: BoardWorkspace[];
  orgName: string;
}) => {
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
      {workspaces.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-muted-foreground">
          No workspaces yet. Start one from the dashboard or with the New
          Workspace.
        </p>
      ) : (
        <WorkspaceBoard workspaces={workspaces} />
      )}
    </div>
  );
};
