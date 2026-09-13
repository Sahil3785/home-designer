import { describe, it, expect } from 'vitest';
import {
  MEP_CATALOG,
  createDefaultMepSymbol,
  calculateMepTakeoff,
} from './mep';
import {
  AddSymbolCommand,
  UpdateSymbolCommand,
  DeleteSymbolCommand,
  UpdateOpeningCommand,
} from '../history/buildingCommands';
import { createDefaultProject } from './defaults';
import { ArchitecturalSymbol, SymbolType } from './types';
import { feetInchesToSixteenths } from '../units';

describe('Phase 5 — MEP Architectural Rough-In & 3D Interactive Features', () => {
  describe('MEP Catalog & Defaults', () => {
    it('contains all 9 required MEP architectural fixtures across electrical, lighting, plumbing, and hvac', () => {
      const types: SymbolType[] = [
        'light_point',
        'fan_point',
        'switchboard',
        'socket_outlet',
        'ac_indoor',
        'db_board',
        'water_tap',
        'geyser',
        'drain_point',
      ];

      expect(MEP_CATALOG.length).toBe(9);

      for (const type of types) {
        const def = MEP_CATALOG.find((c) => c.type === type);
        expect(def).toBeDefined();
        expect(def!.name.length).toBeGreaterThan(0);
        expect(def!.defaultElevation).toBeGreaterThanOrEqual(0);
        expect(def!.defaultWattage).toBeGreaterThanOrEqual(0);
        expect(['electrical', 'lighting', 'plumbing', 'hvac']).toContain(def!.category);
      }
    });

    it('creates default MEP symbol with valid coordinates, rotation, elevation, and wattage', () => {
      const sym = createDefaultMepSymbol('switchboard', 'floor_1', { x: 384, y: 768 }, 90);
      expect(sym.id).toMatch(/^sym_/);
      expect(sym.type).toBe('switchboard');
      expect(sym.floorId).toBe('floor_1');
      expect(sym.name).toBe('Modular Switchboard');
      expect(sym.category).toBe('electrical');
      expect(sym.position).toEqual({ x: 384, y: 768 });
      expect(sym.rotation).toBe(90);
      expect(sym.elevation).toBe(feetInchesToSixteenths(4, 0));
      expect(sym.wattage).toBe(50);
    });
  });

  describe('MEP Electrical Load & Takeoff Engine', () => {
    it('handles empty symbols gracefully', () => {
      const takeoff = calculateMepTakeoff([]);
      expect(takeoff.totalPoints).toBe(0);
      expect(takeoff.totalWattage).toBe(0);
      expect(takeoff.totalKw).toBe(0);
      expect(takeoff.recommendedSanctionedLoadKw).toBe(3.0); // minimum 3kW residential sanctioned load
      expect(takeoff.recommendedSupply).toBe('Single-Phase (230V)');
      expect(takeoff.itemized.length).toBe(0);
    });

    it('calculates connected and sanctioned load with 0.7 diversity factor', () => {
      const symbols: ArchitecturalSymbol[] = [
        createDefaultMepSymbol('light_point', 'floor_1', { x: 0, y: 0 }), // 18W
        createDefaultMepSymbol('light_point', 'floor_1', { x: 10, y: 0 }), // 18W
        createDefaultMepSymbol('fan_point', 'floor_1', { x: 20, y: 0 }), // 65W
        createDefaultMepSymbol('socket_outlet', 'floor_1', { x: 30, y: 0 }), // 200W
        createDefaultMepSymbol('geyser', 'floor_1', { x: 40, y: 0 }), // 2000W
      ];

      // Total watts: 18 + 18 + 65 + 200 + 2000 = 2301W = 2.3 kW connected
      // Diversified (70%): 2301 * 0.7 = 1610.7W = 1.6 kW -> clamped to min 3kW
      const takeoff = calculateMepTakeoff(symbols);
      expect(takeoff.totalPoints).toBe(5);
      expect(takeoff.totalWattage).toBe(2301);
      expect(takeoff.totalKw).toBe(2.3);
      expect(takeoff.recommendedSanctionedLoadKw).toBe(3.0);
      expect(takeoff.recommendedSupply).toBe('Single-Phase (230V)');

      // Verify itemized schedule breakdown
      const lightItem = takeoff.itemized.find((i) => i.type === 'light_point');
      expect(lightItem).toBeDefined();
      expect(lightItem?.count).toBe(2);
      expect(lightItem?.totalWatts).toBe(36);

      const fanItem = takeoff.itemized.find((i) => i.type === 'fan_point');
      expect(fanItem?.count).toBe(1);
      expect(fanItem?.totalWatts).toBe(65);
    });

    it('recommends Three-Phase 415V when sanctioned electrical load exceeds 7 kW', () => {
      // Create high-demand loads: 8 heavy AC units (8 * 1500W = 12000W)
      const symbols: ArchitecturalSymbol[] = [];
      for (let i = 0; i < 8; i++) {
        symbols.push(createDefaultMepSymbol('ac_indoor', 'floor_1', { x: i * 100, y: 0 }));
      }
      // 12000W * 0.7 = 8400W = 8.4 kW diversified -> recommendedSanctionedLoadKw = 9 kW > 7 kW
      const takeoff = calculateMepTakeoff(symbols);
      expect(takeoff.totalWattage).toBe(12000);
      expect(takeoff.totalKw).toBe(12.0);
      expect(takeoff.recommendedSanctionedLoadKw).toBe(9);
      expect(takeoff.recommendedSupply).toBe('Three-Phase (415V)');
    });
  });

  describe('MEP History Commands (Undo / Redo)', () => {
    it('executes AddSymbolCommand and undoes cleanly', () => {
      const proj = createDefaultProject();
      const floorId = proj.activeFloorId;
      const initialCount = proj.floors[0].symbols?.length || 0;

      const sym = createDefaultMepSymbol('fan_point', floorId, { x: 500, y: 500 });
      const addCmd = new AddSymbolCommand(floorId, sym);

      // Execute
      const state1 = addCmd.execute(proj);
      const floor1 = state1.floors.find((f) => f.id === floorId)!;
      expect(floor1.symbols?.length).toBe(initialCount + 1);
      expect(floor1.symbols?.find((s) => s.id === sym.id)).toBeDefined();

      // Undo
      const state2 = addCmd.undo(state1);
      const floor2 = state2.floors.find((f) => f.id === floorId)!;
      expect(floor2.symbols?.length).toBe(initialCount);
      expect(floor2.symbols?.find((s) => s.id === sym.id)).toBeUndefined();
    });

    it('executes UpdateSymbolCommand to modify rotation, height, and circuit', () => {
      const proj = createDefaultProject();
      const floorId = proj.activeFloorId;
      const sym = createDefaultMepSymbol('socket_outlet', floorId, { x: 200, y: 300 });

      // Add symbol first
      const state1 = new AddSymbolCommand(floorId, sym).execute(proj);

      // Update symbol
      const updatedSym: ArchitecturalSymbol = {
        ...sym,
        rotation: 180,
        elevation: feetInchesToSixteenths(3, 0),
        circuit: 'CKT-PWR-2',
        wattage: 2000,
      };
      const updateCmd = new UpdateSymbolCommand(floorId, updatedSym);
      const state2 = updateCmd.execute(state1);
      const floor2 = state2.floors.find((f) => f.id === floorId)!;
      const found2 = floor2.symbols?.find((s) => s.id === sym.id)!;
      expect(found2.rotation).toBe(180);
      expect(found2.elevation).toBe(feetInchesToSixteenths(3, 0));
      expect(found2.circuit).toBe('CKT-PWR-2');
      expect(found2.wattage).toBe(2000);

      // Undo update
      const state3 = updateCmd.undo(state2);
      const floor3 = state3.floors.find((f) => f.id === floorId)!;
      const found3 = floor3.symbols?.find((s) => s.id === sym.id)!;
      expect(found3.rotation).toBe(0);
      expect(found3.elevation).toBe(sym.elevation);
      expect(found3.wattage).toBe(200);
    });

    it('executes DeleteSymbolCommand and undo restores the symbol', () => {
      const proj = createDefaultProject();
      const floorId = proj.activeFloorId;
      const sym = createDefaultMepSymbol('water_tap', floorId, { x: 100, y: 200 });

      const state1 = new AddSymbolCommand(floorId, sym).execute(proj);
      const deleteCmd = new DeleteSymbolCommand(floorId, sym.id);

      // Delete
      const state2 = deleteCmd.execute(state1);
      const floor2 = state2.floors.find((f) => f.id === floorId)!;
      expect(floor2.symbols?.find((s) => s.id === sym.id)).toBeUndefined();

      // Undo
      const state3 = deleteCmd.undo(state2);
      const floor3 = state3.floors.find((f) => f.id === floorId)!;
      expect(floor3.symbols?.find((s) => s.id === sym.id)).toBeDefined();
      expect(floor3.symbols?.find((s) => s.id === sym.id)?.type).toBe('water_tap');
    });
  });

  describe('3D Interactive Door Leaf Swing (isOpen)', () => {
    it('supports toggling isOpen state on wall openings with undo support', () => {
      const proj = createDefaultProject();
      const floor = proj.floors[0];
      const wall = floor.walls[0];
      expect(wall.openings.length).toBeGreaterThan(0);

      const door = wall.openings.find((o) => o.type === 'door')!;
      expect(door).toBeDefined();
      expect(door.isOpen).toBeFalsy();

      // Toggle to open
      const openDoor = { ...door, isOpen: true };
      const toggleCmd = new UpdateOpeningCommand(floor.id, wall.id, openDoor);
      const state1 = toggleCmd.execute(proj);
      const updatedWall1 = state1.floors[0].walls.find((w) => w.id === wall.id)!;
      const updatedDoor1 = updatedWall1.openings.find((o) => o.id === door.id)!;
      expect(updatedDoor1.isOpen).toBe(true);

      // Undo toggle
      const state2 = toggleCmd.undo(state1);
      const updatedWall2 = state2.floors[0].walls.find((w) => w.id === wall.id)!;
      const updatedDoor2 = updatedWall2.openings.find((o) => o.id === door.id)!;
      expect(updatedDoor2.isOpen).toBeFalsy();
    });
  });

  describe('Project Settings Defaults for Phase 5', () => {
    it('initializes with showMepLayer and sunTimeHours in defaults', () => {
      const proj = createDefaultProject();
      expect(proj.settings.showMepLayer).toBe(true);
      expect(proj.settings.sunTimeHours).toBe(14.5);
      expect(proj.floors[0].symbols).toEqual([]);
    });
  });
});
