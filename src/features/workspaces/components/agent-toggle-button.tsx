"use client";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AgentChatPanel } from "./agent-chat-panel";
import { useWorkspaceEditors } from "../providers/workspace-editor-context";
import { useWorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";
import { usePathname, useRouter } from "next/navigation";

export const AgentToggleButton = ({
  workspaceId,
  initialPrompt,
}: {
  workspaceId: string;
  initialPrompt?: string;
}) => {
  const [isOpen, setIsOpen] = useState(!!initialPrompt);
  const { canvasEditor, docEditor } = useWorkspaceEditors();
  const chat = useWorkspaceAgentChat(workspaceId, { canvasEditor, docEditor });

  const router = useRouter();
  const pathname = usePathname();
  const promptSent = useRef(false);

  useEffect(() => {
    if (!initialPrompt || promptSent.current || !canvasEditor || !docEditor)
      return;

    promptSent.current = true;
    chat.sendMessage({ text: initialPrompt });
    router.replace(pathname, { scroll: false });
  }, [initialPrompt, canvasEditor, docEditor, chat, router, pathname]);

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? (
          <>
            <XIcon className="size-4" />
            Close
          </>
        ) : (
          <>
            <Image
              src="/brand/mascot.png"
              alt=""
              width={16}
              height={16}
              className="size-4"
            />
            Ask Agent
          </>
        )}
      </Button>
      {isOpen && (
        <AgentChatPanel
          chat={chat}
          isReady={!!canvasEditor || !!docEditor}
          initialPrompt={initialPrompt}
        />
      )}
    </>
  );
};
