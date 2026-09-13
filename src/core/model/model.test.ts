import { describe, it, expect } from 'vitest';
import { createDefaultProject } from './defaults';
import { findJunctions, computeMiteredWallPolygons } from './wallJoin';
import { detectRoomsFromWalls, computePolygonSignedArea, sixteenthsAreaToSquareFeet } from './roomDetection';
import { calculateCADSnap } from './snapping';
import { Wall } from './types';
import { feetInchesToSixteenths, SNAP_PRESETS } from '../units';
import { resizeWall, wallLength } from './geometry';

describe('Wall Joining & Junction Geometry', () => {
  it('identifies 4 corners (junctions) on a rectangular 4-wall perimeter', () => {
    const project = createDefaultProject();
    const floor = project.floors[0];
    const junctions = findJunctions(floor.walls);

    expect(junctions.length).toBe(4);
    for (const j of junctions) {
      expect(j.wallIds.length).toBe(2); // each corner joins 2 walls
    }
  });

  it('computes 4-vertex mitered outline polygons for all walls', () => {
    const project = createDefaultProject();
    const floor = project.floors[0];
    const polygonsMap = computeMiteredWallPolygons(floor);

    expect(polygonsMap.size).toBe(4);
    for (const wall of floor.walls) {
      const poly = polygonsMap.get(wall.id);
      expect(poly).toBeDefined();
      expect(poly?.length).toBe(4);
    }
  });
});

describe('Automatic Room Cycle Detection', () => {
  it('computes signed area of a 24ft x 16ft rectangle correctly', () => {
    const w = feetInchesToSixteenths(24, 0); // 4608
    const h = feetInchesToSixteenths(16, 0); // 3072
    const poly = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];

    const signedArea = computePolygonSignedArea(poly);
    expect(signedArea).toBeGreaterThan(0); // Counter-clockwise = positive
    const sqFt = sixteenthsAreaToSquareFeet(signedArea);
    expect(sqFt).toBe(384); // 24 * 16 = 384 sq ft
  });

  it('detects enclosed room from starter project walls', () => {
    const project = createDefaultProject();
    const floor = project.floors[0];
    const rooms = detectRoomsFromWalls(floor);

    expect(rooms.length).toBe(1);
    expect(rooms[0].computedAreaSqFt).toBe(384);
    expect(rooms[0].wallIds.length).toBe(4);
  });

  it('detects two separate rooms when an interior dividing wall is added', () => {
    const project = createDefaultProject();
    const floor = project.floors[0];

    // Add a center dividing wall splitting 24' into two 12' rooms
    const dividerWall: Wall = {
      id: 'wall_center_divider',
      floorId: floor.id,
      start: { x: 0, y: -1536 },
      end: { x: 0, y: 1536 },
      thickness: 72, // 4 1/2"
      height: 1728,
      openings: [],
    };

    const updatedFloor = {
      ...floor,
      walls: [...floor.walls, dividerWall],
    };

    const rooms = detectRoomsFromWalls(updatedFloor);
    expect(rooms.length).toBe(2);
    // Two 12' x 16' rooms: 192 sq ft each
    expect(rooms[0].computedAreaSqFt).toBe(192);
    expect(rooms[1].computedAreaSqFt).toBe(192);
  });
});

describe('CAD Snapping & Alignment Guidelines', () => {
  it('snaps to exact wall endpoints within snap distance', () => {
    const project = createDefaultProject();
    const wall = project.floors[0].walls[0];

    // Cursor near wall start: distance 50 sixteenths (< 192)
    const cursorNearStart = { x: wall.start.x + 50, y: wall.start.y + 30 };
    const res = calculateCADSnap(cursorNearStart, project.floors[0].walls, SNAP_PRESETS.ONE_INCH, false);

    expect(res.snappedTo).toBe('endpoint');
    expect(res.point.x).toBe(wall.start.x);
    expect(res.point.y).toBe(wall.start.y);
  });

  it('snaps to wall midpoint', () => {
    const project = createDefaultProject();
    const wall = project.floors[0].walls[0];
    const midX = Math.round((wall.start.x + wall.end.x) / 2);
    const midY = Math.round((wall.start.y + wall.end.y) / 2);

    const cursorNearMid = { x: midX + 20, y: midY + 10 };
    const res = calculateCADSnap(cursorNearMid, project.floors[0].walls, SNAP_PRESETS.ONE_INCH, false);

    expect(res.snappedTo).toBe('midpoint');
    expect(res.point.x).toBe(midX);
    expect(res.point.y).toBe(midY);
  });

  it('locks orthogonally (horizontal/vertical) when ortho snap is enabled', () => {
    const startPoint = { x: 0, y: 0 };
    const rawCursor = { x: 1920, y: 150 }; // mostly horizontal, slight y offset

    const res = calculateCADSnap(rawCursor, [], SNAP_PRESETS.ONE_INCH, true, startPoint);
    expect(res.snappedTo).toBe('ortho');
    expect(res.point.y).toBe(0); // Y locked to 0
    expect(res.point.x).toBe(1920);
  });

  it('generates alignment guidelines when cursor aligns with other wall endpoints', () => {
    const project = createDefaultProject();
    const walls = project.floors[0].walls;
    // Cursor aligns in X with wall_south.start.x (-2304)
    const cursor = { x: -2304 + 10, y: 3000 };
    const res = calculateCADSnap(cursor, walls, SNAP_PRESETS.ONE_INCH, false);

    expect(res.guidelines.some((g) => g.type === 'vertical' && g.coordinate === -2304)).toBe(true);
  });
});

describe('Wall Resizing and Direct Length Editing', () => {
  it('resizes wall from start anchor keeping start fixed', () => {
    const wall: Wall = {
      id: 'w1',
      floorId: 'fl1',
      start: { x: 0, y: 0 },
      end: { x: 1920, y: 0 }, // 10' 0" = 1920
      thickness: 144,
      height: 1920,
      openings: [],
    };

    const resized = resizeWall(wall, 2880, 'start'); // 15' 0" = 2880
    expect(resized.start.x).toBe(0);
    expect(resized.start.y).toBe(0);
    expect(resized.end.x).toBe(2880);
    expect(resized.end.y).toBe(0);
    expect(wallLength(resized)).toBe(2880);
  });

  it('resizes wall from midpoint anchor keeping center fixed', () => {
    const wall: Wall = {
      id: 'w1',
      floorId: 'fl1',
      start: { x: 0, y: 0 },
      end: { x: 2000, y: 0 },
      thickness: 144,
      height: 1920,
      openings: [],
    };

    const resized = resizeWall(wall, 3000, 'midpoint');
    // midpoint was (1000, 0), new half len is 1500 -> start: -500, end: 2500
    expect(resized.start.x).toBe(-500);
    expect(resized.end.x).toBe(2500);
    expect(wallLength(resized)).toBe(3000);
  });

  it('clamps openings when wall is shortened', () => {
    const wall: Wall = {
      id: 'w1',
      floorId: 'fl1',
      start: { x: 0, y: 0 },
      end: { x: 2000, y: 0 },
      thickness: 144,
      height: 1920,
      openings: [
        {
          id: 'op1',
          wallId: 'w1',
          name: 'Door',
          type: 'door',
          offsetAlongWall: 1800,
          width: 576,
          height: 1344,
          elevation: 0,
          flipInward: false,
          flipHand: false,
        },
      ],
    };

    // Shorten wall to 1000 -> opening offset should be clamped to max 1000 - 576 = 424
    const resized = resizeWall(wall, 1000, 'start');
    expect(resized.openings[0].offsetAlongWall).toBe(424);
  });
});


