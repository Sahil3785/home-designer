import { describe, it, expect } from 'vitest';
import {
  createDefaultReferencePlan,
  calibrateReferencePlan,
  getPointDistance,
  worldToImagePixel,
  imagePixelToWorld,
} from './referencePlan';
import {
  createFurnitureInstance,
  getFurnitureFootprint,
  isPointInsideFurniture,
  FURNITURE_CATALOG,
} from './furniture';
import {
  SetReferencePlanCommand,
  UpdateReferencePlanCommand,
  RemoveReferencePlanCommand,
  AddFurnitureCommand,
  UpdateFurnitureCommand,
  DeleteFurnitureCommand,
} from '../history/buildingCommands';
import { createDefaultProject } from './defaults';
import { feetInchesToSixteenths } from '../units';

describe('Reference Plan & Scale Calibration', () => {
  it('creates default reference plan centered around origin', () => {
    const plan = createDefaultReferencePlan(
      'floor_ground',
      'indian_floor_plan_22x45.png',
      'data:image/png;base64,sample',
      1200,
      2400
    );

    expect(plan.fileName).toBe('indian_floor_plan_22x45.png');
    expect(plan.naturalWidth).toBe(1200);
    expect(plan.naturalHeight).toBe(2400);
    expect(plan.isCalibrated).toBe(false);
    expect(plan.isVisible).toBe(true);
    expect(plan.isLocked).toBe(false);
    expect(plan.opacity).toBe(0.6);
    expect(plan.width).toBe(1200 * 16);
    expect(plan.height).toBe(2400 * 16);
    expect(plan.x).toBe(-Math.round(plan.width / 2));
  });

  it('calibrates reference plan using 2 points and a known dimension (22\' 0")', () => {
    const initialPlan = createDefaultReferencePlan(
      'floor_ground',
      'sample.jpg',
      'data:image/jpeg;base64,sample',
      1000,
      2000
    );

    // Initial scale is 16 sixteenths per pixel.
    // Let's say user picks 2 points corresponding to 500 pixels on image.
    // In CAD units with scale 16, 500 pixels is 8000 sixteenths.
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 8000, y: 0 };

    // Known dimension from drawing is 22' 0" = 4224 sixteenths
    const knownWidth = feetInchesToSixteenths(22, 0); // 4224
    const calibrated = calibrateReferencePlan(initialPlan, p1, p2, knownWidth);

    expect(calibrated.isCalibrated).toBe(true);
    // pixel distance = 8000 / 16 = 500 px.
    // new scale = 4224 / 500 = 8.448 sixteenths/px.
    expect(calibrated.scale).toBeCloseTo(4224 / 500, 3);
    expect(calibrated.width).toBe(Math.round(1000 * (4224 / 500)));
    expect(calibrated.height).toBe(Math.round(2000 * (4224 / 500)));
  });

  it('converts world coordinates to image pixels and back accurately', () => {
    const plan = createDefaultReferencePlan(
      'floor_ground',
      'plan.png',
      'data:image/png;base64,test',
      800,
      600
    );

    // Top-left of plan
    const topLeft = { x: plan.x, y: plan.y };
    const pxTopLeft = worldToImagePixel(topLeft, plan);
    expect(pxTopLeft.x).toBeCloseTo(0, 1);
    expect(pxTopLeft.y).toBeCloseTo(0, 1);

    // Center of plan
    const centerPoint = {
      x: plan.x + Math.round(plan.width / 2),
      y: plan.y - Math.round(plan.height / 2),
    };
    const pxCenter = worldToImagePixel(centerPoint, plan);
    expect(pxCenter.x).toBeCloseTo(400, 1);
    expect(pxCenter.y).toBeCloseTo(300, 1);

    // Invert back to world
    const worldInverted = imagePixelToWorld(pxCenter, plan);
    expect(worldInverted.x).toBe(centerPoint.x);
    expect(worldInverted.y).toBe(centerPoint.y);
  });

  it('reversibly executes SetReferencePlanCommand, UpdateReferencePlanCommand, and RemoveReferencePlanCommand', () => {
    const project = createDefaultProject();
    const floorId = project.floors[0].id;
    const plan = createDefaultReferencePlan(floorId, 'trace.png', 'data:url', 500, 500);

    // Set command
    const setCmd = new SetReferencePlanCommand(floorId, plan);
    const withPlan = setCmd.execute(project);
    expect(withPlan.floors[0].referencePlan?.fileName).toBe('trace.png');

    // Update command (e.g. lock and change opacity)
    const updCmd = new UpdateReferencePlanCommand(floorId, { opacity: 0.35, isLocked: true });
    const updated = updCmd.execute(withPlan);
    expect(updated.floors[0].referencePlan?.opacity).toBe(0.35);
    expect(updated.floors[0].referencePlan?.isLocked).toBe(true);

    // Undo update
    const unUpdated = updCmd.undo(updated);
    expect(unUpdated.floors[0].referencePlan?.opacity).toBe(0.6);
    expect(unUpdated.floors[0].referencePlan?.isLocked).toBe(false);

    // Remove command
    const remCmd = new RemoveReferencePlanCommand(floorId);
    const removed = remCmd.execute(withPlan);
    expect(removed.floors[0].referencePlan).toBeUndefined();

    // Undo remove
    const unRemoved = remCmd.undo(removed);
    expect(unRemoved.floors[0].referencePlan?.fileName).toBe('trace.png');

    // Undo set
    const undone = setCmd.undo(unRemoved);
    expect(undone.floors[0].referencePlan).toBeUndefined();
  });
});

