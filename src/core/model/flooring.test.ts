import { describe, it, expect } from 'vitest';
import { DEFAULT_MATERIALS, createDefaultProject } from './defaults';
import { FlooringConfig, Room } from './types';
import { UpdateRoomCommand, HistoryManager } from '../history';

describe('Flooring Architectural System', () => {
  describe('Material Catalog Presets', () => {
    it('contains comprehensive presets for Tiles, Marble, PVC/Vinyl, and Matte Concrete', () => {
      const categories = new Set(DEFAULT_MATERIALS.map((m) => m.category));
      expect(categories.has('tile')).toBe(true);
      expect(categories.has('marble')).toBe(true);
      expect(categories.has('pvc')).toBe(true);
      expect(categories.has('concrete')).toBe(true);
    });

    it('has tile presets with realistic physical properties and dimensions', () => {
      const tilePresets = DEFAULT_MATERIALS.filter((m) => m.category === 'tile');
      expect(tilePresets.length).toBeGreaterThanOrEqual(4);

      const largeFormat = tilePresets.find((t) => t.id === 'mat_tile_vitrified_large');
      expect(largeFormat).toBeDefined();
      expect(largeFormat?.roughness).toBeLessThan(0.3); // Polished/semi-gloss vitrified tile
      expect(largeFormat?.metalness).toBeGreaterThanOrEqual(0);

      const terrazzo = DEFAULT_MATERIALS.find((t) => t.id === 'mat_terrazzo_polished');
      expect(terrazzo).toBeDefined();

      const moroccan = tilePresets.find((t) => t.id === 'mat_tile_moroccan_encaustic');
      expect(moroccan).toBeDefined();
    });

    it('has luxury Italian and exotic marble presets with high specular polish', () => {
      const marbles = DEFAULT_MATERIALS.filter((m) => m.category === 'marble');
      expect(marbles.length).toBeGreaterThanOrEqual(3);

      const carrara = marbles.find((m) => m.id === 'mat_marble_carrara');
      expect(carrara).toBeDefined();
      expect(carrara?.roughness).toBeLessThanOrEqual(0.18); // Highly polished marble
      expect(carrara?.metalness).toBeGreaterThanOrEqual(0.08);

      const nero = marbles.find((m) => m.id === 'mat_marble_marquina');
      expect(nero).toBeDefined();
    });

    it('has luxury PVC and SPC rigid core vinyl flooring presets', () => {
      const pvcPresets = DEFAULT_MATERIALS.filter((m) => m.category === 'pvc');
      expect(pvcPresets.length).toBeGreaterThanOrEqual(3);

      const lvt = pvcPresets.find((p) => p.id === 'mat_pvc_lvt_plank');
      expect(lvt).toBeDefined();
      expect(lvt?.roughness).toBeGreaterThan(0.5); // Textured synthetic vinyl plank

      const spc = pvcPresets.find((p) => p.id === 'mat_pvc_spc_honey');
      expect(spc).toBeDefined();
    });

    it('has ultra-matte concrete and microcement architectural finishes', () => {
      const concretePresets = DEFAULT_MATERIALS.filter((m) => m.category === 'concrete');
      expect(concretePresets.length).toBeGreaterThanOrEqual(2);

      const microcement = concretePresets.find((m) => m.id === 'mat_concrete_microcement');
      expect(microcement).toBeDefined();
      expect(microcement?.roughness).toBeGreaterThanOrEqual(0.85); // Ultra-matte non-reflective
    });
  });

  describe('Room Flooring Configuration and History Commands', () => {
    it('updates a room with customized flooring config and records undo/redo', () => {
      const project = createDefaultProject();
      const floor = project.floors[0];
      const room = floor.rooms[0];
      expect(room).toBeDefined();

      const customConfig: FlooringConfig = {
        tileSizeInches: 32,
        jointPattern: 'staggered',
        sheen: 'matte',
        groutColor: 'charcoal',
        groutWidthMm: 2,
        roughness: 0.88,
      };

      const updatedRoom: Room = {
        ...room,
        floorMaterialId: 'mat_tile_vitrified_large',
        flooringConfig: customConfig,
      };

      const history = new HistoryManager(project);
      const cmd = new UpdateRoomCommand(floor.id, updatedRoom);
      history.execute(cmd);

      const modified = history.getProject();
      const targetRoom = modified.floors[0].rooms.find((r) => r.id === room.id);
      expect(targetRoom?.floorMaterialId).toBe('mat_tile_vitrified_large');
      expect(targetRoom?.flooringConfig?.tileSizeInches).toBe(32);
      expect(targetRoom?.flooringConfig?.jointPattern).toBe('staggered');
      expect(targetRoom?.flooringConfig?.groutColor).toBe('charcoal');

      // Test Undo
      history.undo();
      const reverted = history.getProject();
      const revertedRoom = reverted.floors[0].rooms.find((r) => r.id === room.id);
      expect(revertedRoom?.floorMaterialId).toBe(room.floorMaterialId);
      expect(revertedRoom?.flooringConfig).toBeUndefined();

      // Test Redo
      history.redo();
      const redone = history.getProject();
      const redoneRoom = redone.floors[0].rooms.find((r) => r.id === room.id);
      expect(redoneRoom?.floorMaterialId).toBe('mat_tile_vitrified_large');
      expect(redoneRoom?.flooringConfig?.tileSizeInches).toBe(32);
    });

    it('batch applies flooring to all rooms on a floor level', () => {
      const project = createDefaultProject();
      const floor = project.floors[0];
      expect(floor.rooms.length).toBeGreaterThan(0);

      const batchMaterialId = 'mat_marble_carrara';
      const batchConfig: FlooringConfig = {
        tileSizeInches: 48,
        jointPattern: 'grid',
        sheen: 'glossy',
        groutColor: 'light',
      };

      const history = new HistoryManager(project);
      floor.rooms.forEach((r) => {
        history.execute(
          new UpdateRoomCommand(floor.id, {
            ...r,
            floorMaterialId: batchMaterialId,
            flooringConfig: batchConfig,
          })
        );
      });

      const finalProject = history.getProject();
      const updatedFloor = finalProject.floors.find((f) => f.id === floor.id)!;
      for (const rm of updatedFloor.rooms) {
        expect(rm.floorMaterialId).toBe('mat_marble_carrara');
        expect(rm.flooringConfig?.sheen).toBe('glossy');
        expect(rm.flooringConfig?.tileSizeInches).toBe(48);
      }
    });
  });

  describe('Flooring Area, Wastage & Budget Takeoff Calculations', () => {
    it('accurately computes gross area with 10% cutting wastage', () => {
      const roomAreaSqFt = 200; // 200 sq ft
      const wastagePct = 10;
      const grossAreaSqFt = roomAreaSqFt * (1 + wastagePct / 100);
      expect(grossAreaSqFt).toBeCloseTo(220, 2);

      // 24" x 24" tile = 4 sq ft per tile
      const tileSizeInches = 24;
      const tileAreaSqFt = (tileSizeInches * tileSizeInches) / 144;
      expect(tileAreaSqFt).toBe(4);

      const tilesNeeded = Math.ceil(Math.round(grossAreaSqFt) / tileAreaSqFt);
      expect(tilesNeeded).toBe(55);

      // Cost calculation with $8.50 / sq ft
      const ratePerSqFt = 8.5;
      const totalCost = Math.round(grossAreaSqFt * ratePerSqFt);
      expect(totalCost).toBe(1870);
    });
  });

  describe('Robust Room Detection and Flooring Preservation', () => {
    it('detects room even when wall corners have offsets/misalignments', async () => {
      const { detectRoomsFromWalls } = await import('./roomDetection');
      const testFloor = {
        id: 'floor_test',
        levelIndex: 0,
        name: 'Ground Floor',
        elevation: 0,
        height: 1920,
        ceilingHeight: 1920,
        defaultWallThickness: 96,
        slabThickness: 192,
        slabs: [],
        furniture: [],
        floorMaterialId: 'mat_tile_vitrified_large',
        flooringConfig: {
          tileSizeInches: 24,
          tilePattern: 'staggered' as const,
          finishSheen: 'glossy' as const,
          groutColor: '#cbd5e1',
        },
        walls: [
          // North wall: (0, 1920) to (3840, 1920)
          { id: 'w1', floorId: 'floor_test', start: { x: 0, y: 1920 }, end: { x: 3840, y: 1920 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
          // East wall: (3840, 1920 + 80) to (3840, 0) -- offset by 5 inches (80 sixteenths)
          { id: 'w2', floorId: 'floor_test', start: { x: 3840, y: 2000 }, end: { x: 3840, y: 0 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
          // South wall: (3840, 0) to (0, 0)
          { id: 'w3', floorId: 'floor_test', start: { x: 3840, y: 0 }, end: { x: 0, y: 0 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
          // West wall: (0, 0) to (0, 1920)
          { id: 'w4', floorId: 'floor_test', start: { x: 0, y: 0 }, end: { x: 0, y: 1920 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
        ],
        rooms: [],
      };

      const rooms = detectRoomsFromWalls(testFloor);
      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms[0].polygon.length).toBeGreaterThanOrEqual(3);
      expect(rooms[0].floorMaterialId).toBe('mat_tile_vitrified_large');
      expect(rooms[0].flooringConfig?.tilePattern).toBe('staggered');
    });

    it('preserves existing room flooring config across room detection cycles', async () => {
      const { detectRoomsFromWalls } = await import('./roomDetection');
      const testFloor = {
        id: 'floor_test2',
        levelIndex: 0,
        name: 'Ground Floor',
        elevation: 0,
        height: 1920,
        ceilingHeight: 1920,
        defaultWallThickness: 96,
        slabThickness: 192,
        slabs: [],
        furniture: [],
        walls: [
          { id: 'w1', floorId: 'floor_test2', start: { x: 0, y: 1920 }, end: { x: 1920, y: 1920 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
          { id: 'w2', floorId: 'floor_test2', start: { x: 1920, y: 1920 }, end: { x: 1920, y: 0 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
          { id: 'w3', floorId: 'floor_test2', start: { x: 1920, y: 0 }, end: { x: 0, y: 0 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
          { id: 'w4', floorId: 'floor_test2', start: { x: 0, y: 0 }, end: { x: 0, y: 1920 }, thickness: 96, height: 1920, interiorSide: 'left' as const, openings: [] },
        ],
        rooms: [
          {
            id: 'room_custom',
            floorId: 'floor_test2',
            name: 'Master Suite',
            wallIds: ['w1', 'w2', 'w3', 'w4'],
            polygon: [{ x: 0, y: 0 }, { x: 1920, y: 0 }, { x: 1920, y: 1920 }, { x: 0, y: 1920 }],
            floorMaterialId: 'mat_marble_carrara',
            flooringConfig: {
              tileSizeInches: 36,
              tilePattern: 'grid' as const,
              finishSheen: 'glossy' as const,
              groutColor: '#ffffff',
            },
          },
        ],
      };

      const detected = detectRoomsFromWalls(testFloor);
      expect(detected.length).toBe(1);
      expect(detected[0].floorMaterialId).toBe('mat_marble_carrara');
      expect(detected[0].flooringConfig?.tileSizeInches).toBe(36);
    });
  });
});
