import { getWorkspace } from "@/actions/workspaces-actions";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CanvasEditor } from "@/features/workspaces/components/canvas-editor";
import { DocEditor } from "@/features/workspaces/components/doc-editor-loader";
import { EditableWorkspaceName } from "@/features/workspaces/components/editable-workspace-name";
import { WorkspaceEditorsProvider } from "@/features/workspaces/providers/workspace-editor-context";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { Block } from "@blocknote/core";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TLEditorSnapshot } from "tldraw";

type ViewMode = "doc" | "canvas" | "both";

function parseViewMode(value: string | string[] | undefined): ViewMode {
  return (value === "doc" || value === "canvas" ? value : "both") as ViewMode;
}
export default async function WorkspacePage({
  params,
  searchParams,
}: PageProps<"/workspaces/[id]">) {
  const { id } = await params;
  const { view: viewParam } = await searchParams;
  const view = parseViewMode(viewParam);

  if (!(await canAccessWorkspace(id))) notFound();
  const workspace = await getWorkspace(id);

  const showDoc = view === "doc" || view === "both";
  const showCanvas = view === "canvas" || view === "both";
  const modes = ["doc", "canvas", "both"] as const;
  return (
    <WorkspaceEditorsProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-white/6 bg-background px-4">
          <div className="div flex flex-1 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-80"
            >
              <Image
                src="/brand/mascot-dark.png"
                alt="Back to dashboard"
                width={24}
                height={24}
                className="size-6"
              />
            </Link>
            <EditableWorkspaceName
              workspaceId={id}
              initialName={workspace.name}
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
            {modes.map((mode) => (
              <Button
                key={mode}
                variant={view === mode ? "secondary" : "ghost"}
                size="sm"
                className="capitalize"
                asChild
              >
                <Link
                  href={
                    mode === "both"
                      ? `/workspaces/${id}`
                      : `/workspaces/${id}?view=${mode}`
                  }
                >
                  {mode === "doc"
                    ? "Document"
                    : mode === "canvas"
                      ? "Canvas"
                      : "Both"}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {/* TODO:ShareDialog, AgentToggleButton */}
          </div>
        </header>
        <ResizablePanelGroup
          key={view}
          orientation="horizontal"
          className="flex-1"
        >
          {showDoc && (
            <ResizablePanel defaultSize={25} minSize={20}>
              <DocEditor
                key={id}
                initialState={
                  workspace.doc?.yjsState
                    ? Buffer.from(workspace.doc.yjsState).toString("base64")
                    : null
                }
                workspaceId={id}
                initialContent={workspace.doc?.content as Block[] | null}
              />
            </ResizablePanel>
          )}
          {showDoc && showCanvas && <ResizableHandle withHandle />}
          {showCanvas && (
            <ResizablePanel defaultSize={75} minSize={20}>
              <CanvasEditor
                workspaceId={id}
                initialSnapshot={
                  workspace.canvas?.content as TLEditorSnapshot | null
                }
              />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </WorkspaceEditorsProvider>
  );
}
