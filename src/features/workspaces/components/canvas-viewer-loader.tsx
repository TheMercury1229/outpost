"use client";

import dynamic from "next/dynamic";

export const CanvasViewer = dynamic(
  () =>
    import("@/features/workspaces/components/canvas-viewer").then(
      (m) => m.CanvasViewer,
    ),
  {
    ssr: false,
  },
);

