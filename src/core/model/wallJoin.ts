import { Wall, Point2D, Floor } from './types';
import { Sixteenths } from '../units';
import { distance2D, wallAngle, wallLength } from './geometry';

export interface WallJunction {
  point: Point2D;
  wallIds: string[];
}

export interface WallOutlinePolygon {
  wallId: string;
  points: Point2D[]; // 4 or more vertices of the mitered wall
}

/**
 * Finds all wall endpoints sharing a position within tolerance.
 */
export function findJunctions(walls: Wall[], tolerance = 16): WallJunction[] {
  const junctions: WallJunction[] = [];

  for (const wall of walls) {
    for (const pt of [wall.start, wall.end]) {
      let existing = junctions.find((j) => distance2D(j.point, pt) <= tolerance);
      if (existing) {
        if (!existing.wallIds.includes(wall.id)) {
          existing.wallIds.push(wall.id);
        }
      } else {
        junctions.push({
          point: { ...pt },
          wallIds: [wall.id],
        });
      }
    }
  }

  return junctions;
}

/**
 * Finds all walls connected to a specific junction point.
 */
export function getConnectedWallsAtPoint(
  walls: Wall[],
  point: Point2D,
  tolerance = 16
): { wall: Wall; isStart: boolean }[] {
  const connected: { wall: Wall; isStart: boolean }[] = [];
  for (const w of walls) {
    if (distance2D(w.start, point) <= tolerance) {
      connected.push({ wall: w, isStart: true });
    } else if (distance2D(w.end, point) <= tolerance) {
      connected.push({ wall: w, isStart: false });
    }
  }
  return connected;
}

/**
 * Computes intersection of two 2D lines given point and direction vectors.
 */
function lineIntersection(
  p1: Point2D,
  v1: { x: number; y: number },
  p2: Point2D,
  v2: { x: number; y: number }
): Point2D | null {
  const cross = v1.x * v2.y - v1.y * v2.x;
  if (Math.abs(cross) < 1e-6) return null; // Parallel

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const t = (dx * v2.y - dy * v2.x) / cross;

  return {
    x: Math.round(p1.x + t * v1.x),
    y: Math.round(p1.y + t * v1.y),
  };
}

/**
 * Calculates mitered 4-point outline polygons for all walls in a floor.
 */
export function computeMiteredWallPolygons(floor: Floor): Map<string, Point2D[]> {
  const map = new Map<string, Point2D[]>();
  const walls = floor.walls;

  for (const wall of walls) {
    const len = wallLength(wall);
    if (len <= 0) continue;

    const angle = wallAngle(wall);
    const halfThick = wall.thickness / 2;

    // Default square ends
    const perpX = -Math.sin(angle) * halfThick;
    const perpY = Math.cos(angle) * halfThick;

    let pStartLeft: Point2D = {
      x: Math.round(wall.start.x + perpX),
      y: Math.round(wall.start.y + perpY),
    };
    let pStartRight: Point2D = {
      x: Math.round(wall.start.x - perpX),
      y: Math.round(wall.start.y - perpY),
    };
    let pEndLeft: Point2D = {
      x: Math.round(wall.end.x + perpX),
      y: Math.round(wall.end.y + perpY),
    };
    let pEndRight: Point2D = {
      x: Math.round(wall.end.x - perpX),
      y: Math.round(wall.end.y - perpY),
    };

    // Check Start Junction for miter join with another wall
    const startConnected = getConnectedWallsAtPoint(walls, wall.start, 16).filter(
      (c) => c.wall.id !== wall.id
    );

    if (startConnected.length === 1) {
      const other = startConnected[0].wall;
      const otherIsStart = startConnected[0].isStart;
      const otherAngle = wallAngle(other);

      // Angle difference
      const diff = Math.abs(angle - otherAngle);
      if (diff > 0.1 && diff < Math.PI * 2 - 0.1) {
        // Compute miter intersection
        const v1 = { x: Math.cos(angle), y: Math.sin(angle) };
        const v2 = { x: Math.cos(otherAngle), y: Math.sin(otherAngle) };

        const otherPerpX = -Math.sin(otherAngle) * (other.thickness / 2);
        const otherPerpY = Math.cos(otherAngle) * (other.thickness / 2);

        const otherBase = otherIsStart ? other.start : other.end;
        const otherLeft = { x: otherBase.x + otherPerpX, y: otherBase.y + otherPerpY };
        const otherRight = { x: otherBase.x - otherPerpX, y: otherBase.y - otherPerpY };

        const miterLeft = lineIntersection(pStartLeft, v1, otherLeft, v2);
        const miterRight = lineIntersection(pStartRight, v1, otherRight, v2);

        // Clamp miter extension to prevent spikes at acute angles
        const maxExtension = wall.thickness * 2;
        if (miterLeft && distance2D(miterLeft, wall.start) < maxExtension) {
          pStartLeft = miterLeft;
        }
        if (miterRight && distance2D(miterRight, wall.start) < maxExtension) {
          pStartRight = miterRight;
        }
      }
    }

    // Check End Junction for miter join with another wall
    const endConnected = getConnectedWallsAtPoint(walls, wall.end, 16).filter(
      (c) => c.wall.id !== wall.id
    );

    if (endConnected.length === 1) {
      const other = endConnected[0].wall;
      const otherIsStart = endConnected[0].isStart;
      const otherAngle = wallAngle(other);

      const diff = Math.abs(angle - otherAngle);
      if (diff > 0.1 && diff < Math.PI * 2 - 0.1) {
        const v1 = { x: Math.cos(angle), y: Math.sin(angle) };
        const v2 = { x: Math.cos(otherAngle), y: Math.sin(otherAngle) };

        const otherPerpX = -Math.sin(otherAngle) * (other.thickness / 2);
        const otherPerpY = Math.cos(otherAngle) * (other.thickness / 2);

        const otherBase = otherIsStart ? other.start : other.end;
        const otherLeft = { x: otherBase.x + otherPerpX, y: otherBase.y + otherPerpY };
        const otherRight = { x: otherBase.x - otherPerpX, y: otherBase.y - otherPerpY };

        const miterLeft = lineIntersection(pEndLeft, v1, otherLeft, v2);
        const miterRight = lineIntersection(pEndRight, v1, otherRight, v2);

        const maxExtension = wall.thickness * 2;
        if (miterLeft && distance2D(miterLeft, wall.end) < maxExtension) {
          pEndLeft = miterLeft;
        }
        if (miterRight && distance2D(miterRight, wall.end) < maxExtension) {
          pEndRight = miterRight;
        }
      }
    }

    // Form polygon in clockwise order
    map.set(wall.id, [pStartLeft, pEndLeft, pEndRight, pStartRight]);
  }

  return map;
}
