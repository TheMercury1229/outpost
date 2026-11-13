"use client";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { PROMPT_LIMIT_ERROR, UPGRADE_REASONS } from "@/data/plan-limits";
import { WorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";
import { submitOnEnter } from "@/lib/utils";
import { isDynamicToolUIPart, isToolUIPart } from "ai";
import { cn } from "cn";
import { SendIcon, SquareIcon, Wand2Icon } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { BeatLoader } from "react-spinners";
const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 240;
const MAX_WIDTH = 640;

export const AgentChatPanel = ({
  chat,
  isReady,
  initialPrompt,
}: {
  chat: WorkspaceAgentChat;
  isReady: boolean;
  initialPrompt?: string;
}) => {
  const { messages, sendMessage, stop, status, error } = chat;
  const isBusy = status === "submitted" || status === "streaming";
  const [input, setInput] = useState(initialPrompt ?? "");
  function handleSend() {
    const trimmedInput = input.trim();
    if (!trimmedInput || !isReady || isBusy) return;
    sendMessage({ text: trimmedInput });
    setInput("");
  }
  const openUpgrade = useUpgradeDialog();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 bottom-0 z-30">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel />
        <ResizableHandle />
        <ResizablePanel
          className="pointer-events-auto flex flex-col border-l border-white/10 bg-card shadow-2xl"
          defaultSize={DEFAULT_WIDTH}
          minSize={MIN_WIDTH}
          maxSize={MAX_WIDTH}
        >
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/6 px-4 text-sm font-medium">
            <Image
              src="/brand/mascot-dark.png"
              alt=""
              width={18}
              height={18}
              className="size-4.5"
            />
            Outpost Agent
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask the agent to draw a diagram, write or edit the doc, or both.
                Say &ldquo;in the doc&rdquo; or &ldquo;on the canvas&rdquo; to
                keep it to one side.
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] space-y-1.5 rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-white/5 text-foreground",
                  )}
                >
                  {message.parts.map((part, idx) => {
                    if (part.type === "reasoning") {
                      const isStreaming = part.state === "streaming";
                      return (
                        <div key={idx}>
                          <div
                            className="mb-1 flex items-center gap-1.5"
                            key={idx}
                          >
                            <Wand2Icon
                              className={cn(
                                "size-3 shrink-0 text-blue-400/60",
                                isStreaming && "animate-pulse",
                              )}
                            />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-blue-400/50">
                              {part.text ? "Agent reasoning" : "Thinking..."}
                            </span>
                          </div>
                          {part.text && (
                            <p className="text-xs leading-relaxed text-white/35 ">
                              {part.text}
                              {isStreaming && (
                                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse align-middle bg-blue-400/60" />
                              )}
                            </p>
                          )}
                        </div>
                      );
                    }
                    if (part.type === "text") {
                      return <span key={idx}>{part.text}</span>;
                    }
                    if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
                      const toolName = isDynamicToolUIPart(part)
                        ? part.toolName
                        : part.type.replace(/^tool-/, "");

                      return (
                        <div
                          key={idx}
                          className="rounded-md bg-black/20 px-2 py-1 text-xs text-muted-foreground"
                        >
                          {part.state === "output-available" ? "✓" : "..."}{" "}
                          {toolName}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))
            )}
            {isBusy && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BeatLoader size={4} color={"currentColor"} />
                Thinking...
              </p>
            )}
            {error && (
              <p className="rounded-md border border-white/10 bg-white/3 px-1 py-2 text-xs text-muted-foreground">
                {error.message.includes(PROMPT_LIMIT_ERROR) ? (
                  <>
                    You&apos;re out of agent prompts this month.
                    <button
                      type="button"
                      onClick={() => openUpgrade(UPGRADE_REASONS.prompts)}
                      className="font-medium text-primary hover:underline"
                    >
                      Upgrade
                    </button>
                  </>
                ) : (
                  "Something went wrong. Please try again."
                )}
              </p>
            )}
          </div>
          <div className="flex shrink-0 z-30 items-end gap-2 border-t border-white/6 p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the agent..."
              rows={1}
              disabled={!isReady}
              onKeyDown={submitOnEnter(handleSend)}
              className="max-h-32 flex-1 resize-none border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-50"
            />
            {isBusy ? (
              <Button size="icon" variant="secondary" onClick={stop}>
                <SquareIcon className="size-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || !isReady}
              >
                <SendIcon className="size-4" />
              </Button>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
