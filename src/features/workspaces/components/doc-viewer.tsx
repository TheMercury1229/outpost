"use client";

import type { Block } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { outpostDarkTheme } from "@/data/blacknote-theme";

interface DocViewerProps {
  initialContent: Block[] | null;
}

export function DocViewer({ initialContent }: DocViewerProps) {
  const editor = useCreateBlockNote({
    initialContent:
      initialContent && initialContent.length > 0 ? initialContent : undefined,
  });

  return (
    <div className="h-full overflow-y-auto pt-6">
      <BlockNoteView
        editor={editor}
        editable={false}
        theme={outpostDarkTheme}
      />
    </div>
  );
}

