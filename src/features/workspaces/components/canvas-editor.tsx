"use client";

import { useUser } from "@clerk/nextjs";
import { useSyncDemo } from "@tldraw/sync";
import { useMemo, useRef } from "react";
import {
  atom,
  computed,
  createTLCurrentUser,
  createUserId,
  DefaultToolbar,
  DefaultToolbarContent,
  type Editor,
  getUserPreferences,
  type TLArrowBinding,
  type TLComponents,
  type TLEditorSnapshot,
  Tldraw,
  UserRecordType,
} from "tldraw";
import { saveCanvasContent } from "@/actions/workspaces-actions";
import type { Prisma } from "@/generated/prisma/client";
import { colorForUser } from "@/lib/utils";
import { useWorkspaceEditors } from "../providers/workspace-editor-context";
import "tldraw/tldraw.css";
import {
  AddEntityTableButton,
  EntityTableShapeUtil,
  snapArrowBindingToRow,
} from "./entity-table";

const SAVE_DEBOUNCE_MS = 5000;

const customShapeUtils = [EntityTableShapeUtil];

const components: TLComponents = {
  StylePanel: null,
  PageMenu: null,
  MainMenu: null,
  Toolbar: () => (
    <DefaultToolbar orientation="vertical">
      <AddEntityTableButton />
      <DefaultToolbarContent />
    </DefaultToolbar>
  ),
};

export const CanvasEditor = ({
  workspaceId,
  initialSnapshot,
}: {
  workspaceId: string;
  initialSnapshot: TLEditorSnapshot | null;
}) => {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setCanvasEditor } = useWorkspaceEditors();
  const { user } = useUser();

  const userId = user?.id;
  const userName = user?.fullName ?? user?.username ?? "Anonymous";
  const userImageUrl = user?.imageUrl ?? "";

  const users = useMemo(() => {
    if (!userId) return undefined;
    return {
      currentUser: atom(
        "currentUser",
        UserRecordType.create({
          id: createUserId(userId),
          name: userName,
          color: colorForUser(userId),
          imageUrl: userImageUrl,
        }),
      ),
    };
  }, [userId, userName, userImageUrl]);

  const currentUser = useMemo(() => {
    if (!userId) return undefined;
    return createTLCurrentUser({
      userPreferences: computed("clerkUserPreferences", () => ({
        ...getUserPreferences(),
        id: userId,
        name: userName,
        color: colorForUser(userId),
        colorScheme: "dark",
      })),
    });
  }, [userId, userName]);

  const store = useSyncDemo({
    roomId: `outpost-${workspaceId}`,
    users,
    shapeUtils: customShapeUtils,
  });

  const handleMount = (editor: Editor) => {
    editor.user.updateUserPreferences({ colorScheme: "dark" });
    setCanvasEditor(editor);
    if (initialSnapshot && editor.getCurrentPageShapeIds().size === 0) {
      editor.loadSnapshot(initialSnapshot);
    }

    const unsubCreateBinding = editor.sideEffects.registerAfterCreateHandler(
      "binding",
      (binding, source) => {
        if (source === "user" && binding.type === "arrow") {
          snapArrowBindingToRow(editor, binding as TLArrowBinding);
        }
      },
    );

    const unsubChangeBinding = editor.sideEffects.registerAfterChangeHandler(
      "binding",
      (_prev, binding, source) => {
        if (source === "user" && binding.type === "arrow") {
          snapArrowBindingToRow(editor, binding as TLArrowBinding);
        }
      },
    );

    const unsubStore = editor.store.listen(
      () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
          const plainSnapshot = JSON.parse(
            JSON.stringify(editor.getSnapshot()),
          ) as Prisma.InputJsonValue;
          saveCanvasContent(workspaceId, plainSnapshot);
        }, SAVE_DEBOUNCE_MS);
      },
      { source: "user", scope: "document" },
    );

    return () => {
      unsubCreateBinding();
      unsubChangeBinding();
      unsubStore();
      setCanvasEditor(null);
    };
  };

  return (
    <div className="isolate h-full [&_.tlui-main-toolbar--vertical]:top-4!">
      <Tldraw
        store={store}
        user={currentUser}
        onMount={handleMount}
        components={components}
        colorScheme="dark"
        shapeUtils={customShapeUtils}
      />
    </div>
  );
};
