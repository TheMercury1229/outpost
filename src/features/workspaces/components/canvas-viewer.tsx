"use client";

import {
  type Editor,
  type TLComponents,
  type TLEditorSnapshot,
  Tldraw,
} from "tldraw";
import "tldraw/tldraw.css";
import { EntityTableShapeUtil } from "./entity-table";

const customShapeUtils = [EntityTableShapeUtil];

const viewerComponents: TLComponents = {
  StylePanel: null,
  PageMenu: null,
  MainMenu: null,
  Toolbar: null,
};

interface CanvasViewerProps {
  initialSnapshot: TLEditorSnapshot | null;
}

export function CanvasViewer({ initialSnapshot }: CanvasViewerProps) {
  const handleMount = (editor: Editor) => {
    editor.user.updateUserPreferences({ colorScheme: "dark" });
    if (initialSnapshot) {
      editor.loadSnapshot(initialSnapshot);
    }
    editor.updateInstanceState({ isReadonly: true });
    requestAnimationFrame(() => {
      editor.zoomToFit({ animation: { duration: 0 } });
    });
  };

  return (
    <div className="relative size-full overflow-hidden">
      <Tldraw
        shapeUtils={customShapeUtils}
        components={viewerComponents}
        colorScheme="dark"
        onMount={handleMount}
      />
    </div>
  );
}

