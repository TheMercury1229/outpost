import { type Prisma } from "@/generated/prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

export function scopeWhere(
  orgId: string | null | undefined,
  userId: string,
): Prisma.WorkspaceWhereInput {
  return orgId
    ? { clerkOrgId: orgId }
    : { creatorId: userId, clerkOrgId: null };
}

export async function getWorkspaceScope(userId: string) {
  const { orgId } = await auth();
  const orgName = orgId
    ? (
        await (
          await clerkClient()
        ).organizations.getOrganization({ organizationId: orgId })
      ).name
    : "Personal";

  return { orgName, where: scopeWhere(orgId, userId) };
}
