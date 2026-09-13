import { Point2D, Wall, Project } from './types';
import { Sixteenths } from '../units';

export function distance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

export function wallLength(wall: Wall): Sixteenths {
  return Math.round(distance2D(wall.start, wall.end));
}

export function wallAngle(wall: Wall): number {
  return Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
}

/**
 * Returns a point along the wall centerline at given distance from wall.start
 */
export function pointAlongWall(wall: Wall, offset: Sixteenths): Point2D {
  const len = wallLength(wall);
  if (len === 0) return { ...wall.start };
  const t = Math.max(0, Math.min(1, offset / len));
  return {
    x: Math.round(wall.start.x + (wall.end.x - wall.start.x) * t),
    y: Math.round(wall.start.y + (wall.end.y - wall.start.y) * t),
  };
}

/**
 * Projects a point onto a line segment AB.
 */
export function projectPointOntoSegment(
  p: Point2D,
  a: Point2D,
  b: Point2D
): { distance: number; projection: Point2D; t: number } {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;

  if (lenSq === 0) {
    return {
      distance: distance2D(p, a),
      projection: { ...a },
      t: 0,
    };
  }

  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));

  const proj: Point2D = {
    x: Math.round(a.x + t * abx),
    y: Math.round(a.y + t * aby),
  };

  return {
    distance: distance2D(p, proj),
    projection: proj,
    t,
  };
}

/**
 * Computes the 2D bounding box of all walls across the active floor or project.
 */
export function computeProjectBounds(project: Project): {
  minX: Sixteenths;
  minY: Sixteenths;
  maxX: Sixteenths;
  maxY: Sixteenths;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const floor of project.floors) {
    for (const wall of floor.walls) {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    }
  }

  if (minX === Infinity) {
    return { minX: -1920, minY: -1920, maxX: 1920, maxY: 1920 };
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Rotates a wall around its center midpoint to a target angle (in radians).
 * Preserves the exact length and thickness of the wall.
 */
export function rotateWallAroundMidpoint(wall: Wall, targetAngleRad: number): Wall {
  const len = wallLength(wall);
  const midX = (wall.start.x + wall.end.x) / 2;
  const midY = (wall.start.y + wall.end.y) / 2;
  const halfLen = len / 2;
  const cos = Math.cos(targetAngleRad);
  const sin = Math.sin(targetAngleRad);

  return {
    ...wall,
    start: {
      x: Math.round(midX - halfLen * cos),
      y: Math.round(midY - halfLen * sin),
    },
    end: {
      x: Math.round(midX + halfLen * cos),
      y: Math.round(midY + halfLen * sin),
    },
  };
}

/**
 * Reverses wall direction (swaps start and end point).
 */
export function reverseWallDirection(wall: Wall): Wall {
  const len = wallLength(wall);
  return {
    ...wall,
    start: { ...wall.end },
    end: { ...wall.start },
    openings: wall.openings.map((op) => ({
      ...op,
      offsetAlongWall: len - op.offsetAlongWall,
    })),
  };
}

export type WallResizeAnchor = 'start' | 'midpoint' | 'end';

/**
 * Resizes a wall to a target length while keeping an anchor fixed (start, midpoint, or end).
 * Clamps openings so they remain valid within the new wall bounds.
 */
export function resizeWall(
  wall: Wall,
  newLength: Sixteenths,
  anchor: WallResizeAnchor = 'start'
): Wall {
  const currentLen = wallLength(wall);
  const safeLength = Math.max(16, Math.round(newLength)); // Minimum 1 inch (16 sixteenths)
  
  // If current length is zero or start == end, extend along X axis
  const angle = currentLen > 0 ? wallAngle(wall) : 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  let newStart: Point2D = { ...wall.start };
  let newEnd: Point2D = { ...wall.end };

  if (anchor === 'start') {
    // Start point is anchored in place, end point moves
    newEnd = {
      x: Math.round(wall.start.x + safeLength * cos),
      y: Math.round(wall.start.y + safeLength * sin),
    };
  } else if (anchor === 'end') {
    // End point is anchored in place, start point moves
    newStart = {
      x: Math.round(wall.end.x - safeLength * cos),
      y: Math.round(wall.end.y - safeLength * sin),
    };
  } else {
    // Midpoint is anchored in place, expands symmetrically
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const halfLen = safeLength / 2;
    newStart = {
      x: Math.round(midX - halfLen * cos),
      y: Math.round(midY - halfLen * sin),
    };
    newEnd = {
      x: Math.round(midX + halfLen * cos),
      y: Math.round(midY + halfLen * sin),
    };
  }

  // Adjust and clamp openings if wall has been shortened
  const adjustedOpenings = wall.openings.map((op) => {
    const maxOffset = Math.max(0, safeLength - op.width);
    return {
      ...op,
      offsetAlongWall: Math.min(op.offsetAlongWall, maxOffset),
    };
  });

  return {
    ...wall,
    start: newStart,
    end: newEnd,
    openings: adjustedOpenings,
  };
}

