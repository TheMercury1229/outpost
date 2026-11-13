import type { Block } from "@blocknote/core";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TLEditorSnapshot } from "tldraw";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CanvasViewer } from "@/features/workspaces/components/canvas-viewer-loader";
import { DocViewer } from "@/features/workspaces/components/doc-editor-loader";
import { getEntitlements, workspaceOwnerId } from "@/lib/billing";
import { prisma } from "@/lib/db";

interface SharedPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharedPageProps): Promise<Metadata> {
  const { token } = await params;
  const workspace = await prisma.workspace.findUnique({
    where: { shareToken: token },
    select: { name: true },
  });

  return {
    title: workspace
      ? `${workspace.name} (View only) - Outpost`
      : "Shared Workspace",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharedWorkspacePage({ params }: SharedPageProps) {
  const { token } = await params;
  if (!token) notFound();

  const workspace = await prisma.workspace.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      name: true,
      clerkOrgId: true,
      creator: { select: { clerkId: true } },
      doc: { select: { content: true } },
      canvas: { select: { content: true } },
    },
  });

  if (!workspace) {
    notFound();
  }

  const ownerId = workspaceOwnerId(workspace);
  const entitlements = await getEntitlements(ownerId);

  if (!entitlements.publicSharing) {
    notFound();
  }

  const docContent = (workspace.doc?.content as Block[] | null) ?? null;
  const canvasSnapshot =
    (workspace.canvas?.content as TLEditorSnapshot | null) ?? null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center border-b border-white/6 bg-background px-4">
        <div className="flex flex-1 items-center gap-3">
          <Link
            href="/"
            className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-80"
          >
            <Image
              src="/brand/mascot-dark.png"
              alt="Outpost"
              width={24}
              height={24}
              className="size-6"
            />
          </Link>
          <span className="max-w-[200px] truncate text-sm font-semibold sm:max-w-md">
            {workspace.name}
          </span>
          <Badge variant="secondary" className="gap-1 text-xs">
            View only
          </Badge>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20}>
          <DocViewer initialContent={docContent} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75} minSize={20}>
          <CanvasViewer initialSnapshot={canvasSnapshot} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
