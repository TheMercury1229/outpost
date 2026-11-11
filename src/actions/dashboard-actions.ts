"use server";

import { prisma } from "@/lib/db";
import { withLastActivity, workspaceCardSelect } from "@/lib/workspace-status";
import { checkUser } from "./check-user";
import { FREE_WORKSPACE_LIMIT, LimitError } from "@/data/plan-limits";
import { auth } from "@clerk/nextjs/server";
import { scopeWhere } from "@/lib/workspace-scope";
import { getEntitlements } from "@/lib/billing";
import { revalidatePath } from "next/cache";

function revalidateWorkspaceLists() {
  revalidatePath("/dashboard");
  revalidatePath("/workspaces");
}
const RECENT_COUNT = 4;
export async function getWorkspaces(where: any) {
  const data = await prisma.workspace.findMany({
    where,
    select: workspaceCardSelect,
  });
  const recent = data
    .map(withLastActivity)
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, RECENT_COUNT);
  return { recent, all: data };
}

export async function createWorkspace(
  name: string,
  description?: string,
): Promise<{ workspace: { id: string } } | { limit: LimitError }> {
  const user = await checkUser();
  if (!user) throw new Error("User not authenticated");
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Workspace name cannot be empty");

  const { orgId } = await auth();
  const scope = scopeWhere(orgId, user.id);

  const { unlimitedWorkspaces } = await getEntitlements(orgId ?? user.clerkId);
  if (
    !unlimitedWorkspaces &&
    (await prisma.workspace.count({ where: scope })) >= FREE_WORKSPACE_LIMIT
  ) {
    return { limit: "workspaces" };
  }

  const top = await prisma.workspace.findFirst({
    where: { status: "PLANNING", ...scope },
    orderBy: { position: "asc" },
    select: { position: true },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: trimmedName,
      description: description?.trim() || null,
      creatorId: user.id,
      clerkOrgId: orgId ?? null,
      position: top ? top.position - 1 : 0,
      doc: { create: {} },
      canvas: { create: {} },
    },
  });

  revalidateWorkspaceLists();
  return { workspace: { id: workspace.id } };
}
