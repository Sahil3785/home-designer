import { describe, it, expect } from 'vitest';
import {
  createStraightKitchen,
  createLShapeKitchen,
  createUShapeKitchen,
  createIslandKitchen,
  computeCountertopAreaSqFt,
  computeKitchenCabinetLinearFeet,
  computeKitchenEstimatedCostINR,
  COUNTERTOP_PRESETS,
  CABINET_FINISH_PRESETS,
} from './kitchen';
import {
  AddKitchenDesignCommand,
  UpdateKitchenDesignCommand,
  DeleteKitchenDesignCommand,
} from '../history/buildingCommands';
import { createDefaultProject } from './defaults';

describe('Modular Kitchen & Cabinetry Engine', () => {
  it('creates a Straight Kitchen layout with cabinets, sink, and cooktop', () => {
    const kitchen = createStraightKitchen('floor_1', { x: 0, y: 0 }, 10);
    expect(kitchen.layoutType).toBe('straight');
    expect(kitchen.cabinets.length).toBeGreaterThanOrEqual(4);
    expect(kitchen.appliances.length).toBeGreaterThanOrEqual(2);

    const hasSink = kitchen.appliances.some((a) => a.type.includes('sink'));
    const hasHob = kitchen.appliances.some((a) => a.type.includes('hob'));
    expect(hasSink).toBe(true);
    expect(hasHob).toBe(true);
  });

  it('creates an L-Shape Kitchen layout with perpendicular runs', () => {
    const lKitchen = createLShapeKitchen('floor_1', { x: 0, y: 0 }, 10, 8);
    expect(lKitchen.layoutType).toBe('l_shape');
    expect(lKitchen.cabinets.length).toBeGreaterThan(6);

    const hasRotatedArm = lKitchen.cabinets.some((c) => c.rotation === 90);
    expect(hasRotatedArm).toBe(true);
  });

  it('creates a U-Shape Kitchen layout with two return arms', () => {
    const uKitchen = createUShapeKitchen('floor_1', { x: 0, y: 0 }, 10, 8, 8);
    expect(uKitchen.layoutType).toBe('u_shape');
    expect(uKitchen.cabinets.length).toBeGreaterThan(8);

    const hasOppositeArm = uKitchen.cabinets.some((c) => c.rotation === -90);
    expect(hasOppositeArm).toBe(true);
  });

  it('creates an Island Kitchen with central breakfast island', () => {
    const islandKitchen = createIslandKitchen('floor_1', { x: 0, y: 0 }, 12, 6);
    expect(islandKitchen.layoutType).toBe('island');

    const islandUnit = islandKitchen.cabinets.find((c) => c.type === 'island_base');
    expect(islandUnit).toBeDefined();
    expect(islandUnit?.drawerCount).toBe(4);
  });

  it('computes accurate countertop square footage and cabinet linear footage', () => {
    const kitchen = createStraightKitchen('floor_1', { x: 0, y: 0 }, 10);
    const sqFt = computeCountertopAreaSqFt(kitchen);
    const linearFt = computeKitchenCabinetLinearFeet(kitchen);

    expect(sqFt).toBeGreaterThan(15);
    expect(linearFt).toBeCloseTo(10, 0);
  });

  it('computes realistic BOQ cost estimates in INR ₹', () => {
    const kitchen = createStraightKitchen('floor_1', { x: 0, y: 0 }, 10);
    const cost = computeKitchenEstimatedCostINR(kitchen);

    expect(cost.cabinetsINR).toBeGreaterThan(15000);
    expect(cost.countertopINR).toBeGreaterThan(5000);
    expect(cost.appliancesINR).toBeGreaterThan(20000);
    expect(cost.totalINR).toBe(cost.cabinetsINR + cost.countertopINR + cost.appliancesINR);
  });

  it('supports undo/redo history commands for adding, updating, and deleting kitchens', () => {
    const project = createDefaultProject();
    const floorId = project.activeFloorId;
    const kitchen = createStraightKitchen(floorId, { x: 100, y: 200 }, 8);

    // 1. Add
    const addCmd = new AddKitchenDesignCommand(floorId, kitchen);
    const proj1 = addCmd.execute(project);
    const floor1 = proj1.floors.find((f) => f.id === floorId);
    expect(floor1?.kitchens?.length).toBe(1);
    expect(floor1?.kitchens?.[0].id).toBe(kitchen.id);

    // 2. Update
    const updatedKitchen = { ...kitchen, name: 'Custom Modern Acrylic Kitchen' };
    const updCmd = new UpdateKitchenDesignCommand(floorId, updatedKitchen);
    const proj2 = updCmd.execute(proj1);
    const floor2 = proj2.floors.find((f) => f.id === floorId);
    expect(floor2?.kitchens?.[0].name).toBe('Custom Modern Acrylic Kitchen');

    // 3. Undo update
    const proj3 = updCmd.undo(proj2);
    const floor3 = proj3.floors.find((f) => f.id === floorId);
    expect(floor3?.kitchens?.[0].name).toBe(kitchen.name);

    // 4. Delete
    const delCmd = new DeleteKitchenDesignCommand(floorId, kitchen.id);
    const proj4 = delCmd.execute(proj3);
    const floor4 = proj4.floors.find((f) => f.id === floorId);
    expect(floor4?.kitchens?.length).toBe(0);

    // 5. Undo delete
    const proj5 = delCmd.undo(proj4);
    const floor5 = proj5.floors.find((f) => f.id === floorId);
    expect(floor5?.kitchens?.length).toBe(1);
  });
});
