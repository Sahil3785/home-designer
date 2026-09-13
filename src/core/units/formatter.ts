import { Sixteenths, decomposeSixteenths } from './units';

export interface FormatOptions {
  /** If true, formats as `10' 0"` instead of `10'`. Default: true for consistency in CAD */
  showZeroInches?: boolean;
  /** If true, formats as `0' 6"` instead of `6"`. Default: false */
  alwaysShowFeet?: boolean;
  /** Precision rounding for fractional sixteenths: 16 (default, exact), 8, 4, 2, 1 */
  precision?: 16 | 8 | 4 | 2 | 1;
}

/**
 * Reduces a fraction of sixteenths to lowest terms (e.g. 8/16 -> 1/2).
 */
export function reduceSixteenths(sixteenths: number): { num: number; den: number } | null {
  if (sixteenths <= 0 || sixteenths >= 16) return null;

  if (sixteenths % 8 === 0) return { num: sixteenths / 8, den: 2 };
  if (sixteenths % 4 === 0) return { num: sixteenths / 4, den: 4 };
  if (sixteenths % 2 === 0) return { num: sixteenths / 2, den: 8 };
  return { num: sixteenths, den: 16 };
}

/**
 * Formats an integer sixteenths value into standard architectural feet and inches string.
 * Examples:
 *   1920 -> 10' 0"
 *   2016 -> 10' 6"
 *   2376 -> 12' 4 1/2"
 *   1692 -> 8' 9 3/4"
 *   96   -> 6" (or 0' 6" if alwaysShowFeet)
 *   8    -> 1/2"
 *   0    -> 0"
 */
export function formatFeetInches(
  value: Sixteenths,
  options: FormatOptions = {}
): string {
  const {
    showZeroInches = true,
    alwaysShowFeet = false,
    precision = 16,
  } = options;

  if (value === 0) {
    return alwaysShowFeet ? `0' 0"` : `0"`;
  }

  const { isNegative, feet, inches, sixteenths: rawSixteenths } = decomposeSixteenths(value);

  // Apply precision rounding
  let fracStep = 16 / precision;
  let roundedSixteenths = Math.round(rawSixteenths / fracStep) * fracStep;
  let carryInches = inches;
  let carryFeet = feet;

  if (roundedSixteenths >= 16) {
    roundedSixteenths -= 16;
    carryInches += 1;
  }
  if (carryInches >= 12) {
    carryInches -= 12;
    carryFeet += 1;
  }

  const reduced = reduceSixteenths(roundedSixteenths);
  const fracStr = reduced ? `${reduced.num}/${reduced.den}` : '';

  const prefix = isNegative ? '-' : '';

  // Only feet (no inches and no fraction)
  if (carryFeet > 0 && carryInches === 0 && !reduced) {
    if (showZeroInches) {
      return `${prefix}${carryFeet}' 0"`;
    }
    return `${prefix}${carryFeet}'`;
  }

  // Feet and inches/fraction
  if (carryFeet > 0 || alwaysShowFeet) {
    let inchPart = '';
    if (carryInches > 0 && reduced) {
      inchPart = `${carryInches} ${fracStr}"`;
    } else if (carryInches > 0) {
      inchPart = `${carryInches}"`;
    } else if (reduced) {
      inchPart = `${fracStr}"`;
    } else {
      inchPart = '0"';
    }
    return `${prefix}${carryFeet}' ${inchPart}`;
  }

  // Under a foot (no feet)
  if (carryInches > 0 && reduced) {
    return `${prefix}${carryInches} ${fracStr}"`;
  } else if (carryInches > 0) {
    return `${prefix}${carryInches}"`;
  } else if (reduced) {
    return `${prefix}${fracStr}"`;
  }

  return `${prefix}0"`;
}
