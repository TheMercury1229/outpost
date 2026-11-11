import { WorkspaceCardData } from "./types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { KanbanSquareIcon, PlusIcon } from "lucide-react";
import { RecentWorkspaces } from "./components/recent-workspaces";
import { WorkspaceDialog } from "./components/workspace-dialog";
import { DashboardPrompt } from "./components/dashboard-prompt";

export const DashboardPageContent = ({
  workspaces,
  orgName,
}: {
  workspaces: {
    all: WorkspaceCardData[];
    recent: WorkspaceCardData[];
  };
  orgName: string | null;
}) => {
  return (
    <div className="p-8">
      <DashboardPrompt />
      <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            {orgName && (
              <p className="text-xs text-muted-foreground">{orgName}</p>
            )}
            <h2 className="text-lg font-semibold">Recent workspaces</h2>
          </div>
          <div className="flex items-center gap-2">
            {workspaces.all.length > 0 && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <Link href="/workspaces">
                  <KanbanSquareIcon className="size-4" />
                  View board
                </Link>
              </Button>
            )}
            <WorkspaceDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <PlusIcon className="size-4" />
                  New workspace
                </Button>
              }
            />
          </div>
        </div>
        {workspaces.all.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-muted-foreground">
            No workspaces yet. Describe what you want to plan above to start
            one.
          </p>
        ) : (
          <RecentWorkspaces workspaces={workspaces.recent} />
        )}
      </section>
    </div>
  );
};
