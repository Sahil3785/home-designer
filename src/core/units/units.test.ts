import { describe, it, expect } from 'vitest';
import {
  feetToSixteenths,
  inchesToSixteenths,
  feetInchesToSixteenths,
  decomposeSixteenths,
  sixteenthsToThreeUnits,
  threeUnitsToSixteenths,
  snapSixteenths,
  SNAP_PRESETS,
} from './units';
import { formatFeetInches } from './formatter';
import { parseFeetInches } from './parser';

describe('Units Measurement Core (Sixteenths of an inch)', () => {
  it('converts feet to sixteenths precisely', () => {
    expect(feetToSixteenths(1)).toBe(192);
    expect(feetToSixteenths(10)).toBe(1920);
    expect(feetToSixteenths(0)).toBe(0);
    expect(feetToSixteenths(-5)).toBe(-960);
  });

  it('converts inches to sixteenths precisely', () => {
    expect(inchesToSixteenths(1)).toBe(16);
    expect(inchesToSixteenths(6)).toBe(96);
    expect(inchesToSixteenths(0.5)).toBe(8);
  });

  it('combines feet, inches, and fractional sixteenths', () => {
    // 10' 6" = 10 * 192 + 6 * 16 = 1920 + 96 = 2016
    expect(feetInchesToSixteenths(10, 6)).toBe(2016);
    // 12' 4 1/2" = 12 * 192 + 4 * 16 + 8 = 2304 + 64 + 8 = 2376
    expect(feetInchesToSixteenths(12, 4, 8)).toBe(2376);
    // 8' 9 3/4" = 8 * 192 + 9 * 16 + 12 = 1536 + 144 + 12 = 1692
    expect(feetInchesToSixteenths(8, 9, 12)).toBe(1692);
  });

  it('decomposes sixteenths into architectural parts correctly', () => {
    const d1 = decomposeSixteenths(2016); // 10' 6"
    expect(d1.feet).toBe(10);
    expect(d1.inches).toBe(6);
    expect(d1.sixteenths).toBe(0);
    expect(d1.isNegative).toBe(false);

    const d2 = decomposeSixteenths(2376); // 12' 4 1/2" (8/16)
    expect(d2.feet).toBe(12);
    expect(d2.inches).toBe(4);
    expect(d2.sixteenths).toBe(8);

    const d3 = decomposeSixteenths(1692); // 8' 9 3/4" (12/16)
    expect(d3.feet).toBe(8);
    expect(d3.inches).toBe(9);
    expect(d3.sixteenths).toBe(12);
  });

  it('converts to/from Three.js world units cleanly', () => {
    // 1 Three unit = 1 foot (192 sixteenths)
    expect(sixteenthsToThreeUnits(1920)).toBe(10.0);
    expect(sixteenthsToThreeUnits(2016)).toBe(10.5);
    expect(threeUnitsToSixteenths(10.0)).toBe(1920);
    expect(threeUnitsToSixteenths(10.5)).toBe(2016);
  });

  it('snaps coordinates to grid increments', () => {
    // Snap to 1 inch (16)
    expect(snapSixteenths(15, SNAP_PRESETS.ONE_INCH)).toBe(16);
    expect(snapSixteenths(7, SNAP_PRESETS.ONE_INCH)).toBe(0);

    // Snap to 2 inches (32)
    expect(snapSixteenths(30, SNAP_PRESETS.TWO_INCHES)).toBe(32);
    expect(snapSixteenths(15, SNAP_PRESETS.TWO_INCHES)).toBe(0);

    // Snap to 6 inches (96)
    expect(snapSixteenths(90, SNAP_PRESETS.SIX_INCHES)).toBe(96);

    // Snap to 1 foot (192)
    expect(snapSixteenths(190, SNAP_PRESETS.ONE_FOOT)).toBe(192);
    expect(snapSixteenths(100, SNAP_PRESETS.ONE_FOOT)).toBe(192);
    expect(snapSixteenths(95, SNAP_PRESETS.ONE_FOOT)).toBe(0);
  });
});

