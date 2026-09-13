import { describe, it, expect } from 'vitest';
import { parseFloorPlanPrompt, QUICK_TEMPLATES } from './promptParser';
import { generateSmartFloorPlan } from './smartLayoutEngine';
import { GenerateFloorPlanCommand } from '../history/generatorCommands';
import { createDefaultProject } from '../model/defaults';

describe('Smart Floor Plan Assistant & AI Layout Generator (Offline)', () => {
  describe('Natural Language Prompt Parser', () => {
    it('correctly parses plot dimensions and room specifications from natural text', () => {
      const prompt = '3 BHK 35x45 with master bedroom 14x16 in SW with attached toilet, kitchen 10x12 in SE, living room 16x20 in NE';
      const spec = parseFloorPlanPrompt(prompt);

      expect(spec.plotWidthFt).toBe(35);
      expect(spec.plotDepthFt).toBe(45);
      expect(spec.rooms.length).toBeGreaterThanOrEqual(4);

      const living = spec.rooms.find((r) => r.category === 'living');
      expect(living).toBeDefined();
      expect(living?.widthFt).toBe(16);
      expect(living?.depthFt).toBe(20);
      expect(living?.preferredZone).toBe('NE');

      const kitchen = spec.rooms.find((r) => r.category === 'kitchen');
      expect(kitchen).toBeDefined();
      expect(kitchen?.widthFt).toBe(10);
      expect(kitchen?.depthFt).toBe(12);
      expect(kitchen?.preferredZone).toBe('SE');

      const master = spec.rooms.find((r) => r.category === 'master_bedroom');
      expect(master).toBeDefined();
      expect(master?.widthFt).toBe(14);
      expect(master?.depthFt).toBe(16);
      expect(master?.preferredZone).toBe('SW');
    });

    it('identifies Vastu Shastra compliance keywords in instructions', () => {
      const prompt = 'Vastu compliant 2 BHK 30x40 with kitchen in south east and master in south west';
      const spec = parseFloorPlanPrompt(prompt);

      expect(spec.vastuCompliant).toBe(true);
      expect(spec.plotWidthFt).toBe(30);
      expect(spec.plotDepthFt).toBe(40);
    });

    it('provides valid pre-configured quick templates', () => {
      expect(QUICK_TEMPLATES.length).toBeGreaterThanOrEqual(4);
      for (const tmpl of QUICK_TEMPLATES) {
        const spec = parseFloorPlanPrompt(tmpl.prompt);
        expect(spec.rooms.length).toBeGreaterThan(0);
        expect(spec.plotWidthFt).toBeGreaterThan(0);
        expect(spec.plotDepthFt).toBeGreaterThan(0);
      }
    });
  });

  describe('2D/3D Architectural Synthesis Engine', () => {
    it('synthesizes connected walls, rooms, doors, windows, and slabs', () => {
      const spec = parseFloorPlanPrompt('3 BHK 30x40 with master bedroom 12x14 in SW, kitchen 9x11 in SE, living 15x18 in NE');
      const result = generateSmartFloorPlan(spec, 'floor_ground');

      expect(result.floor).toBeDefined();
      expect(result.floor.rooms.length).toBeGreaterThanOrEqual(3);
      expect(result.floor.walls.length).toBeGreaterThan(0);
      expect(result.floor.slabs.length).toBeGreaterThan(0);

      // Verify doors and windows
      expect(result.summary.doorCount).toBeGreaterThan(0);
      expect(result.summary.windowCount).toBeGreaterThan(0);

      // Verify total area
      expect(result.summary.totalAreaSqFt).toBeGreaterThan(300);

      // Verify staged furniture
      expect(result.summary.furnitureCount).toBeGreaterThan(0);
      const beds = result.floor.furniture.filter((f) => f.category === 'bedroom');
      expect(beds.length).toBeGreaterThan(0);
    });

    it('assigns appropriate materials to room floors based on room types', () => {
      const spec = parseFloorPlanPrompt('2 BHK 30x40 with kitchen and bathroom');
      const result = generateSmartFloorPlan(spec, 'floor_ground');

      const kitchen = result.floor.rooms.find((r) => r.name.toLowerCase().includes('kitchen'));
      expect(kitchen?.floorMaterialId).toBe('mat_granite_black');

      const living = result.floor.rooms.find((r) => r.name.toLowerCase().includes('living'));
      expect(living?.floorMaterialId).toBe('mat_chevron_parquet');
    });
  });

  describe('History Command Integration & Undo/Redo', () => {
    it('correctly executes and undoes whole-floor plan generation', () => {
      const project = createDefaultProject();
      const initialRoomCount = project.floors[0].rooms.length;

      const spec = parseFloorPlanPrompt('4 BHK 40x50 luxury villa');
      const result = generateSmartFloorPlan(spec, project.activeFloorId);

      const cmd = new GenerateFloorPlanCommand(result.floor, project.activeFloorId, '4 BHK Villa');

      // Execute
      const modifiedProject = cmd.execute(project);
      expect(modifiedProject.floors[0].rooms.length).toBe(result.floor.rooms.length);
      expect(modifiedProject.floors[0].rooms.length).toBeGreaterThan(initialRoomCount);

      // Undo
      const revertedProject = cmd.undo(modifiedProject);
      expect(revertedProject.floors[0].rooms.length).toBe(initialRoomCount);
    });
  });
});
