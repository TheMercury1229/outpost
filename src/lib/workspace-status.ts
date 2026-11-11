import { WorkspaceStatus } from "@/generated/prisma/enums";

export const WORKSPACE_STATUSES: { status: WorkspaceStatus; title: string }[] =
  [
    { status: "PLANNING", title: "Planning" },
    { status: "IN_PROGRESS", title: "In progress" },
    { status: "IN_REVIEW", title: "In review" },
    { status: "DONE", title: "Done" },
  ];
export const workspaceCardSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  updatedAt: true,
  creator: { select: { name: true, imageUrl: true } },
  doc: { select: { updatedAt: true } },
  canvas: { select: { updatedAt: true } },
} as const;

type Dated = { updatedAt: Date } | null;

export function withLastActivity<
  T extends { updatedAt: Date; doc: Dated; canvas: Dated },
>(workspace: T) {
  const times = [
    workspace.updatedAt,
    workspace.doc?.updatedAt,
    workspace.canvas?.updatedAt,
  ];
  return {
    ...workspace,
    lastActivity: new Date(Math.max(...times.map((t) => t?.getTime() ?? 0))),
  };
}

export function statusTitle(status: WorkspaceStatus) {
  return WORKSPACE_STATUSES.find((s) => s.status === status)?.title ?? status;
}
