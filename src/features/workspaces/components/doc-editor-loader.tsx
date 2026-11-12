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
