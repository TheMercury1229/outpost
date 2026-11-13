"use client";

import { PricingTable, useAuth } from "@clerk/nextjs";
import { createContext, ReactNode, useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type UpgradeReason = {
  title: string;
  description?: string;
};

const DEFAULT_UPGRADE_REASON: UpgradeReason = {
  title: "Upgrade your plan",
  description:
    "Get more agent prompts, unlimited workspaces, share links and PDF export.",
};

const UpgradeDialogContext = createContext<(reason?: UpgradeReason) => void>(
  () => {},
);
export const UpgradeDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [reason, setReason] = useState<UpgradeReason | null>(null);
  const { orgId } = useAuth();
  const close = () => setReason(null);

  return (
    <UpgradeDialogContext.Provider
      value={(next) => setReason(next ?? DEFAULT_UPGRADE_REASON)}
    >
      {children}
      <Dialog open={reason !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl">{reason?.title}</DialogTitle>
            {reason?.description && (
              <DialogDescription>{reason.description}</DialogDescription>
            )}
          </DialogHeader>
          <PricingTable for={orgId ? "organization" : "user"} />
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
};

export function useUpgradeDialog() {
  return useContext(UpgradeDialogContext);
}
