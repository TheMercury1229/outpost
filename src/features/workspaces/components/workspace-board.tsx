"use client";

import { WorkspaceCardData } from "@/features/dashboard/types";
import { useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { WORKSPACE_STATUSES } from "@/lib/workspace-status";
import { WorkspaceStatus } from "@/generated/prisma/enums";
import { cn } from "cn";
import { WorkspaceCard } from "@/features/dashboard/components/workspace-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFetch } from "@/hooks/use-fetch";
import { deleteWorkspace, moveWorkspace } from "@/actions/workspaces-actions";
import { WorkspaceDialog } from "@/features/dashboard/components/workspace-dialog";
import { toast } from "sonner";
export type BoardWorkspace = WorkspaceCardData & { position: number };

function columnItems(workspaces: BoardWorkspace[], status: WorkspaceStatus) {
  return workspaces
    .filter((workspace) => workspace.status === status)
    .sort((a, b) => a.position - b.position);
}

function positionBetween(before?: BoardWorkspace, after?: BoardWorkspace) {
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 0;
}

function WorkspaceCardActionMenu({
  workspace,
  setSelected,
  setDeleteOpen,
  setEditOpen,
}: {
  workspace: BoardWorkspace;
  setSelected: (workspace: BoardWorkspace) => void;
  setDeleteOpen: (open: boolean) => void;
  setEditOpen: (open: boolean) => void;
}) {
  function confirmDelete(workspace: BoardWorkspace) {
    setSelected(workspace);
    setDeleteOpen(true);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Workspace options"
          className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              setSelected(workspace);
              setEditOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              confirmDelete(workspace);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DeleteWorkspaceDialog({
  deleteOpen,
  setDeleteOpen,
  selected,
  handleDelete,
  isDeleting,
}: {
  deleteOpen: boolean;
  selected: BoardWorkspace | null;
  setDeleteOpen: (open: boolean) => void;
  handleDelete: React.MouseEventHandler<HTMLButtonElement>;
  isDeleting: boolean | null;
}) {
  return (
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &ldquo;{selected?.name}&rdquo;
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the workspace and all of its data. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={!!isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const WorkspaceBoard = ({
  workspaces,
}: {
  workspaces: BoardWorkspace[];
}) => {
  const [items, setItems] = useState<BoardWorkspace[]>(workspaces);
  const [prevWorkspaces, setPrevWorkspaces] =
    useState<BoardWorkspace[]>(workspaces);

  if (workspaces !== prevWorkspaces) {
    setItems(workspaces);
    setPrevWorkspaces(workspaces);
  }

  const [selected, setSelected] = useState<BoardWorkspace | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);

  const handleDragEnd = async ({
    draggableId,
    source,
    destination,
  }: DropResult) => {
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const status = destination.droppableId as WorkspaceStatus;
    const target = columnItems(items, status).filter(
      (w) => w.id !== draggableId,
    );
    const position = positionBetween(
      target[destination.index - 1],
      target[destination.index],
    );

    const previous = items;
    setItems(
      items.map((w) => (w.id === draggableId ? { ...w, status, position } : w)),
    );

    try {
      await moveWorkspace(draggableId, status, position);
    } catch (error) {
      setItems(previous);
      toast.error("Failed to move workspace. Please try again.");
    }
  };

  const { fn: deleteWorkspaceFn, loading: isDeleting } =
    useFetch(deleteWorkspace);
  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!selected) return;
    await deleteWorkspaceFn(selected.id);
    setDeleteOpen(false);
  }
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {WORKSPACE_STATUSES.map((column) => {
          const columnWorkspaces = columnItems(items, column.status);
          return (
            <div
              key={column.status}
              className="flex flex-col rounded-lg bg-white/3"
            >
              <div className="flex items-center gap-2 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {column.title}
                <div className="font-normal">{columnWorkspaces.length} </div>
              </div>

              <Droppable droppableId={column.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex min-h-40 flex-1 flex-col gap-1.5 rounded-b-lg p-2 transition-colors",
                      snapshot.isDraggingOver ? "bg-primary/5" : "",
                    )}
                  >
                    {columnWorkspaces.map((workspace, index) => (
                      <Draggable
                        key={workspace.id}
                        draggableId={workspace.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <WorkspaceCard
                              workspace={workspace}
                              highlighted={snapshot.isDragging}
                              actions={
                                <WorkspaceCardActionMenu
                                  workspace={workspace}
                                  setSelected={setSelected}
                                  setDeleteOpen={setDeleteOpen}
                                  setEditOpen={setEditOpen}
                                />
                              }
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
      <DeleteWorkspaceDialog
        selected={selected}
        deleteOpen={deleteOpen}
        setDeleteOpen={setDeleteOpen}
        handleDelete={handleDelete}
        isDeleting={isDeleting}
      />
      <WorkspaceDialog
        workspace={selected ?? undefined}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </DragDropContext>
  );
};
