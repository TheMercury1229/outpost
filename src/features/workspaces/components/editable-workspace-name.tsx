"use client";
import { updateWorkspace } from "@/actions/workspaces-actions";
import { useFetch } from "@/hooks/use-fetch";
import { useState } from "react";

export const EditableWorkspaceName = ({
  workspaceId,
  initialName,
}: {
  workspaceId: string;
  initialName: string;
}) => {
  console.log(
    "EditableWorkspaceName rendered with id:",
    workspaceId,
    "and initialName:",
    initialName,
  );
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const { fn: updateWorkspaceFn, loading } = useFetch(updateWorkspace);
  const commit = async () => {
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      setName(initialName);
      return;
    }
    await updateWorkspaceFn(workspaceId, trimmed);
  };
  if (editing) {
    return (
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setName(initialName);
            setEditing(false);
          }
        }}
        autoFocus
        className="rounded-md border border-input bg-transparent px-1.5 py-0.5 text-sm font-medium outline-none focus:border-ring"
      />
    );
  }
  return (
    <button
      disabled={!!loading}
      onClick={() => setEditing(true)}
      className="rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors hover:bg-accent"
    >
      {name}
    </button>
  );
};
