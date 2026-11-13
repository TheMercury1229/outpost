import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { FREE_MONTHLY_PROMPTS } from "@/data/plan-limits";

const PROMPT_FEATURES = [
  { feature: "agent_prompts_2000", perMember: 2000 },
  { feature: "agent_prompts_500", perMember: 500 },
];

export const workspaceOwnerSelect = {
  clerkOrgId: true,
  creator: { select: { clerkId: true } },
} as const;

export function workspaceOwnerId(workspace: {
  clerkOrgId: string | null;
  creator: { clerkId: string };
}) {
  return workspace.clerkOrgId ?? workspace.creator.clerkId;
}

export async function getWorkspaceOwnerId(workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: workspaceOwnerSelect,
  });
  return workspaceOwnerId(workspace);
}

export async function getEntitlements(ownerId: string) {
  const clerk = await clerkClient();
  const isOrg = ownerId.startsWith("org_");
  const features = new Set<string>();
  try {
    const subscription = isOrg
      ? await clerk.billing.getOrganizationBillingSubscription(ownerId)
      : await clerk.billing.getUserBillingSubscription(ownerId);
    for (const item of subscription.subscriptionItems) {
      if (item.status === "active" || item.status === "past_due") {
        item.plan?.features.forEach((feature) => features.add(feature.slug));
      }
    }
  } catch {
    // No subscription (or Clerk unreachable): treat as the free plan.
  }

  const paid = PROMPT_FEATURES.find(({ feature }) => features.has(feature));
  let promptLimit = FREE_MONTHLY_PROMPTS;
  if (paid) {
    const members = isOrg
      ? ((
          await clerk.organizations.getOrganization({
            organizationId: ownerId,
            includeMembersCount: true,
          })
        ).membersCount ?? 1)
      : 1;
    promptLimit = paid.perMember * members;
  }

  return {
    isPaid: !!paid,
    promptLimit,
    unlimitedWorkspaces: features.has("unlimited_workspaces"),
    publicSharing: features.has("public_sharing"),
    pdfExport: features.has("pdf_export"),
  };
}

function startOfMonthUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getPromptUsage(ownerId: string) {
  const [{ promptLimit, isPaid }, used] = await Promise.all([
    getEntitlements(ownerId),
    prisma.agentPrompt.count({
      where: { ownerId, createdAt: { gte: startOfMonthUtc() } },
    }),
  ]);

  return { used, limit: promptLimit, isPaid };
}

export async function recordPrompt(
  ownerId: string,
  userId: string,
  workspaceId: string,
) {
  await prisma.agentPrompt.create({ data: { ownerId, userId, workspaceId } });
}
