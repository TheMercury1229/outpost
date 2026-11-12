import { WorkspaceCardData } from "../types";
import { WorkspaceCard } from "@/features/workspaces/components/workspace-card";

export const RecentWorkspaces = ({
  workspaces,
}: {
  workspaces: WorkspaceCardData[];
}) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} showStatus />
      ))}
    </div>
  );
};
