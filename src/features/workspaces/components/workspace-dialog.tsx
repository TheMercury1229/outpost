"use client";

import { createWorkspace } from "@/actions/dashboard-actions";
import { updateWorkspace } from "@/actions/workspaces-actions";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UPGRADE_REASONS } from "@/data/plan-limits";
import { useFetch } from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type WorkspaceDetails = {
  id: string;
  name: string;
  description: string | null;
};

export const WorkspaceDialog = ({
  trigger,
  workspace,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  workspace?: WorkspaceDetails;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const handleOpenChange = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {workspace ? "Edit workspace" : "Create a workspace"}
          </DialogTitle>
        </DialogHeader>
        <WorkspaceForm
          key={`${workspace?.id ?? "new"}-${open}`}
          workspace={workspace}
          onDone={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

function WorkspaceForm({
  workspace,
  onDone,
}: {
  workspace?: WorkspaceDetails;
  onDone: () => void;
}) {
  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const router = useRouter();
  const { fn: createWorkspaceFn, loading } = useFetch(createWorkspace);
  const { fn: updateWorkspaceFn, loading: updating } =
    useFetch(updateWorkspace);
  const openUpgrade = useUpgradeDialog();
  const isEditing = !!workspace;
  const isLoading = loading || updating;
  async function handleSubmit() {
    if (workspace) {
      const result = await updateWorkspaceFn(
        workspace.id,
        name,
        description,
      );
      if (!result) return;
      onDone();
      toast.success("Workspace updated");
      return;
    }

    const result = await createWorkspaceFn(name, description);
    if (!result) return;
    onDone();
    if ("limit" in result) {
      return openUpgrade(UPGRADE_REASONS[result.limit]);
    }
    toast.success("Workspace created");
    router.push(`/workspaces/${result.workspace.id}`);
  }
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="workspace-name">Name</Label>
        <Input
          id="workspace-name"
          placeholder="Q1 Marketing Launch"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workspace-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="workspace-description"
          placeholder="What's this workspace for "
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
          {isLoading
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save"
              : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
}