describe('Architectural Formatter (formatFeetInches)', () => {
  it('formats exact user requirements', () => {
    // 10' 0"
    expect(formatFeetInches(1920)).toBe(`10' 0"`);
    // 10' 6"
    expect(formatFeetInches(2016)).toBe(`10' 6"`);
    // 12' 4 1/2"
    expect(formatFeetInches(2376)).toBe(`12' 4 1/2"`);
    // 8' 9 3/4"
    expect(formatFeetInches(1692)).toBe(`8' 9 3/4"`);
  });

  it('formats inches and fractions under a foot', () => {
    expect(formatFeetInches(96)).toBe(`6"`);
    expect(formatFeetInches(8)).toBe(`1/2"`);
    expect(formatFeetInches(4)).toBe(`1/4"`);
    expect(formatFeetInches(12)).toBe(`3/4"`);
    expect(formatFeetInches(2)).toBe(`1/8"`);
    expect(formatFeetInches(1)).toBe(`1/16"`);
    expect(formatFeetInches(0)).toBe(`0"`);
  });

  it('respects formatting options', () => {
    expect(formatFeetInches(1920, { showZeroInches: false })).toBe(`10'`);
    expect(formatFeetInches(96, { alwaysShowFeet: true })).toBe(`0' 6"`);
    expect(formatFeetInches(0, { alwaysShowFeet: true })).toBe(`0' 0"`);
  });

  it('formats negative values', () => {
    expect(formatFeetInches(-1920)).toBe(`-10' 0"`);
    expect(formatFeetInches(-2016)).toBe(`-10' 6"`);
    expect(formatFeetInches(-96)).toBe(`-6"`);
  });
});

describe('Architectural Parser (parseFeetInches)', () => {
  it('parses exact required inputs accurately', () => {
    // 10'
    const r1 = parseFeetInches("10'");
    expect(r1.isValid).toBe(true);
    expect(r1.sixteenths).toBe(1920);

    // 10' 6"
    const r2 = parseFeetInches("10' 6\"");
    expect(r2.isValid).toBe(true);
    expect(r2.sixteenths).toBe(2016);

    // 12' 4 1/2"
    const r3 = parseFeetInches("12' 4 1/2\"");
    expect(r3.isValid).toBe(true);
    expect(r3.sixteenths).toBe(2376);

    // 8' 9 3/4"
    const r4 = parseFeetInches("8' 9 3/4\"");
    expect(r4.isValid).toBe(true);
    expect(r4.sixteenths).toBe(1692);
  });

  it('parses alternative formats and spaces', () => {
    expect(parseFeetInches("10'-6\"").sixteenths).toBe(2016);
    expect(parseFeetInches("10'6\"").sixteenths).toBe(2016);
    expect(parseFeetInches("10ft 6in").sixteenths).toBe(2016);
    expect(parseFeetInches("12' 4-1/2\"").sixteenths).toBe(2376);
    expect(parseFeetInches("  8'   9   3/4\"  ").sixteenths).toBe(1692);
  });

  it('parses inches only and fractional inches', () => {
    expect(parseFeetInches("6\"").sixteenths).toBe(96);
    expect(parseFeetInches("4 1/2\"").sixteenths).toBe(72);
    expect(parseFeetInches("1/2\"").sixteenths).toBe(8);
    expect(parseFeetInches("3/4").sixteenths).toBe(12);
  });

  it('parses decimal feet and inches', () => {
    expect(parseFeetInches("10.5'").sixteenths).toBe(2016); // 10.5 feet = 10' 6" = 2016
    expect(parseFeetInches("6.5\"").sixteenths).toBe(104);  // 6.5 inches = 6 1/2" = 104
  });

  it('parses negative values', () => {
    expect(parseFeetInches("-10'").sixteenths).toBe(-1920);
    expect(parseFeetInches("-10' 6\"").sixteenths).toBe(-2016);
    expect(parseFeetInches("-4 1/2\"").sixteenths).toBe(-72);
  });

  it('handles round-trip formatting and parsing', () => {
    const testValues = [1920, 2016, 2376, 1692, 96, 72, 8];
    for (const val of testValues) {
      const formatted = formatFeetInches(val);
      const parsed = parseFeetInches(formatted);
      expect(parsed.isValid).toBe(true);
      expect(parsed.sixteenths).toBe(val);
    }
  });
});
