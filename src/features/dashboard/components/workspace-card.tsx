import React from "react";
import { cn } from "@/lib/utils";
import { WorkspaceCardData } from "../types";
import Link from "next/link";
import { LayoutGridIcon } from "lucide-react";
import { statusTitle } from "@/lib/workspace-status";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export const WorkspaceCard = ({
  workspace,
  showStatus = false,
  highlighted = false,
  actions,
}: {
  workspace: WorkspaceCardData;
  showStatus?: boolean;
  highlighted?: boolean;
  actions?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group relative flex h-36 flex-col gap-1 rounded-md bg-muted p-3.5 shadow-sm shadow-black/40 ring-1 transition colors hover:bg-secondary",
        highlighted ? "shadow-lg ring-primary/60" : "ring-white/6",
      )}
    >
      <Link
        href={`/workspace/${workspace.id}`}
        draggable={false}
        className="line-clamp-2 pr-7 text-sm leading-snug font-medium after:absolute after:inset-0"
      >
        {workspace.name}
      </Link>
      {workspace.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {workspace.description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span
          className="flex min-w-0 items-center gap-1.5"
          suppressHydrationWarning
        >
          <LayoutGridIcon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate" suppressHydrationWarning>
            {showStatus && `${statusTitle(workspace.status)} • `}
            {formatDistanceToNow(workspace.lastActivity, { addSuffix: true })}
          </span>
        </span>

        <CreatorAvatar creator={workspace.creator} />
      </div>
      {actions}
    </div>
  );
};

function CreatorAvatar({ creator }: { creator: WorkspaceCardData["creator"] }) {
  const name = creator?.name ?? "Unknown";
  return (
    <Avatar title={name} className="size-5 shrink-0">
      {creator?.imageUrl && (
        <AvatarImage
          src={creator.imageUrl}
          alt={name}
          className="size-5 shrink-0 rounded-full"
        />
      )}
      <AvatarFallback className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-foreground">
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
