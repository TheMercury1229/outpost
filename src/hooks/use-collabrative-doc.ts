"use client";

import { SupabaseYjsProvider } from "@/features/workspaces/providers/supabase-yjs-provider";
import { fromBase64 } from "@/lib/utils";
import { useEffect, useState } from "react";
import * as Y from "yjs";
export function useCollabrativeDoc(
  workspaceId: string,
  initialState: string | null,
) {
  const [collab, setCollab] = useState<{
    doc: Y.Doc;
    provider: SupabaseYjsProvider;
  } | null>(null);
  const [savedState] = useState(initialState);

  useEffect(() => {
    const doc = new Y.Doc();
    if (savedState) Y.applyUpdate(doc, fromBase64(savedState));
    const provider = new SupabaseYjsProvider(doc, workspaceId, () =>
      setCollab({ doc, provider }),
    );
    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [workspaceId, savedState]);
  return collab;
}
