"use server";
import { getPromptUsage } from "@/lib/billing";
import { auth } from "@clerk/nextjs/server";

export async function getActivePromptUsage() {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return getPromptUsage(orgId ?? userId);
}
