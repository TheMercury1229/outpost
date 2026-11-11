"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isFullScreenRoute =
    pathname?.startsWith("/workspaces/") || pathname?.startsWith("/shared/");

  if (isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col pt-18">{children}</main>
    </>
  );
};
