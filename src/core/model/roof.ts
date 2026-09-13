import { Roof, RoofType, Wall, Point2D } from './types';
import { Sixteenths, feetInchesToSixteenths } from '../units';

export interface RoofBounds {
  minX: Sixteenths;
  maxX: Sixteenths;
  minY: Sixteenths;
  maxY: Sixteenths;
  width: Sixteenths;
  depth: Sixteenths;
  centerX: Sixteenths;
  centerY: Sixteenths;
}

/**
 * Creates a default roof for a floor.
 */
export function createDefaultRoof(
  floorId: string,
  type: RoofType = 'gable'
): Roof {
  return {
    id: `roof_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    floorId,
    type,
    pitch: 6, // 6/12 pitch (~26.6 degrees)
    overhang: feetInchesToSixteenths(1, 0), // 1' 0" eave overhang = 192
    thickness: feetInchesToSixteenths(0, 6), // 6" fascia = 96
    ridgeAxis: 'x',
    visible: true,
  };
}

/**
 * Computes outer bounds of walls on a floor, expanded by the eave overhang.
 */
export function computeRoofBounds(walls: Wall[], overhang: Sixteenths): RoofBounds {
  if (walls.length === 0) {
    // Default 24' x 16' fallback
    const hw = 2304 + overhang;
    const hd = 1536 + overhang;
    return {
      minX: -hw,
      maxX: hw,
      minY: -hd,
      maxY: hd,
      width: 2 * hw,
      depth: 2 * hd,
      centerX: 0,
      centerY: 0,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const w of walls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  }

  minX -= overhang;
  maxX += overhang;
  minY -= overhang;
  maxY += overhang;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    depth: maxY - minY,
    centerX: Math.round((minX + maxX) / 2),
    centerY: Math.round((minY + maxY) / 2),
  };
}

export interface Roof2DGeometry {
  eaveOutline: Point2D[];
  ridgeLines: { start: Point2D; end: Point2D }[];
  hipLines: { start: Point2D; end: Point2D }[];
}

/**
 * Computes 2D CAD representation lines for a roof (eave, ridge, and hip lines).
 */
export function getRoof2DGeometry(roof: Roof, walls: Wall[]): Roof2DGeometry {
  const b = computeRoofBounds(walls, roof.overhang);

  const eaveOutline: Point2D[] = [
    { x: b.minX, y: b.minY },
    { x: b.maxX, y: b.minY },
    { x: b.maxX, y: b.maxY },
    { x: b.minX, y: b.maxY },
  ];

  const ridgeLines: { start: Point2D; end: Point2D }[] = [];
  const hipLines: { start: Point2D; end: Point2D }[] = [];

  if (roof.type === 'gable') {
    if (roof.ridgeAxis === 'x') {
      ridgeLines.push({
        start: { x: b.minX, y: b.centerY },
        end: { x: b.maxX, y: b.centerY },
      });
    } else {
      ridgeLines.push({
        start: { x: b.centerX, y: b.minY },
        end: { x: b.centerX, y: b.maxY },
      });
    }
  } else if (roof.type === 'hip') {
    if (roof.ridgeAxis === 'x') {
      const inset = Math.min(b.width / 4, b.depth / 2);
      const rStart = { x: b.minX + inset, y: b.centerY };
      const rEnd = { x: b.maxX - inset, y: b.centerY };
      ridgeLines.push({ start: rStart, end: rEnd });

      hipLines.push({ start: { x: b.minX, y: b.minY }, end: rStart });
      hipLines.push({ start: { x: b.minX, y: b.maxY }, end: rStart });
      hipLines.push({ start: { x: b.maxX, y: b.minY }, end: rEnd });
      hipLines.push({ start: { x: b.maxX, y: b.maxY }, end: rEnd });
    } else {
      const inset = Math.min(b.depth / 4, b.width / 2);
      const rStart = { x: b.centerX, y: b.minY + inset };
      const rEnd = { x: b.centerX, y: b.maxY - inset };
      ridgeLines.push({ start: rStart, end: rEnd });

      hipLines.push({ start: { x: b.minX, y: b.minY }, end: rStart });
      hipLines.push({ start: { x: b.maxX, y: b.minY }, end: rStart });
      hipLines.push({ start: { x: b.minX, y: b.maxY }, end: rEnd });
      hipLines.push({ start: { x: b.maxX, y: b.maxY }, end: rEnd });
    }
  } else if (roof.type === 'shed') {
    if (roof.ridgeAxis === 'x') {
      ridgeLines.push({
        start: { x: b.minX, y: b.maxY },
        end: { x: b.maxX, y: b.maxY },
      });
    } else {
      ridgeLines.push({
        start: { x: b.maxX, y: b.minY },
        end: { x: b.maxX, y: b.maxY },
      });
    }
  }

  return { eaveOutline, ridgeLines, hipLines };
}

/**
 * Computes peak rise above eave height based on pitch (e.g. 6/12 pitch).
 */
export function getRoofPeakRise(roof: Roof, bounds: RoofBounds): Sixteenths {
  if (roof.type === 'flat') return 0;

  const halfSpan = roof.ridgeAxis === 'x' ? bounds.depth / 2 : bounds.width / 2;
  // Rise = run * (pitch / 12)
  return Math.round(halfSpan * (roof.pitch / 12));
}
