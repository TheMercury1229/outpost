"use client";
import type { Block } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { useWorkspaceEditors } from "@/features/workspaces/providers/workspace-editor-context";
import { useEffect } from "react";
import { outpostDarkTheme } from "@/data/blacknote-theme";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Prisma } from "@/generated/prisma/client";
import { saveDocContent } from "@/actions/workspaces-actions";
import * as Y from "yjs";
import { SupabaseYjsProvider } from "@/features/workspaces/providers/supabase-yjs-provider";
import { useUser } from "@clerk/nextjs";
import { useCollabrativeDoc } from "@/hooks/use-collabrative-doc";
import { colorForUser, toBase64 } from "@/lib/utils";
import { CollaborationExtension } from "@blocknote/core/yjs";

type DocEditorProps = {
  workspaceId: string;
  initialContent: Block[] | null;
  initialState: string | null;
};

const SAVE_DEBOUNCE_MS = 5000;
export function DocEditor({
  workspaceId,
  initialContent,
  initialState,
}: DocEditorProps) {
  const { user } = useUser();
  const collab = useCollabrativeDoc(workspaceId, initialState);
  if (!collab || !user) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Loading Document...
      </div>
    );
  }

  return (
    <CollaborativeEditor
      workspaceId={workspaceId}
      initialContent={initialContent}
      doc={collab.doc}
      provider={collab.provider}
      user={{
        name: user.fullName ?? user.username ?? "Anoymous",
        color: colorForUser(user.id),
      }}
    />
  );
}
export const CollaborativeEditor = ({
  workspaceId,
  initialContent,
  doc,
  provider,
  user,
}: Omit<DocEditorProps, "initialState"> & {
  doc: Y.Doc;
  provider: SupabaseYjsProvider;
  user: { name: string; color: string };
}) => {
  const fragment = doc.getXmlFragment("document-store");
  const editor = useCreateBlockNote({
    extensions: [CollaborationExtension({ fragment, user, provider })],
  });
  const { setDocEditor } = useWorkspaceEditors();

  useEffect(() => {
    setDocEditor(editor);
    return () => setDocEditor(null);
  }, [editor, setDocEditor]);
  useEffect(() => {
    if (fragment.length === 0 && initialContent?.length) {
      editor.replaceBlocks(editor.document, initialContent);
    }
  }, [editor, fragment, initialContent]);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
    const save = () => {
      timeout = undefined;
      const content = JSON.parse(
        JSON.stringify(editor.document),
      ) as Prisma.InputJsonValue;
      saveDocContent(
        workspaceId,
        toBase64(Y.encodeStateAsUpdate(doc)),
        content,
      );
    };

    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === provider) return;
      clearTimeout(timeout);
      timeout = setTimeout(save, SAVE_DEBOUNCE_MS);
    };

    doc.on("update", handleUpdate);
    return () => {
      doc.off("update", handleUpdate);
      if (timeout) {
        clearTimeout(timeout);
        save();
      }
    };
  }, [editor, doc, provider, workspaceId]);
  return (
    <div className="h-full overflow-y-auto pt-6">
      <BlockNoteView editor={editor} theme={outpostDarkTheme} />
    </div>
  );
};
