import { Column, ColumnShape, Point2D } from './types';
import { Sixteenths, feetInchesToSixteenths } from '../units';

/**
 * Creates a default architectural structural column.
 */
export function createDefaultColumn(
  floorId: string,
  position: Point2D,
  shape: ColumnShape = 'rectangular',
  height: Sixteenths = feetInchesToSixteenths(9, 0) // 9' 0" = 1728
): Column {
  const size = feetInchesToSixteenths(1, 0); // 1' 0" = 192 (12" x 12" or 12" dia)

  return {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    floorId,
    name: shape === 'rectangular' ? 'Square Column' : 'Round Column',
    position,
    shape,
    width: size,
    depth: size,
    height,
    materialId: 'mat_interior_paint_white',
  };
}

/**
 * Returns the 2D bounding polygon of the column for CAD display and hit testing.
 */
export function getColumnFootprint(column: Column): Point2D[] {
  const hw = Math.round(column.width / 2);
  const hd = Math.round(column.depth / 2);
  const cx = column.position.x;
  const cy = column.position.y;
  const rot = column.rotation || 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const rotateOffset = (ox: number, oy: number): Point2D => ({
    x: Math.round(cx + ox * cos - oy * sin),
    y: Math.round(cy + ox * sin + oy * cos),
  });

  if (column.shape === 'rectangular') {
    return [
      rotateOffset(-hw, -hd),
      rotateOffset(hw, -hd),
      rotateOffset(hw, hd),
      rotateOffset(-hw, hd),
    ];
  }

  // Approximate circle / ellipse with 12 segments
  const pts: Point2D[] = [];
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    pts.push(rotateOffset(Math.cos(angle) * hw, Math.sin(angle) * hd));
  }
  return pts;
}

/**
 * Checks if a 2D point is inside the column footprint.
 */
export function isPointInsideColumn(pt: Point2D, column: Column): boolean {
  const hw = column.width / 2;
  const hd = column.depth / 2;
  const rot = column.rotation || 0;

  // Transform point into column local frame
  const relX = pt.x - column.position.x;
  const relY = pt.y - column.position.y;
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const localX = Math.abs(relX * cos - relY * sin);
  const localY = Math.abs(relX * sin + relY * cos);

  if (column.shape === 'rectangular') {
    return localX <= hw && localY <= hd;
  }

  // Ellipse / circle test
  return (localX * localX) / (hw * hw) + (localY * localY) / (hd * hd) <= 1.0;
}
