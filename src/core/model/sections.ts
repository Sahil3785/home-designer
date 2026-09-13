import {
  Project,
  Floor,
  Wall,
  WallOpening,
  Point2D,
  SectionCut,
  Roof,
} from './types';
import { Sixteenths, feetInchesToSixteenths, formatFeetInches } from '../units';
import { distance2D } from './geometry';

export interface SectionCutIntersection {
  floorId: string;
  floorName: string;
  floorElevation: Sixteenths;
  ceilingHeight: Sixteenths;
  distanceAlongCut: Sixteenths; // Distance from p1 along the cut vector
  wallId: string;
  wallThickness: Sixteenths;
  wallHeight: Sixteenths;
  hitType: 'solid_wall' | 'opening';
  opening?: WallOpening;
}

export interface SectionDatumLevel {
  id: string;
  name: string;
  elevation: Sixteenths;
  formatted: string;
  isGroundOrPlinth?: boolean;
  isRoof?: boolean;
}

export interface SectionRoomSegment {
  roomId: string;
  roomName: string;
  startDist: Sixteenths;
  endDist: Sixteenths;
  width: Sixteenths;
}

export interface SectionAnalysis {
  sectionCut: SectionCut;
  totalLength: Sixteenths;
  cutWalls: SectionCutIntersection[];
  datumLevels: SectionDatumLevel[];
  roomSegments: SectionRoomSegment[];
  roofProfile?: {
    type: string;
    pitch: number;
    peakElevation: Sixteenths;
    eaveElevation: Sixteenths;
    leftOverhang: Sixteenths;
    rightOverhang: Sixteenths;
  };
}

/**
 * Creates a default SectionCut definition.
 */
export function createDefaultSectionCut(
  id: string = `sec_${Date.now()}`,
  name: string = "Section A-A'",
  label: string = 'A',
  p1: Point2D = { x: -2500, y: 0 },
  p2: Point2D = { x: 2500, y: 0 },
  viewDirection: 'left' | 'right' = 'left',
  sheetRef: string = 'A-301'
): SectionCut {
  return {
    id,
    name,
    label,
    p1,
    p2,
    viewDirection,
    sheetRef,
  };
}

/**
 * Tests intersection between line segment (A1 -> A2) and (B1 -> B2).
 * Returns intersection point and t parameter [0, 1] along segment A if intersecting.
 */
export function findSegmentIntersection(
  a1: Point2D,
  a2: Point2D,
  b1: Point2D,
  b2: Point2D
): { point: Point2D; tA: number; tB: number } | null {
  const dAx = a2.x - a1.x;
  const dAy = a2.y - a1.y;
  const dBx = b2.x - b1.x;
  const dBy = b2.y - b1.y;

  const denom = dAx * dBy - dAy * dBx;
  if (Math.abs(denom) < 0.0001) return null; // Parallel or collinear

  const s = ((b1.x - a1.x) * dBy - (b1.y - a1.y) * dBx) / denom;
  const t = ((b1.x - a1.x) * dAy - (b1.y - a1.y) * dAx) / denom;

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    return {
      point: {
        x: Math.round(a1.x + s * dAx),
        y: Math.round(a1.y + s * dAy),
      },
      tA: s,
      tB: t,
    };
  }

  return null;
}

/**
 * Computes all datum levels (Floor 0, Floor 1, Roof Ridge, Foundation) for architectural section markers.
 */
export function computeBuildingSectionDatums(project: Project): SectionDatumLevel[] {
  const levels: SectionDatumLevel[] = [];

  // Foundation level (-2' 0")
  levels.push({
    id: 'datum_foundation',
    name: 'Foundation Level',
    elevation: -feetInchesToSixteenths(2, 0),
    formatted: "-2' 0\"",
    isGroundOrPlinth: false,
  });

  // Plinth level (0' 0")
  levels.push({
    id: 'datum_plinth',
    name: 'Plinth / Ground Level ±0.00',
    elevation: 0,
    formatted: "±0' 0\"",
    isGroundOrPlinth: true,
  });

  let topFloorElevation = 0;
  let topFloorCeiling = feetInchesToSixteenths(9, 0);

  project.floors.forEach((floor, idx) => {
    const elev = floor.elevation || 0;
    topFloorElevation = elev;
    topFloorCeiling = floor.ceilingHeight || feetInchesToSixteenths(9, 0);

    if (idx > 0) {
      levels.push({
        id: `datum_floor_${floor.id}`,
        name: `${floor.name} Finished Floor Level`,
        elevation: elev,
        formatted: `+${formatFeetInches(elev)}`,
      });
    }

    const ceilingElev = elev + topFloorCeiling;
    levels.push({
      id: `datum_ceiling_${floor.id}`,
      name: `${floor.name} Ceiling Level`,
      elevation: ceilingElev,
      formatted: `+${formatFeetInches(ceilingElev)}`,
    });
  });

  // Check if roof exists on the top floor
  const topFloor = project.floors[project.floors.length - 1];
  if (topFloor?.roof && topFloor.roof.visible !== false) {
    const pitch = topFloor.roof.pitch || 6;
    // Estimate roof ridge height from half-width and pitch
    const approxRidgeRise = Math.round(pitch * 200);
    const ridgeElev = topFloorElevation + topFloorCeiling + approxRidgeRise;
    levels.push({
      id: 'datum_roof_ridge',
      name: 'Roof Ridge / Apex Level',
      elevation: ridgeElev,
      formatted: `+${formatFeetInches(ridgeElev)}`,
      isRoof: true,
    });
  }

  return levels.sort((a, b) => a.elevation - b.elevation);
}

