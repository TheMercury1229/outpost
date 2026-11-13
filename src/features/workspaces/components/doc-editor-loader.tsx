"use client";

import dynamic from "next/dynamic";

export const DocEditor = dynamic(
  () =>
    import("@/features/workspaces/components/doc-editor").then(
      (m) => m.DocEditor,
    ),
  {
    ssr: false,
  },
);

export const DocViewer = dynamic(
  () =>
    import("@/features/workspaces/components/doc-viewer").then(
      (m) => m.DocViewer,
    ),
  {
    ssr: false,
  },
);
