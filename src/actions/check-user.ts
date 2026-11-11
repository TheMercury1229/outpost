"use server";

import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function checkUser() {
  const clearkUser = await currentUser();
  if (!clearkUser) return null;
  const existing = await prisma.user.findUnique({
    where: {
      clerkId: clearkUser.id,
    },
  });
  if (!existing) {
    return await prisma.user.create({
      data: {
        clerkId: clearkUser.id,
        email: clearkUser.emailAddresses[0]?.emailAddress ?? "",
        name:
          `${clearkUser.firstName ?? ""} ${clearkUser.lastName ?? ""}`.trim() ||
          null,
        imageUrl: clearkUser.imageUrl ?? null,
      },
    });
  }
  return existing;
}
