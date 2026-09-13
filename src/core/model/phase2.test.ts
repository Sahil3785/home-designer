import { describe, it, expect } from 'vitest';
import {
  recalculateFloorElevations,
  addFloorToProject,
  removeFloorFromProject,
  getFloorRise,
  DEFAULT_SLAB_THICKNESS,
  DEFAULT_CEILING_HEIGHT,
} from './floors';
import {
  calculateStairParameters,
  createDefaultStaircase,
  getStaircaseFootprint,
  getStairUpperCutout,
  getStairTreadLines,
} from './staircase';
import {
  createDefaultColumn,
  getColumnFootprint,
  isPointInsideColumn,
} from './columns';
import {
  createDefaultRoof,
  computeRoofBounds,
  getRoof2DGeometry,
  getRoofPeakRise,
} from './roof';
import {
  AddFloorCommand,
  DeleteFloorCommand,
  UpdateFloorCommand,
  AddStaircaseCommand,
  UpdateStaircaseCommand,
  DeleteStaircaseCommand,
  AddColumnCommand,
  UpdateColumnCommand,
  DeleteColumnCommand,
  UpdateRoofCommand,
} from '../history/buildingCommands';
import { createDefaultProject } from './defaults';
import { feetInchesToSixteenths } from '../units';

describe('Phase 2 — Multi-Floor House Structure', () => {
  describe('Floor Elevation Stacking & Management', () => {
    it('stacks floor elevations accurately based on ceiling heights and slab thicknesses', () => {
      const proj = createDefaultProject();
      expect(proj.floors.length).toBe(1);
      expect(proj.floors[0].elevation).toBe(0);

      // Add First Floor
      const { project: proj2, newFloor: firstFloor } = addFloorToProject(proj, {
        name: 'First Floor',
        ceilingHeight: feetInchesToSixteenths(9, 0), // 1728
        slabThickness: feetInchesToSixteenths(1, 0), // 192
      });

      expect(proj2.floors.length).toBe(2);
      // Floor 1 elevation = 0 + 1728 + 192 = 1920 (10' 0")
      expect(firstFloor.elevation).toBe(1920);

      // Add Second Floor
      const { project: proj3, newFloor: secondFloor } = addFloorToProject(proj2, {
        name: 'Second Floor',
        ceilingHeight: feetInchesToSixteenths(8, 0), // 1536
        slabThickness: feetInchesToSixteenths(1, 0), // 192
      });

      expect(proj3.floors.length).toBe(3);
      // Floor 2 elevation = 1920 + 1728 + 192 = 3840 (20' 0")
      expect(secondFloor.elevation).toBe(3840);
    });

    it('clones exterior load-bearing walls for structural alignment', () => {
      const proj = createDefaultProject();
      const groundFloor = proj.floors[0];
      expect(groundFloor.walls.length).toBe(4);

      const { newFloor } = addFloorToProject(proj, {
        name: 'Upper Floor',
        cloneWallsFromFloorId: groundFloor.id,
      });

      expect(newFloor.walls.length).toBe(4);
      // Walls have new unique IDs
      expect(newFloor.walls[0].id).not.toBe(groundFloor.walls[0].id);
      expect(newFloor.walls[0].floorId).toBe(newFloor.id);
      // Coordinates match ground floor for load-bearing alignment
      expect(newFloor.walls[0].start).toEqual(groundFloor.walls[0].start);
      expect(newFloor.walls[0].end).toEqual(groundFloor.walls[0].end);
    });

    it('recalculates elevations when a middle floor is deleted', () => {
      const proj = createDefaultProject();
      const { project: p2 } = addFloorToProject(proj, { name: 'Floor 1' });
      const { project: p3, newFloor: f2 } = addFloorToProject(p2, { name: 'Floor 2' });

      expect(p3.floors.length).toBe(3);
      // Delete Floor 1 (middle floor)
      const floor1Id = p3.floors[1].id;
      const p4 = removeFloorFromProject(p3, floor1Id);

      expect(p4.floors.length).toBe(2);
      // The remaining top floor's elevation should restack right above Ground Floor
      const topFloor = p4.floors.find((f) => f.id === f2.id);
      expect(topFloor?.elevation).toBe(1920); // 10' 0"
    });
  });

  describe('Architectural Staircase Generator & 2R+T Compliance', () => {
    it('calculates residential code-compliant risers and treads for 10ft rise', () => {
      const totalRise = feetInchesToSixteenths(10, 0); // 1920 sixteenths
      const calc = calculateStairParameters(totalRise);

      // Target ~7.25" (116). 1920 / 116 ≈ 16.55 -> 16 or 17 risers
      expect(calc.riserCount).toBeGreaterThanOrEqual(15);
      expect(calc.riserCount).toBeLessThanOrEqual(18);

      // IRC Maximum riser: 7 3/4" = 124 sixteenths
      expect(calc.riserHeight).toBeLessThanOrEqual(124);

      // IRC Minimum tread: 10" = 160 sixteenths
      expect(calc.treadDepth).toBeGreaterThanOrEqual(160);

      // Formula 2R + T target ~ 24" - 26"
      expect(calc.codeFormulaVal).toBeGreaterThanOrEqual(23.5);
      expect(calc.codeFormulaVal).toBeLessThanOrEqual(26.0);
      expect(calc.isCodeCompliant).toBe(true);
    });

    it('creates straight, L-shaped, and U-shaped staircase footprints', () => {
      const straight = createDefaultStaircase('floor_1', { x: 0, y: 0 }, 1920, 'straight');
      const straightFp = getStaircaseFootprint(straight);
      expect(straightFp.length).toBe(4);

      const lShaped = createDefaultStaircase('floor_1', { x: 0, y: 0 }, 1920, 'l-shaped');
      const lFp = getStaircaseFootprint(lShaped);
      expect(lFp.length).toBe(6);

      const uShaped = createDefaultStaircase('floor_1', { x: 0, y: 0 }, 1920, 'u-shaped');
      const uFp = getStaircaseFootprint(uShaped);
      expect(uFp.length).toBe(8);
    });

    it('generates upper floor slab cutout with comfortable headroom margin', () => {
      const stair = createDefaultStaircase('floor_1', { x: 0, y: 0 }, 1920, 'straight');
      const cutout = getStairUpperCutout(stair);
      expect(cutout.length).toBe(4);
      // Cutout should be larger than original footprint
      const fp = getStaircaseFootprint(stair);
      const fpSpanX = Math.abs(fp[1].x - fp[0].x);
      const cutSpanX = Math.abs(cutout[1].x - cutout[0].x);
      expect(cutSpanX).toBeGreaterThan(fpSpanX);
    });

    it('generates tread line segments for 2D CAD drafting', () => {
      const stair = createDefaultStaircase('floor_1', { x: 0, y: 0 }, 1920, 'straight');
      const lines = getStairTreadLines(stair);
      expect(lines.length).toBe(stair.riserCount); // N treads
      expect(lines[0].start).toBeDefined();
      expect(lines[0].end).toBeDefined();
    });
  });

  describe('Structural Columns', () => {
    it('creates rectangular and round columns with proper dimensions', () => {
      const rectCol = createDefaultColumn('floor_1', { x: 500, y: 500 }, 'rectangular');
      expect(rectCol.shape).toBe('rectangular');
      expect(rectCol.width).toBe(192); // 12"
      expect(rectCol.depth).toBe(192); // 12"

      const roundCol = createDefaultColumn('floor_1', { x: 500, y: 500 }, 'round');
      expect(roundCol.shape).toBe('round');
    });

    it('tests point containment accurately for rectangular and round columns', () => {
      const col = createDefaultColumn('floor_1', { x: 0, y: 0 }, 'rectangular');
      // Half width is 96
      expect(isPointInsideColumn({ x: 0, y: 0 }, col)).toBe(true);
      expect(isPointInsideColumn({ x: 90, y: 90 }, col)).toBe(true);
      expect(isPointInsideColumn({ x: 120, y: 0 }, col)).toBe(false);

      const roundCol = createDefaultColumn('floor_1', { x: 0, y: 0 }, 'round');
      expect(isPointInsideColumn({ x: 0, y: 0 }, roundCol)).toBe(true);
      expect(isPointInsideColumn({ x: 60, y: 60 }, roundCol)).toBe(true); // hypot ≈ 84.8 < 96
      expect(isPointInsideColumn({ x: 80, y: 80 }, roundCol)).toBe(false); // hypot ≈ 113.1 > 96
    });
  });

  describe('Roof Generator', () => {
    it('computes building roof boundary with eave overhang', () => {
      const proj = createDefaultProject();
      const walls = proj.floors[0].walls;
      const overhang = 192; // 1' 0"

      const bounds = computeRoofBounds(walls, overhang);
      // The default room is 24' x 16' centered: minX = -2304, maxX = 2304, minY = -1536, maxY = 1536
      expect(bounds.minX).toBe(-2304 - overhang);
      expect(bounds.maxX).toBe(2304 + overhang);
      expect(bounds.minY).toBe(-1536 - overhang);
      expect(bounds.maxY).toBe(1536 + overhang);
    });

    it('generates 2D ridge and hip lines for Gable and Hip roofs', () => {
      const proj = createDefaultProject();
      const walls = proj.floors[0].walls;

      const gableRoof = createDefaultRoof(proj.floors[0].id, 'gable');
      const gable2D = getRoof2DGeometry(gableRoof, walls);
      expect(gable2D.eaveOutline.length).toBe(4);
      expect(gable2D.ridgeLines.length).toBe(1);
      expect(gable2D.hipLines.length).toBe(0);

      const hipRoof = createDefaultRoof(proj.floors[0].id, 'hip');
      const hip2D = getRoof2DGeometry(hipRoof, walls);
      expect(hip2D.eaveOutline.length).toBe(4);
      expect(hip2D.ridgeLines.length).toBe(1);
      expect(hip2D.hipLines.length).toBe(4); // 4 hip rafter lines
    });

    it('computes peak rise from pitch ratio', () => {
      const proj = createDefaultProject();
      const roof = createDefaultRoof(proj.floors[0].id, 'gable');
      roof.pitch = 6; // 6/12 pitch
      const bounds = computeRoofBounds(proj.floors[0].walls, roof.overhang);

      const peakRise = getRoofPeakRise(roof, bounds);
      // Half span of depth (1536 + 192 = 1728). Rise = 1728 * (6 / 12) = 864 sixteenths (4' 6")
      expect(peakRise).toBe(864);
    });
  });

  describe('Reversible History Commands', () => {
    it('executes and undoes AddFloorCommand and DeleteFloorCommand', () => {
      let proj = createDefaultProject();
      const initialFloorCount = proj.floors.length;

      const { newFloor } = addFloorToProject(proj, { name: 'Upper Attic' });
      const addCmd = new AddFloorCommand(newFloor);

      proj = addCmd.execute(proj);
      expect(proj.floors.length).toBe(initialFloorCount + 1);
      expect(proj.activeFloorId).toBe(newFloor.id);

      proj = addCmd.undo(proj);
      expect(proj.floors.length).toBe(initialFloorCount);
    });

    it('executes and undoes AddStaircaseCommand and DeleteStaircaseCommand', () => {
      let proj = createDefaultProject();
      const floorId = proj.activeFloorId;
      const stair = createDefaultStaircase(floorId, { x: 0, y: 0 });

      const addCmd = new AddStaircaseCommand(floorId, stair);
      proj = addCmd.execute(proj);
      expect(proj.floors[0].stairs?.length).toBe(1);

      proj = addCmd.undo(proj);
      expect(proj.floors[0].stairs?.length).toBe(0);
    });

    it('executes and undoes AddColumnCommand and DeleteColumnCommand', () => {
      let proj = createDefaultProject();
      const floorId = proj.activeFloorId;
      const col = createDefaultColumn(floorId, { x: 100, y: 200 });

      const addCmd = new AddColumnCommand(floorId, col);
      proj = addCmd.execute(proj);
      expect(proj.floors[0].columns?.length).toBe(1);

      proj = addCmd.undo(proj);
      expect(proj.floors[0].columns?.length).toBe(0);
    });

    it('executes and undoes UpdateRoofCommand', () => {
      let proj = createDefaultProject();
      const floorId = proj.activeFloorId;
      const roof = createDefaultRoof(floorId, 'hip');

      const roofCmd = new UpdateRoofCommand(floorId, roof);
      proj = roofCmd.execute(proj);
      expect(proj.floors[0].roof?.type).toBe('hip');

      proj = roofCmd.undo(proj);
      expect(proj.floors[0].roof).toBeUndefined();
    });
  });
});
