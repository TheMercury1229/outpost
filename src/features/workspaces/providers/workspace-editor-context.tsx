"use client";
import { createContext, ReactNode, useContext, useState } from "react";
import type { Editor } from "tldraw";
import type { BlockNoteEditor } from "@blocknote/core";
const WorkspaceEditorContext = createContext<{
  canvasEditor: Editor | null;
  setCanvasEditor: (editor: Editor | null) => void;
  docEditor: BlockNoteEditor | null;
  setDocEditor: (editor: BlockNoteEditor | null) => void;
} | null>(null);

export const WorkspaceEditorsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [canvasEditor, setCanvasEditor] = useState<Editor | null>(null);
  const [docEditor, setDocEditor] = useState<BlockNoteEditor | null>(null);
  return (
    <WorkspaceEditorContext.Provider
      value={{ canvasEditor, setCanvasEditor, docEditor, setDocEditor }}
    >
      {children}
    </WorkspaceEditorContext.Provider>
  );
};

export function useWorkspaceEditors() {
  const ctx = useContext(WorkspaceEditorContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceEditors must be used within a WorkspaceEditorsProvider",
    );
  }
  return ctx;
}
