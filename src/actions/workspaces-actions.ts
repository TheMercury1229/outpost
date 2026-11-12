"use server";

import { WorkspaceStatus } from "@/generated/prisma/enums";
import { workspaceOwnerSelect } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { canAccessWorkspace } from "@/lib/workspace-access";
import { workspaceCardSelect } from "@/lib/workspace-status";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import * as Y from "yjs";
function revalidateWorkspaceLists() {
  revalidatePath("/dashboard");
  revalidatePath("/workspaces");
}

export async function getWorkspaces(where: any) {
  const data = await prisma.workspace.findMany({
    where,
    select: { ...workspaceCardSelect, position: true },
    orderBy: { position: "asc" },
  });
  return { all: data };
}

export async function deleteWorkspace(workspaceId: string) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !(await canAccessWorkspace(workspaceId)))
    throw new Error("Workspace not found");

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: workspaceOwnerSelect,
  });
  const isCreator = workspace.creator.clerkId === userId;
  const isOrgAdmin = orgRole === "org:admin" && workspace.clerkOrgId === orgId;

  if (!isCreator && !isOrgAdmin)
    throw new Error("You do not have permission to delete this workspace");

  await prisma.workspace.delete({ where: { id: workspaceId } });

  revalidateWorkspaceLists();
}

export async function updateWorkspace(
  workspaceId: string,
  name: string,
  description?: string,
): Promise<{ success: true }> {
  if (
    typeof workspaceId !== "string" ||
    typeof name !== "string" ||
    (description !== undefined && typeof description !== "string")
  ) {
    throw new Error("Invalid workspace details");
  }

  if (!(await canAccessWorkspace(workspaceId))) {
    throw new Error("Workspace not found");
  }

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Workspace name cannot be empty");

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: trimmedName,
      description: description?.trim() || null,
    },
  });

  revalidateWorkspaceLists();
  revalidatePath(`/workspaces/${workspaceId}`);
  return { success: true };
}

export async function moveWorkspace(
  workspaceId: string,
  status: WorkspaceStatus,
  position: number,
) {
  if (
    !Object.values(WorkspaceStatus).includes(status) ||
    !Number.isFinite(position) ||
    position < 0
  )
    throw new Error("Invalid status or position");

  if (!(await canAccessWorkspace(workspaceId))) {
    throw new Error("Workspace not found");
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { status, position },
  });
}

export async function getWorkspace(workspaceId: string) {
  if (!(await canAccessWorkspace(workspaceId))) {
    return notFound();
  }
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      name: true,
      canvas: { select: { content: true } },
      doc: { select: { content: true, yjsState: true } },
    },
  });
  if (!workspace) {
    return notFound();
  }
  return workspace;
}

export async function saveCanvasContent(
  workspaceId: string,
  content: Prisma.InputJsonValue,
) {
  if (!(await canAccessWorkspace(workspaceId))) {
    throw new Error("Workspace not found");
  }

  await prisma.canvas.update({
    where: { workspaceId },
    data: { content },
  });
}

export async function saveDocContent(
  workspaceId: string,
  yjsState: string,
  content: Prisma.InputJsonValue,
) {
  if (!(await canAccessWorkspace(workspaceId))) {
    throw new Error("Workspace not found");
  }
  const incoming = Buffer.from(yjsState, "base64");
  await prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<
      { yjsState: Uint8Array | null }[]
    >`SELECT "yjsState" FROM "Doc" WHERE "workspaceId" = ${workspaceId} FOR UPDATE`;
    const merged = row?.yjsState
      ? Y.mergeUpdates([row.yjsState, incoming])
      : incoming;
    await tx.doc.update({
      where: { workspaceId },
      data: { yjsState: Uint8Array.from(merged), content },
    });
  });
}