/**
 * Analyzes full multi-floor intersections along a section cut line.
 */
export function analyzeSectionCut(
  sectionCut: SectionCut,
  project: Project
): SectionAnalysis {
  const totalLength = distance2D(sectionCut.p1, sectionCut.p2);
  const cutWalls: SectionCutIntersection[] = [];
  const roomSegments: SectionRoomSegment[] = [];

  for (const floor of project.floors) {
    const floorElev = floor.elevation || 0;
    const ceilingH = floor.ceilingHeight || feetInchesToSixteenths(9, 0);

    // Wall Intersections
    for (const wall of floor.walls) {
      const hit = findSegmentIntersection(sectionCut.p1, sectionCut.p2, wall.start, wall.end);
      if (!hit) continue;

      const distAlong = Math.round(hit.tA * totalLength);
      const wallLen = distance2D(wall.start, wall.end);
      const distAlongWall = Math.round(hit.tB * wallLen);

      // Check if cut falls inside an opening on this wall
      let cutOpening: WallOpening | undefined;
      for (const op of wall.openings) {
        const opStart = op.offsetAlongWall;
        const opEnd = op.offsetAlongWall + op.width;
        if (distAlongWall >= opStart && distAlongWall <= opEnd) {
          cutOpening = op;
          break;
        }
      }

      cutWalls.push({
        floorId: floor.id,
        floorName: floor.name,
        floorElevation: floorElev,
        ceilingHeight: ceilingH,
        distanceAlongCut: distAlong,
        wallId: wall.id,
        wallThickness: wall.thickness,
        wallHeight: wall.height || ceilingH,
        hitType: cutOpening ? 'opening' : 'solid_wall',
        opening: cutOpening,
      });
    }

    // Room segments along cut
    for (const room of floor.rooms) {
      if (room.polygon.length < 3) continue;
      // Find intersections of room polygon edges with cut
      const edgeHits: number[] = [];
      for (let i = 0; i < room.polygon.length; i++) {
        const pA = room.polygon[i];
        const pB = room.polygon[(i + 1) % room.polygon.length];
        const hit = findSegmentIntersection(sectionCut.p1, sectionCut.p2, pA, pB);
        if (hit) {
          edgeHits.push(Math.round(hit.tA * totalLength));
        }
      }

      if (edgeHits.length >= 2) {
        edgeHits.sort((a, b) => a - b);
        const startDist = edgeHits[0];
        const endDist = edgeHits[edgeHits.length - 1];
        if (endDist - startDist > 160) {
          roomSegments.push({
            roomId: room.id,
            roomName: room.name,
            startDist,
            endDist,
            width: endDist - startDist,
          });
        }
      }
    }
  }

  // Sort cut walls from left to right along section line
  cutWalls.sort((a, b) => a.distanceAlongCut - b.distanceAlongCut);

  // Roof details
  const topFloor = project.floors[project.floors.length - 1];
  let roofProfile: SectionAnalysis['roofProfile'];
  if (topFloor?.roof && topFloor.roof.visible !== false) {
    const r = topFloor.roof;
    const topElev = (topFloor.elevation || 0) + (topFloor.ceilingHeight || feetInchesToSixteenths(9, 0));
    const pitch = r.pitch || 6;
    const rise = Math.round(pitch * 200);
    roofProfile = {
      type: r.type,
      pitch,
      peakElevation: topElev + rise,
      eaveElevation: topElev,
      leftOverhang: r.overhang || 192,
      rightOverhang: r.overhang || 192,
    };
  }

  const datumLevels = computeBuildingSectionDatums(project);

  return {
    sectionCut,
    totalLength,
    cutWalls,
    datumLevels,
    roomSegments,
    roofProfile,
  };
}

/**
 * Returns geometry coordinates for rendering the 2D CAD section line with arrows & bubbles.
 */
export function getSection2DLineGeometry(cut: SectionCut) {
  const dx = cut.p2.x - cut.p1.x;
  const dy = cut.p2.y - cut.p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;

  const nx = -dy / len;
  const ny = dx / len;
  // Direction sign based on viewDirection
  const sign = cut.viewDirection === 'right' ? 1 : -1;
  const arrowLength = 450; // Sixteenths

  return {
    p1: cut.p1,
    p2: cut.p2,
    arrow1End: {
      x: cut.p1.x + sign * nx * arrowLength,
      y: cut.p1.y + sign * ny * arrowLength,
    },
    arrow2End: {
      x: cut.p2.x + sign * nx * arrowLength,
      y: cut.p2.y + sign * ny * arrowLength,
    },
    label: cut.label,
    sheetRef: cut.sheetRef || 'A-301',
  };
}
