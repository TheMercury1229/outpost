"use client";

import { BlockNoteEditor } from "@blocknote/core";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Editor } from "tldraw";
import {
  executeCanvasTool,
  ShapeIdMap,
  summarizeCanvas,
} from "@/lib/agent-canvas";
import {
  agentToolDefs,
  docToolDefs,
  fail,
  ToolResult,
} from "@/lib/agent-tools";
import { executeDocTool, summarizeDoc } from "@/lib/agent-doc";
import { refreshPromptUsage } from "@/components/shared/plan-button";
import { PROMPT_LIMIT_ERROR, UPGRADE_REASONS } from "@/data/plan-limits";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";

type Editors = {
  canvasEditor: Editor | null;
  docEditor: BlockNoteEditor | null;
};
function runTool(
  { canvasEditor, docEditor }: Editors,
  idMap: ShapeIdMap,
  toolName: string,
  input: unknown,
): ToolResult {
  try {
    if (toolName in docToolDefs) {
      return docEditor
        ? executeDocTool(docEditor, toolName, input)
        : fail(
            "The doc isn't open in this view . Tell the user to switch to the Both or Doc view",
          );
    }
    return canvasEditor
      ? executeCanvasTool(canvasEditor, idMap, toolName, input)
      : fail(
          "The canvas isn't open in this view . Tell the user to switch to the Both or Canvas view",
        );
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Tool Failed");
  }
}
export function useWorkspaceAgentChat(workspaceId: string, editors: Editors) {
  const idMap = useRef<ShapeIdMap>(new Map());
  const editorsRef = useRef(editors);
  const openUpgrade = useUpgradeDialog();
  useEffect(() => {
    editorsRef.current = editors;
  });
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        body: () => {
          const { canvasEditor, docEditor } = editorsRef.current;
          return {
            workspaceId,
            canvasContext: canvasEditor ? summarizeCanvas(canvasEditor) : null,
            docContext: docEditor ? summarizeDoc(docEditor) : null,
          };
        },
      }),
  );

  const chat = useChat({
    transport,
    onFinish: refreshPromptUsage,
    onError: (error) => {
      if (!error.message.includes(PROMPT_LIMIT_ERROR)) return;
      refreshPromptUsage();
      openUpgrade(UPGRADE_REASONS.prompts);
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      const output = runTool(
        editorsRef.current,
        idMap.current,
        toolCall.toolName,
        toolCall.input,
      );

      chat.addToolOutput({
        tool: toolCall.toolName as keyof typeof agentToolDefs,
        toolCallId: toolCall.toolCallId,
        output,
      });
    },
  });
  return chat;
}

export type WorkspaceAgentChat = ReturnType<typeof useWorkspaceAgentChat>;
