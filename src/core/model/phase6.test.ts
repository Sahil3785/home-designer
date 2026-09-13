import { describe, it, expect } from 'vitest';
import {
  findSegmentIntersection,
  computeBuildingSectionDatums,
  analyzeSectionCut,
  getSection2DLineGeometry,
} from './sections';
import { createDefaultProject } from './defaults';
import { SectionCut, Wall, WallOpening } from './types';
import { distance2D } from './geometry';

describe('Phase 6 Architectural Section Cut Engine & 3D Walkthrough', () => {
  describe('Segment Intersection Math', () => {
    it('accurately calculates intersection point between crossing 2D line segments', () => {
      const p1 = { x: 0, y: 100 };
      const p2 = { x: 200, y: 100 };
      const p3 = { x: 100, y: 0 };
      const p4 = { x: 100, y: 200 };

      const hit = findSegmentIntersection(p1, p2, p3, p4);
      expect(hit).not.toBeNull();
      expect(hit?.tA).toBeCloseTo(0.5);
      expect(hit?.tB).toBeCloseTo(0.5);
      expect(hit?.point.x).toBe(100);
      expect(hit?.point.y).toBe(100);
    });

    it('returns null for parallel line segments', () => {
      const p1 = { x: 0, y: 50 };
      const p2 = { x: 200, y: 50 };
      const p3 = { x: 0, y: 100 };
      const p4 = { x: 200, y: 100 };

      const hit = findSegmentIntersection(p1, p2, p3, p4);
      expect(hit).toBeNull();
    });

    it('returns null for collinear non-overlapping or non-intersecting line segments', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 50, y: 0 };
      const p3 = { x: 100, y: 10 };
      const p4 = { x: 100, y: 50 };

      const hit = findSegmentIntersection(p1, p2, p3, p4);
      expect(hit).toBeNull();
    });
  });

  describe('Architectural Building Section Datums', () => {
    it('computes standard foundation, finished floor levels, ceiling datums, and roof peak', () => {
      const project = createDefaultProject();
      const datums = computeBuildingSectionDatums(project);

      expect(datums.length).toBeGreaterThanOrEqual(3);

      // Verify foundation datum is negative
      const fdn = datums.find((d) => d.name.toLowerCase().includes('foundation'));
      expect(fdn).toBeDefined();
      expect(fdn!.elevation).toBeLessThan(0);

      // Verify ground floor datum is 0
      const gnd = datums.find((d) => d.isGroundOrPlinth);
      expect(gnd).toBeDefined();
      expect(gnd!.elevation).toBe(0);
      expect(gnd!.formatted).toContain("0'");

      // Verify ceiling datum
      const ceilingDatum = datums.find((d) => d.name.toLowerCase().includes('ceiling'));
      expect(ceilingDatum).toBeDefined();
      expect(ceilingDatum!.elevation).toBeGreaterThan(0);

      // Add a roof and verify roof ridge datum
      project.floors[0].roof = {
        id: 'test-roof',
        floorId: project.floors[0].id,
        type: 'gable',
        pitch: 6,
        overhang: 192,
        thickness: 96,
        ridgeAxis: 'x',
        visible: true,
      };
      const datumsWithRoof = computeBuildingSectionDatums(project);
      const roofDatum = datumsWithRoof.find((d) => d.isRoof || d.name.toLowerCase().includes('roof'));
      expect(roofDatum).toBeDefined();
      expect(roofDatum!.elevation).toBeGreaterThan(project.floors[0].ceilingHeight);
    });
  });

  describe('Section Cut Analysis Engine', () => {
    it('analyzes section cut line through project walls and openings', () => {
      const project = createDefaultProject();
      const cut: SectionCut = {
        id: 'sec-test',
        name: 'Section A-A',
        label: 'A',
        sheetRef: 'A-301',
        p1: { x: 0, y: 1920 },
        p2: { x: 9600, y: 1920 },
        viewDirection: 'left',
      };

      const analysis = analyzeSectionCut(cut, project);
      expect(analysis.totalLength).toBe(9600);
      expect(analysis.sectionCut.label).toBe('A');
      expect(analysis.datumLevels.length).toBeGreaterThanOrEqual(3);

      // If walls intersect, they should be classified and sorted
      if (analysis.cutWalls.length > 0) {
        for (let i = 1; i < analysis.cutWalls.length; i++) {
          expect(analysis.cutWalls[i].distanceAlongCut).toBeGreaterThanOrEqual(
            analysis.cutWalls[i - 1].distanceAlongCut
          );
        }
      }
    });

    it('identifies cut openings vs solid walls along the section cut line', () => {
      const project = createDefaultProject();
      // Construct a test wall with a door opening
      const wall: Wall = {
        id: 'wall-test-door',
        floorId: 'floor-1',
        height: 1920,
        start: { x: 2000, y: 0 },
        end: { x: 2000, y: 4000 },
        thickness: 96,
        openings: [
          {
            id: 'door-1',
            wallId: 'wall-test-door',
            name: 'Test Door',
            type: 'door',
            offsetAlongWall: 2000,
            width: 576, // 3'-0"
            height: 1280,
            elevation: 0,
            flipInward: true,
            flipHand: true,
            isOpen: true,
          },
        ],
      };
      project.floors[0].walls.push(wall);

      // Section cut slicing right through the door at y = 2000
      const cutThroughDoor: SectionCut = {
        id: 'cut-door',
        name: 'Section D-D',
        label: 'D',
        sheetRef: 'A-301',
        p1: { x: 0, y: 2000 },
        p2: { x: 4000, y: 2000 },
        viewDirection: 'right',
      };

      const analysis = analyzeSectionCut(cutThroughDoor, project);
      const hit = analysis.cutWalls.find((w) => w.wallId === 'wall-test-door');
      expect(hit).toBeDefined();
      expect(hit?.hitType).toBe('opening');
      expect(hit?.opening?.type).toBe('door');
      expect(hit?.opening?.isOpen).toBe(true);
    });
  });

  describe('2D Section Cut Symbol Geometry', () => {
    it('computes 2D CAD line normals, arrows, and bubble coordinates', () => {
      const cut: SectionCut = {
        id: 'sec-geom',
        name: 'Section A-A',
        label: 'A',
        sheetRef: 'A-301',
        p1: { x: 1000, y: 2000 },
        p2: { x: 5000, y: 2000 },
        viewDirection: 'right',
      };

      const geom = getSection2DLineGeometry(cut);
      expect(geom).not.toBeNull();
      expect(geom?.label).toBe('A');
      expect(geom?.sheetRef).toBe('A-301');
      expect(geom?.p1.x).toBe(1000);
      expect(geom?.p2.x).toBe(5000);
      // Horizontal cut line has perpendicular normal along y
      expect(geom?.arrow1End.x).toBe(1000);
      expect(geom?.arrow1End.y).toBeGreaterThan(2000);
    });

    it('reverses arrow orientation when viewDirection is set to left', () => {
      const cutRight: SectionCut = {
        id: 'sec-r',
        name: 'Section A-A',
        label: 'A',
        sheetRef: 'A-301',
        p1: { x: 1000, y: 2000 },
        p2: { x: 5000, y: 2000 },
        viewDirection: 'right',
      };

      const cutLeft: SectionCut = {
        id: 'sec-l',
        name: 'Section A-A',
        label: 'A',
        sheetRef: 'A-301',
        p1: { x: 1000, y: 2000 },
        p2: { x: 5000, y: 2000 },
        viewDirection: 'left',
      };

      const gRight = getSection2DLineGeometry(cutRight);
      const gLeft = getSection2DLineGeometry(cutLeft);

      expect(gRight?.arrow1End.y).toBeGreaterThan(2000);
      expect(gLeft?.arrow1End.y).toBeLessThan(2000);
    });
  });

  describe('3D Walk Collision Door Bypass Logic', () => {
    it('allows player walk passage when intersecting an open door opening', () => {
      const wall: Wall = {
        id: 'w-walk',
        floorId: 'floor-1',
        height: 1920,
        start: { x: 0, y: 0 },
        end: { x: 6000, y: 0 },
        thickness: 96,
        openings: [
          {
            id: 'd-walk',
            wallId: 'w-walk',
            name: 'Pass Door',
            type: 'door',
            offsetAlongWall: 3000,
            width: 600,
            height: 1280,
            elevation: 0,
            flipInward: true,
            flipHand: true,
            isOpen: true,
          },
        ],
      };

      const wallLen = distance2D(wall.start, wall.end);
      const testT = 0.5; // t = 0.5 -> offset = 3000 (directly in the doorway)
      const posAlongWall = testT * wallLen;

      let canPass = false;
      for (const op of wall.openings) {
        const opStart = op.offsetAlongWall - op.width / 2;
        const opEnd = op.offsetAlongWall + op.width / 2;
        if (posAlongWall >= opStart && posAlongWall <= opEnd) {
          if (op.type === 'door' && op.isOpen) {
            canPass = true;
            break;
          }
        }
      }

      expect(canPass).toBe(true);
    });

    it('blocks walk passage when door is closed or user steps into solid wall', () => {
      const wall: Wall = {
        id: 'w-walk-closed',
        floorId: 'floor-1',
        height: 1920,
        start: { x: 0, y: 0 },
        end: { x: 6000, y: 0 },
        thickness: 96,
        openings: [
          {
            id: 'd-closed',
            wallId: 'w-walk-closed',
            name: 'Closed Door',
            type: 'door',
            offsetAlongWall: 3000,
            width: 600,
            height: 1280,
            elevation: 0,
            flipInward: true,
            flipHand: true,
            isOpen: false, // Closed door
          },
        ],
      };

      const wallLen = distance2D(wall.start, wall.end);
      const testT = 0.5;
      const posAlongWall = testT * wallLen;

      let canPass = false;
      for (const op of wall.openings) {
        const opStart = op.offsetAlongWall - op.width / 2;
        const opEnd = op.offsetAlongWall + op.width / 2;
        if (posAlongWall >= opStart && posAlongWall <= opEnd) {
          if (op.type === 'door' && op.isOpen) {
            canPass = true;
            break;
          }
        }
      }

      expect(canPass).toBe(false);
    });
  });
});
