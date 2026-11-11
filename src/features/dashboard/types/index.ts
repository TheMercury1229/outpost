import { WorkspaceStatus } from "@/generated/prisma/enums";

export type WorkspaceCardData = {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  lastActivity: Date;
  creator: {
    name: string | null;
    imageUrl: string | null;
  };
};
