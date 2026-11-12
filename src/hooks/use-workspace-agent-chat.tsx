"use client";

import { BlockNoteEditor } from "@blocknote/core";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Editor } from "tldraw";

type Editors = {
  canvasEditor: Editor | null;
  docEditor: BlockNoteEditor | null;
};

export function useWorkspaceAgentChat(workspaceId: string, editors: Editors) {
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        body: () => {
          return {
            workspaceId,
          };
        },
      }),
  );

  const chat = useChat({
    transport,
  });
  return chat;
}

export type WorkspaceAgentChat = ReturnType<typeof useWorkspaceAgentChat>;
