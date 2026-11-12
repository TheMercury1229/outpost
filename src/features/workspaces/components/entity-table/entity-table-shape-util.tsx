import {
  HTMLContainer,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  type Editor,
  type TLArrowBinding,
  type TLResizeInfo,
} from "tldraw";
import { EntityTableComponent } from "./entity-table-component";
import {
  type EntityTableShape,
  entityTableProps,
  getTableHeight,
  HEADER_HEIGHT,
  rowAnchorY,
  ROW_HEIGHT,
  TABLE_WIDTH,
} from "./types";

export class EntityTableShapeUtil extends ShapeUtil<EntityTableShape> {
  static override type = "entity-table" as const;
  static override props = entityTableProps;

  getDefaultProps(): EntityTableShape["props"] {
    return {
      w: TABLE_WIDTH,
      h: getTableHeight(0),
      tableName: "new_table",
      rows: [],
    };
  }

  getGeometry(shape: EntityTableShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: getTableHeight(shape.props.rows.length),
      isFilled: true,
    });
  }

  // Only width is resizable: height is clamped back to fit the rows (see getTableHeight).
  override canResize() {
    return true;
  }

  override onResize(
    shape: EntityTableShape,
    info: TLResizeInfo<EntityTableShape>,
  ) {
    const height = getTableHeight(shape.props.rows.length);
    const resized = resizeBox(shape, info, {
      minWidth: TABLE_WIDTH,
      minHeight: height,
      maxHeight: height,
    });
    return {
      ...resized,
      props: { ...resized.props, h: height },
    };
  }

  override canEdit() {
    return true;
  }

  // Lets arrows bind to the table; snapping them to a row happens in snapArrowBindingToRow.
  override canBind() {
    return true;
  }

  component(shape: EntityTableShape) {
    return (
      <HTMLContainer>
        <EntityTableComponent shape={shape} />
      </HTMLContainer>
    );
  }

  getIndicatorPath(shape: EntityTableShape) {
    const path = new Path2D();
    path.rect(0, 0, shape.props.w, getTableHeight(shape.props.rows.length));
    return path;
  }
}

// Snaps a freshly created arrow binding to the vertical center of the nearest row. tldraw keeps
// the anchor as a fraction of the shape, so it stays on that row as the table gains rows or resizes.
export function snapArrowBindingToRow(editor: Editor, binding: TLArrowBinding) {
  const table = editor.getShape(binding.toId);
  if (table?.type !== "entity-table") return;
  const rowCount = (table as EntityTableShape).props.rows.length;
  if (rowCount === 0) return;

  // Map the anchor back to the row it's nearest to.
  const y =
    binding.props.normalizedAnchor.y * getTableHeight(rowCount) - HEADER_HEIGHT;
  const rowIndex = Math.min(
    rowCount - 1,
    Math.max(0, Math.floor(y / ROW_HEIGHT)),
  );
  const nextY = rowAnchorY(rowIndex, rowCount);

  if (
    binding.props.isPrecise &&
    Math.abs(binding.props.normalizedAnchor.y - nextY) < 1e-6
  ) {
    return;
  }

  editor.updateBinding({
    id: binding.id,
    type: "arrow",
    props: {
      ...binding.props,
      normalizedAnchor: {
        x: binding.props.normalizedAnchor.x,
        y: nextY,
      },
      isPrecise: true,
    },
  });
}
