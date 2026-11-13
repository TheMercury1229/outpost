"use client";
import { useAuth } from "@clerk/nextjs";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import {
  SubscriptionDetailsButton,
  useSubscription,
} from "@clerk/nextjs/experimental";
import { getActivePromptUsage } from "@/actions/usage";
import { useEffect, useState } from "react";
import { cn } from "cn";

type Usage = Awaited<ReturnType<typeof getActivePromptUsage>>;
const USAGE_CHANGED_EVENT = "outpost:prompt-usuage-changed";
export function refreshPromptUsage() {
  window.dispatchEvent(new Event(USAGE_CHANGED_EVENT));
}
export const PlanButton = ({
  upgradeOnlyWhenOut = false,
}: {
  upgradeOnlyWhenOut?: boolean;
}) => {
  const { orgId, has } = useAuth();
  const payerType = orgId ? "organization" : "user";
  const { data: subscription } = useSubscription({ for: payerType });

  const openUpgrade = useUpgradeDialog();
  const [usage, setUsage] = useState<Usage>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getActivePromptUsage().then((next) => !cancelled && setUsage(next));
    load();
    window.addEventListener(USAGE_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(USAGE_CHANGED_EVENT, load);
    };
  }, [orgId]);
  if (!usage) return null;
  const { used, limit, isPaid } = usage;
  const isOut = used >= limit;
  const planName =
    subscription?.subscriptionItems.find(
      (item) => item.status === "active" && !item.plan.isDefault,
    )?.plan.name ?? "Free";

  const canManage =
    isPaid && (!orgId || has?.({ permission: "org:sys_billing:manage" }));

  const upgrade = () =>
    openUpgrade({
      title: isOut ? "You're out of agent prompts" : "Get more agent prompts",
      description: `You've have used ${used} of your ${limit} agent prompts this month. Upgrade to a paid plan to get more prompts.`,
    });

  const usageButton = (
    <button
      type="button"
      title={`${used.toLocaleString()} of ${limit.toLocaleString()} agent prompts used this month`}
      onClick={isPaid ? undefined : upgrade}
      className="flex h-full items-center gap-2.5 px-3 transition-colors hover:bg-white/5"
    >
      <span className="font-medium text-foreground">{planName}</span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
        <span
          className={cn(
            "block h-full rounded-full",
            isOut ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
        />
        <span className="text-muted-foreground tabular-nums">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </span>
    </button>
  );
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-full border border-white/10 bg-white/3 text-xs">
      {canManage ? (
        <SubscriptionDetailsButton for={payerType}>
          {usageButton}
        </SubscriptionDetailsButton>
      ) : (
        usageButton
      )}

      {!isPaid && (!upgradeOnlyWhenOut || !isOut) && (
        <button
          type="button"
          onClick={() => openUpgrade()}
          className="h-full border border-white/10 px-3 font-medium text-primary transition-colors hover:bg-primary/50"
        >
          Upgrade
        </button>
      )}
    </div>
  );
};