describe('Residential Furniture & Wardrobes', () => {
  it('instantiates catalog furniture with correct architectural dimensions in feet and inches', () => {
    const wardrobeItem = FURNITURE_CATALOG.find((c) => c.id === 'wardrobe_built_in');
    expect(wardrobeItem).toBeDefined();
    expect(wardrobeItem?.defaultDimensions.width).toBe(feetInchesToSixteenths(6, 0)); // 6' 0" = 1152
    expect(wardrobeItem?.defaultDimensions.depth).toBe(feetInchesToSixteenths(2, 0)); // 2' 0" = 384
    expect(wardrobeItem?.defaultDimensions.height).toBe(feetInchesToSixteenths(7, 0)); // 7' 0" = 1344

    const instance = createFurnitureInstance('wardrobe_built_in', 'floor_ground', { x: 100, y: 200 });
    expect(instance.catalogId).toBe('wardrobe_built_in');
    expect(instance.position.x).toBe(100);
    expect(instance.position.y).toBe(200);
    expect(instance.dimensions.depth).toBe(384);
  });

  it('computes 4-corner footprint and tests point-in-furniture containment with rotation', () => {
    const bed = createFurnitureInstance('bed_queen', 'floor_ground', { x: 500, y: 500 }, 0, 0);
    const corners = getFurnitureFootprint(bed);
    expect(corners.length).toBe(4);

    // Inside center
    expect(isPointInsideFurniture({ x: 500, y: 500 }, bed)).toBe(true);
    // Well outside
    expect(isPointInsideFurniture({ x: 1500, y: 500 }, bed)).toBe(false);

    // Test with 90 degree rotation (PI / 2)
    const bedRotated = { ...bed, rotation: Math.PI / 2 };
    expect(isPointInsideFurniture({ x: 500, y: 500 }, bedRotated)).toBe(true);
  });

  it('reversibly executes AddFurnitureCommand, UpdateFurnitureCommand, and DeleteFurnitureCommand', () => {
    const project = createDefaultProject();
    const floorId = project.floors[0].id;
    const sofa = createFurnitureInstance('sofa_3_seater', floorId, { x: 0, y: 0 });

    const addCmd = new AddFurnitureCommand(floorId, sofa);
    const withSofa = addCmd.execute(project);
    expect(withSofa.floors[0].furniture.length).toBe(1);
    expect(withSofa.floors[0].furniture[0].name).toBe('3-Seater Sofa');

    const updCmd = new UpdateFurnitureCommand(floorId, sofa.id, {
      position: { x: 100, y: 200, z: 0 },
      rotation: Math.PI / 4,
    });
    const updated = updCmd.execute(withSofa);
    expect(updated.floors[0].furniture[0].position.x).toBe(100);
    expect(updated.floors[0].furniture[0].rotation).toBeCloseTo(Math.PI / 4, 3);

    const unUpdated = updCmd.undo(updated);
    expect(unUpdated.floors[0].furniture[0].position.x).toBe(0);

    const delCmd = new DeleteFurnitureCommand(floorId, sofa.id);
    const deleted = delCmd.execute(withSofa);
    expect(deleted.floors[0].furniture.length).toBe(0);

    const unDeleted = delCmd.undo(deleted);
    expect(unDeleted.floors[0].furniture.length).toBe(1);

    const undone = addCmd.undo(unDeleted);
    expect(undone.floors[0].furniture.length).toBe(0);
  });

  it('instantiates all items in FURNITURE_CATALOG with their distinct dimensions and names', () => {
    expect(FURNITURE_CATALOG.length).toBeGreaterThanOrEqual(12);

    for (const catItem of FURNITURE_CATALOG) {
      const instance = createFurnitureInstance(catItem.id, 'floor_ground', { x: 50, y: 50 });
      expect(instance.catalogId).toBe(catItem.id);
      expect(instance.name).toBe(catItem.name);
      expect(instance.category).toBe(catItem.category);
      expect(instance.dimensions.width).toBe(catItem.defaultDimensions.width);
      expect(instance.dimensions.depth).toBe(catItem.defaultDimensions.depth);
      expect(instance.dimensions.height).toBe(catItem.defaultDimensions.height);
      expect(instance.floorId).toBe('floor_ground');
    }

    // Explicit check for user reported items:
    const parking = createFurnitureInstance('porch_car', 'floor_ground', { x: 0, y: 0 });
    expect(parking.name).toBe('Car Parking Space Marker');
    expect(parking.dimensions.width).toBe(feetInchesToSixteenths(8, 0));
    expect(parking.dimensions.depth).toBe(feetInchesToSixteenths(15, 0));

    const dining = createFurnitureInstance('dining_6_seater', 'floor_ground', { x: 0, y: 0 });
    expect(dining.name).toBe('6-Seater Dining Set');

    const gate = createFurnitureInstance('entry_gate', 'floor_ground', { x: 0, y: 0 });
    expect(gate.name).toBe('Main Entry Gate');
    expect(gate.dimensions.width).toBe(feetInchesToSixteenths(10, 0));
  });

  it('gracefully handles transposed catalogId and floorId arguments without falling back to wardrobe', () => {
    // If floorId and catalogId were swapped:
    const parkingTransposed = createFurnitureInstance('floor_1', 'porch_car', { x: 100, y: 100 });
    expect(parkingTransposed.catalogId).toBe('porch_car');
    expect(parkingTransposed.floorId).toBe('floor_1');
    expect(parkingTransposed.name).toBe('Car Parking Space Marker');

    const diningTransposed = createFurnitureInstance('floor_1', 'dining_6_seater', { x: 100, y: 100 });
    expect(diningTransposed.catalogId).toBe('dining_6_seater');
    expect(diningTransposed.floorId).toBe('floor_1');
    expect(diningTransposed.name).toBe('6-Seater Dining Set');
  });
});
