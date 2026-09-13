import { Staircase, StaircaseType, Point2D } from './types';
import { Sixteenths, feetInchesToSixteenths } from '../units';

export interface StairCalcResult {
  riserCount: number;
  riserHeight: Sixteenths;
  treadDepth: Sixteenths;
  treadCount: number;
  totalRun: Sixteenths;
  codeFormulaVal: number; // 2R + T in inches
  isCodeCompliant: boolean;
}

/**
 * Calculates optimal architectural staircase parameters using the 2R + T rule (24" - 25.5").
 */
export function calculateStairParameters(
  totalRise: Sixteenths,
  targetTreadDepth: Sixteenths = feetInchesToSixteenths(0, 11) // 11" = 176
): StairCalcResult {
  // Target residential riser height ~ 7.25" (116 sixteenths)
  const targetRiser = feetInchesToSixteenths(0, 7, 4); // 7 1/4" = 116
  const riserCount = Math.max(3, Math.round(totalRise / targetRiser));
  const riserHeight = Math.round(totalRise / riserCount);

  // Check 2R + T: target 24" - 25.5" (384 - 408 sixteenths)
  let treadDepth = targetTreadDepth;
  const twoR = 2 * riserHeight;
  if (twoR + treadDepth > 410) {
    treadDepth = Math.max(160, 392 - twoR); // ensure at least 10" (160)
  }

  // Straight flight has 1 less tread than risers (top floor is the final landing)
  const treadCount = Math.max(2, riserCount - 1);
  const totalRun = treadCount * treadDepth;

  const codeFormulaVal = (2 * riserHeight + treadDepth) / 16;
  const isCodeCompliant = riserHeight <= 124 && treadDepth >= 160 && codeFormulaVal >= 23.5 && codeFormulaVal <= 26;

  return {
    riserCount,
    riserHeight,
    treadDepth,
    treadCount,
    totalRun,
    codeFormulaVal,
    isCodeCompliant,
  };
}

/**
 * Factory for creating a standard architectural staircase.
 */
