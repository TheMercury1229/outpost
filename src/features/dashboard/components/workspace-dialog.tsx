"use client";

import { createWorkspace } from "@/actions/dashboard-actions";
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

export const WorkspaceDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
        </DialogHeader>
        <WorkspaceForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

function WorkspaceForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { fn: createWorkspaceFn, loading } = useFetch(createWorkspace);
  const openUpgrade = useUpgradeDialog();
  async function handleSubmit() {
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
        <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
          {!loading ? "Create" : "Creating..."}
        </Button>
      </DialogFooter>
    </>
  );
}
