/**
 * Core measurement system for Home Designer.
 * 
 * CRITICAL RULE: Internally, NEVER use floating-point metres or feet as the source of truth.
 * Store every coordinate, dimension, thickness, and offset as an integer number of sixteenths of an inch.
 * 
 * 1 inch = 16 sixteenths
 * 1 foot = 12 * 16 = 192 sixteenths
 */

export type Sixteenths = number;

export const SIXTEENTHS_PER_INCH = 16;
export const INCHES_PER_FOOT = 12;
export const SIXTEENTHS_PER_FOOT = 192; // 12 * 16

/** Standard snap increments in integer sixteenths */
export const SNAP_PRESETS = {
  ONE_SIXTEENTH: 1,
  ONE_EIGHTH: 2,
  ONE_QUARTER: 4,
  ONE_HALF: 8,
  ONE_INCH: 16,
  TWO_INCHES: 32,
  SIX_INCHES: 96,
  ONE_FOOT: 192,
} as const;

export type SnapIncrement = (typeof SNAP_PRESETS)[keyof typeof SNAP_PRESETS];

/**
 * Converts integer feet to integer sixteenths of an inch.
 */
export function feetToSixteenths(feet: number): Sixteenths {
  return Math.round(feet * SIXTEENTHS_PER_FOOT);
}

/**
 * Converts integer or fractional inches to integer sixteenths of an inch.
 */
export function inchesToSixteenths(inches: number): Sixteenths {
  return Math.round(inches * SIXTEENTHS_PER_INCH);
}

/**
 * Converts feet, whole inches, and sixteenths to total sixteenths.
 */
export function feetInchesToSixteenths(
  feet: number,
  inches: number = 0,
  fractionSixteenths: number = 0
): Sixteenths {
  const sign = feet < 0 || inches < 0 ? -1 : 1;
  const absFeet = Math.abs(feet);
  const absInches = Math.abs(inches);
  const absFrac = Math.abs(fractionSixteenths);
  return sign * (absFeet * SIXTEENTHS_PER_FOOT + absInches * SIXTEENTHS_PER_INCH + absFrac);
}

/**
 * Decomposes sixteenths into architectural parts: feet, inches, and fractional sixteenths.
 */
export function decomposeSixteenths(total: Sixteenths): {
  isNegative: boolean;
  feet: number;
  inches: number;
  sixteenths: number;
} {
  const isNegative = total < 0;
  const absTotal = Math.abs(Math.round(total));
  const feet = Math.floor(absTotal / SIXTEENTHS_PER_FOOT);
  const remainder = absTotal % SIXTEENTHS_PER_FOOT;
  const inches = Math.floor(remainder / SIXTEENTHS_PER_INCH);
  const sixteenths = remainder % SIXTEENTHS_PER_INCH;

  return { isNegative, feet, inches, sixteenths };
}

/**
 * Three.js 3D world unit conversion:
 * 1 Three.js world unit = 1 foot (192 sixteenths).
 * This keeps Three.js numbers clean (e.g. 10 feet = 10.0 units, 6 inches = 0.5 units).
 */
export function sixteenthsToThreeUnits(s: Sixteenths): number {
  return s / SIXTEENTHS_PER_FOOT;
}

export function threeUnitsToSixteenths(units: number): Sixteenths {
  return Math.round(units * SIXTEENTHS_PER_FOOT);
}

/**
 * Snaps a sixteenths value to the nearest integer multiple of snapInterval.
 */
export function snapSixteenths(val: Sixteenths, snapInterval: number): Sixteenths {
  if (snapInterval <= 1) return Math.round(val);
  return Math.round(val / snapInterval) * snapInterval;
}