export function createDefaultStaircase(
  floorId: string,
  startPoint: Point2D,
  totalRise: Sixteenths = feetInchesToSixteenths(10, 0), // 10' 0" = 1920
  type: StaircaseType = 'straight'
): Staircase {
  const calc = calculateStairParameters(totalRise);
  const width = feetInchesToSixteenths(3, 0); // 3' 0" = 576

  return {
    id: `stair_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    floorId,
    name: type === 'straight' ? 'Straight Staircase' : type === 'l-shaped' ? 'L-Shaped Staircase' : 'U-Shaped Staircase',
    type,
    startPoint,
    angle: 0,
    width,
    totalRise,
    riserCount: calc.riserCount,
    riserHeight: calc.riserHeight,
    treadDepth: calc.treadDepth,
    landingDepth: width,
    hasHandrail: true,
    handrailSide: 'both',
  };
}

/**
 * Computes 2D bounding footprint polygon for the staircase given its angle and dimensions.
 */
export function getStaircaseFootprint(stair: Staircase): Point2D[] {
  const cos = Math.cos(stair.angle);
  const sin = Math.sin(stair.angle);
  const { startPoint, width, treadDepth, riserCount, type, landingDepth } = stair;

  const rotate = (lx: number, ly: number): Point2D => ({
    x: Math.round(startPoint.x + lx * cos - ly * sin),
    y: Math.round(startPoint.y + lx * sin + ly * cos),
  });

  if (type === 'straight') {
    const treads = Math.max(2, riserCount - 1);
    const totalRun = treads * treadDepth;
    return [
      rotate(0, -width / 2),
      rotate(totalRun, -width / 2),
      rotate(totalRun, width / 2),
      rotate(0, width / 2),
    ];
  }

  if (type === 'l-shaped') {
    const flight1Treads = Math.floor((riserCount - 1) / 2);
    const flight2Treads = (riserCount - 1) - flight1Treads;
    const run1 = flight1Treads * treadDepth;
    const run2 = flight2Treads * treadDepth;

    // L-shape: flight 1 along +X, turns +Y
    return [
      rotate(0, -width / 2),
      rotate(run1 + landingDepth, -width / 2),
      rotate(run1 + landingDepth, width / 2 + run2),
      rotate(run1, width / 2 + run2),
      rotate(run1, width / 2),
      rotate(0, width / 2),
    ];
  }

  // U-shaped: 180° switchback
  const flight1Treads = Math.floor((riserCount - 1) / 2);
  const run1 = flight1Treads * treadDepth;
  const totalWidth = width * 2 + 16; // 1" well gap

  return [
    rotate(0, -width / 2),
    rotate(run1 + landingDepth, -width / 2),
    rotate(run1 + landingDepth, totalWidth - width / 2),
    rotate(0, totalWidth - width / 2),
    rotate(0, width + 16 - width / 2),
    rotate(run1, width + 16 - width / 2),
    rotate(run1, width / 2),
    rotate(0, width / 2),
  ];
}

/**
 * Returns tread line segments in world coordinates for 2D CAD drafting.
 */
export function getStairTreadLines(
  stair: Staircase
): { start: Point2D; end: Point2D; isLanding?: boolean }[] {
  const cos = Math.cos(stair.angle);
  const sin = Math.sin(stair.angle);
  const { startPoint, width, treadDepth, riserCount, type, landingDepth } = stair;

  const rotate = (lx: number, ly: number): Point2D => ({
    x: Math.round(startPoint.x + lx * cos - ly * sin),
    y: Math.round(startPoint.y + lx * sin + ly * cos),
  });

  const lines: { start: Point2D; end: Point2D; isLanding?: boolean }[] = [];

  if (type === 'straight') {
    const treads = Math.max(2, riserCount - 1);
    for (let i = 0; i <= treads; i++) {
      const x = i * treadDepth;
      lines.push({
        start: rotate(x, -width / 2),
        end: rotate(x, width / 2),
        isLanding: i === treads,
      });
    }
  } else if (type === 'l-shaped') {
    const flight1Treads = Math.floor((riserCount - 1) / 2);
    const flight2Treads = (riserCount - 1) - flight1Treads;
    const run1 = flight1Treads * treadDepth;

    // Flight 1 treads
    for (let i = 0; i <= flight1Treads; i++) {
      const x = i * treadDepth;
      lines.push({
        start: rotate(x, -width / 2),
        end: rotate(x, width / 2),
        isLanding: false,
      });
    }

    // Landing boundary
    lines.push({
      start: rotate(run1 + landingDepth, -width / 2),
      end: rotate(run1 + landingDepth, width / 2),
      isLanding: true,
    });

    // Flight 2 treads (turning +Y)
    for (let j = 1; j <= flight2Treads; j++) {
      const y = width / 2 + j * treadDepth;
      lines.push({
        start: rotate(run1, y),
        end: rotate(run1 + landingDepth, y),
        isLanding: j === flight2Treads,
      });
    }
  } else {
    // U-shaped
    const flight1Treads = Math.floor((riserCount - 1) / 2);
    const flight2Treads = (riserCount - 1) - flight1Treads;
    const run1 = flight1Treads * treadDepth;

    for (let i = 0; i <= flight1Treads; i++) {
      const x = i * treadDepth;
      lines.push({
        start: rotate(x, -width / 2),
        end: rotate(x, width / 2),
        isLanding: false,
      });
    }

    // Flight 2 treads running backward
    for (let j = 0; j <= flight2Treads; j++) {
      const x = run1 - j * treadDepth;
      lines.push({
        start: rotate(x, width + 16 - width / 2),
        end: rotate(x, width * 2 + 16 - width / 2),
        isLanding: j === 0,
      });
    }
  }

  return lines;
}

/**
 * Returns polygon for the stairwell cutout in the upper floor slab.
 */
export function getStairUpperCutout(stair: Staircase): Point2D[] {
  // Use the full footprint of the staircase plus a 4" margin for comfortable headroom
  const margin = 64; // 4"
  const fp = getStaircaseFootprint(stair);
  if (fp.length < 3) return fp;

  // Compute centroid
  const cx = fp.reduce((acc, p) => acc + p.x, 0) / fp.length;
  const cy = fp.reduce((acc, p) => acc + p.y, 0) / fp.length;

  // Slightly expand outwards from centroid
  return fp.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    return {
      x: Math.round(p.x + (dx / dist) * margin),
      y: Math.round(p.y + (dy / dist) * margin),
    };
  });
}
