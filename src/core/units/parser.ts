import { Sixteenths, SIXTEENTHS_PER_FOOT, SIXTEENTHS_PER_INCH } from './units';

export interface ParseResult {
  sixteenths: Sixteenths;
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes quotes and whitespace for architectural parsing.
 */
function normalizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\u2018\u2019\u2032']/g, "'") // single quotes / feet symbols
    .replace(/[\u201C\u201D\u2033"]/g, '"') // double quotes / inch symbols
    .replace(/\s+/g, ' ');
}

/**
 * Parses a fractional string like "1/2", "3/4", "7/16" into sixteenths.
 */
function parseFractionToSixteenths(fracStr: string): number | null {
  const parts = fracStr.trim().split('/');
  if (parts.length !== 2) return null;
  const num = parseFloat(parts[0]);
  const den = parseFloat(parts[1]);
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return Math.round((num / den) * SIXTEENTHS_PER_INCH);
}

/**
 * Parses an inch portion like:
 *  - "6"
 *  - "6\""
 *  - "4 1/2\""
 *  - "4-1/2\""
 *  - "1/2\""
 *  - "6.5\""
 */
function parseInchesPortion(inchStr: string): number | null {
  let s = inchStr.trim().replace(/"$/, '').replace(/in$/i, '').trim();
  if (!s) return 0;

  // Check for mixed number e.g. "4 1/2" or "4-1/2"
  const mixedMatch = s.match(/^(\d+)[-\s]+(\d+\/\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const frac = parseFractionToSixteenths(mixedMatch[2]);
    if (frac === null) return null;
    return whole * SIXTEENTHS_PER_INCH + frac;
  }

  // Check for standalone fraction e.g. "1/2"
  if (s.includes('/')) {
    const frac = parseFractionToSixteenths(s);
    return frac !== null ? frac : null;
  }

  // Check for decimal or integer inches e.g. "6", "6.5"
  const val = parseFloat(s);
  if (isNaN(val)) return null;
  return Math.round(val * SIXTEENTHS_PER_INCH);
}

/**
 * Parses user-entered architectural dimensions into integer sixteenths of an inch.
 * Supports:
 *   - "10'"
 *   - "10' 6\""
 *   - "10'-6\""
 *   - "12' 4 1/2\""
 *   - "8' 9 3/4\""
 *   - "10ft 6in"
 *   - "6\""
 *   - "4 1/2\""
 *   - "1/2\""
 *   - "10.5'"
 *   - "12" (defaults to inches, or uses defaultUnit)
 */
export function parseFeetInches(
  rawInput: string,
  defaultUnit: 'inches' | 'feet' = 'inches'
): ParseResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { sixteenths: 0, isValid: false, error: 'Empty input' };
  }

  let s = normalizeInput(rawInput);
  if (!s) {
    return { sixteenths: 0, isValid: false, error: 'Empty input' };
  }

  // Check sign
  let isNegative = false;
  if (s.startsWith('-')) {
    isNegative = true;
    s = s.substring(1).trim();
  } else if (s.startsWith('+')) {
    s = s.substring(1).trim();
  }

  // Pattern 1: Feet notation present: with `'` or `ft`
  // e.g. 10' 6", 12' 4 1/2", 10'-6", 10ft 6in, 10'
  const feetMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)\s*-?\s*(.*)$/i);
  if (feetMatch) {
    const feetVal = parseFloat(feetMatch[1]);
    const remainder = feetMatch[2].trim();

    let totalSixteenths = Math.round(feetVal * SIXTEENTHS_PER_FOOT);

    if (remainder) {
      const inchSixteenths = parseInchesPortion(remainder);
      if (inchSixteenths === null) {
        return { sixteenths: 0, isValid: false, error: `Invalid inch portion: "${remainder}"` };
      }
      totalSixteenths += inchSixteenths;
    }

    return {
      sixteenths: isNegative ? -totalSixteenths : totalSixteenths,
      isValid: true,
    };
  }

  // Pattern 2: Explicit inches notation present: `"` or `in`
  // e.g. 6", 4 1/2", 1/2", 64in
  if (s.endsWith('"') || /in$/i.test(s)) {
    const inchSixteenths = parseInchesPortion(s);
    if (inchSixteenths === null) {
      return { sixteenths: 0, isValid: false, error: `Invalid inches value: "${rawInput}"` };
    }
    return {
      sixteenths: isNegative ? -inchSixteenths : inchSixteenths,
      isValid: true,
    };
  }

  // Pattern 3: Fraction without quotes e.g. "1/2", "3/4"
  if (/^\d+\/\d+$/.test(s)) {
    const frac = parseFractionToSixteenths(s);
    if (frac !== null) {
      return {
        sixteenths: isNegative ? -frac : frac,
        isValid: true,
      };
    }
  }

  // Pattern 4: Mixed fraction without quotes e.g. "4 1/2"
  if (/^\d+[\s-]+\d+\/\d+$/.test(s)) {
    const inchSixteenths = parseInchesPortion(s);
    if (inchSixteenths !== null) {
      return {
        sixteenths: isNegative ? -inchSixteenths : inchSixteenths,
        isValid: true,
      };
    }
  }

  // Pattern 5: Bare number (e.g. "10", "120", "6.5")
  const numVal = parseFloat(s);
  if (!isNaN(numVal)) {
    const multiplier = defaultUnit === 'feet' ? SIXTEENTHS_PER_FOOT : SIXTEENTHS_PER_INCH;
    const sixteenths = Math.round(numVal * multiplier);
    return {
      sixteenths: isNegative ? -sixteenths : sixteenths,
      isValid: true,
    };
  }

  return {
    sixteenths: 0,
    isValid: false,
    error: `Could not parse dimension: "${rawInput}"`,
  };
}
