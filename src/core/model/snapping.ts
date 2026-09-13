import { Point2D, Wall } from './types';
import { Sixteenths, snapSixteenths } from '../units';
import { distance2D, projectPointOntoSegment } from './geometry';

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  coordinate: Sixteenths; // x coordinate for vertical, y for horizontal
  fromPoint: Point2D;
}

export interface SnapResult {
  point: Point2D;
  snappedTo: 'grid' | 'endpoint' | 'midpoint' | 'edge' | 'ortho' | 'none';
  guidelines: AlignmentGuide[];
}

const SNAP_DISTANCE = 192; // 12 inches snap radius for endpoints/midpoints
const ALIGN_DISTANCE = 128; // 8 inches alignment guide attraction threshold

/**
 * Calculates snapped point and active alignment guidelines from cursor position.
 */
export function calculateCADSnap(
  rawWorld: Point2D,
  walls: Wall[],
  snapGrid: Sixteenths,
  orthogonalSnap: boolean,
  startPoint?: Point2D | null
): SnapResult {
  const guidelines: AlignmentGuide[] = [];
  let snappedX = snapSixteenths(rawWorld.x, snapGrid);
  let snappedY = snapSixteenths(rawWorld.y, snapGrid);
  let snappedTo: SnapResult['snappedTo'] = 'grid';

  // 1. Check Endpoint Snapping (Highest Priority)
  for (const wall of walls) {
    if (distance2D(rawWorld, wall.start) <= SNAP_DISTANCE) {
      return {
        point: { ...wall.start },
        snappedTo: 'endpoint',
        guidelines: [],
      };
    }
    if (distance2D(rawWorld, wall.end) <= SNAP_DISTANCE) {
      return {
        point: { ...wall.end },
        snappedTo: 'endpoint',
        guidelines: [],
      };
    }

    // Check Midpoint Snapping
    const midX = Math.round((wall.start.x + wall.end.x) / 2);
    const midY = Math.round((wall.start.y + wall.end.y) / 2);
    const midPoint: Point2D = { x: midX, y: midY };
    if (distance2D(rawWorld, midPoint) <= SNAP_DISTANCE / 2) {
      return {
        point: midPoint,
        snappedTo: 'midpoint',
        guidelines: [],
      };
    }
  }

  // 2. Alignment Guides (Smart Guides tracking X and Y of other wall endpoints)
  let bestDistX = ALIGN_DISTANCE;
  let bestDistY = ALIGN_DISTANCE;

  for (const wall of walls) {
    for (const pt of [wall.start, wall.end]) {
      const dx = Math.abs(rawWorld.x - pt.x);
      if (dx < bestDistX) {
        bestDistX = dx;
        snappedX = pt.x;
        guidelines.push({
          type: 'vertical',
          coordinate: pt.x,
          fromPoint: pt,
        });
      }

      const dy = Math.abs(rawWorld.y - pt.y);
      if (dy < bestDistY) {
        bestDistY = dy;
        snappedY = pt.y;
        guidelines.push({
          type: 'horizontal',
          coordinate: pt.y,
          fromPoint: pt,
        });
      }
    }
  }

  // 3. Orthogonal Angle Snapping relative to drawing start point
  if (orthogonalSnap && startPoint) {
    const dx = snappedX - startPoint.x;
    const dy = snappedY - startPoint.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy * 2) {
      snappedY = startPoint.y; // Lock strictly horizontal
      snappedTo = 'ortho';
    } else if (absDy > absDx * 2) {
      snappedX = startPoint.x; // Lock strictly vertical
      snappedTo = 'ortho';
    } else {
      // 45-degree angle lock
      const dist = Math.round((absDx + absDy) / 2);
      snappedX = startPoint.x + (dx >= 0 ? 1 : -1) * dist;
      snappedY = startPoint.y + (dy >= 0 ? 1 : -1) * dist;
      snappedTo = 'ortho';
    }
  }

  // 4. Edge Projection Snapping (if near a wall edge)
  if (snappedTo === 'grid' && guidelines.length === 0) {
    for (const wall of walls) {
      const proj = projectPointOntoSegment(rawWorld, wall.start, wall.end);
      if (proj.distance <= 96 && proj.t > 0.05 && proj.t < 0.95) {
        return {
          point: proj.projection,
          snappedTo: 'edge',
          guidelines: [],
        };
      }
    }
  }

  return {
    point: { x: snappedX, y: snappedY },
    snappedTo,
    guidelines,
  };
}
