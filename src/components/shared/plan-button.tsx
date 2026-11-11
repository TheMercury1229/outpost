import { useAuth } from "@clerk/nextjs";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import {
  SubscriptionDetailsButton,
  useSubscription,
} from "@clerk/nextjs/experimental";

export const PlanButton = () => {
  const { orgId, has } = useAuth();
  const payerType = orgId ? "organization" : "user";
  const { data: subscription } = useSubscription({ for: payerType });

  const openUpgrade = useUpgradeDialog();
  const paidPlan = subscription?.subscriptionItems.find(
    (item) => item.status === "active" && !item.plan.isDefault,
  )?.plan;
  const isPaid = Boolean(paidPlan);
  const canManage =
    isPaid && (!orgId || has?.({ permission: "org:sys_billing:manage" }));

  const planButton = (
    <button
      type="button"
      onClick={isPaid ? undefined : () => openUpgrade()}
      className="flex h-full items-center px-3 font-medium text-foreground transition-colors hover:bg-white/5"
    >
      {paidPlan?.name ?? "Free"}
    </button>
  );
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-full border border-white/10 bg-white/3 text-xs">
      {canManage ? (
        <SubscriptionDetailsButton for={payerType}>
          {planButton}
        </SubscriptionDetailsButton>
      ) : (
        planButton
      )}

      {!isPaid && (
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
