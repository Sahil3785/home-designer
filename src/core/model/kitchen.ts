import { Point2D } from './types';
import { Sixteenths, SIXTEENTHS_PER_FOOT, SIXTEENTHS_PER_INCH } from '../units';

export type KitchenLayoutType = 'straight' | 'l_shape' | 'u_shape' | 'parallel' | 'island';

export type CabinetUnitType =
  | 'base_cabinet'
  | 'base_drawers'
  | 'base_sink_unit'
  | 'base_corner'
  | 'wall_cabinet'
  | 'wall_corner'
  | 'tall_pantry'
  | 'island_base';

export type CountertopMaterial =
  | 'granite_black_galaxy'
  | 'quartz_calacatta_white'
  | 'marble_statuary'
  | 'wood_butcher_block'
  | 'concrete_matte';

export type CountertopEdge = 'square' | 'beveled' | 'bullnose' | 'waterfall';

export type CabinetFinish =
  | 'acrylic_white_gloss'
  | 'matte_slate_grey'
  | 'natural_oak_grain'
  | 'deep_navy_blue'
  | 'sage_green_matte';

export type ShutterStyle = 'slab' | 'shaker_5piece' | 'fluted_grooved' | 'handleless_j_pull';

export type HandleStyle =
  | 'brushed_brass_bar'
  | 'matte_black_pull'
  | 'stainless_steel_t'
  | 'integrated_j_channel';

export interface KitchenCabinetUnit {
  id: string;
  type: CabinetUnitType;
  name: string;
  width: Sixteenths;
  depth: Sixteenths;
  height: Sixteenths;
  elevation: Sixteenths;
  position: Point2D; // Relative to kitchen origin
  rotation: number;   // Degrees
  doorCount?: number;
  drawerCount?: number;
}

export interface KitchenAppliance {
  id: string;
  type:
    | 'chimney_hood'
    | 'hob_gas_4burner'
    | 'hob_induction'
    | 'sink_undermount_single'
    | 'sink_undermount_double'
    | 'built_in_oven'
    | 'built_in_microwave'
    | 'refrigerator';
  name: string;
  position: Point2D;
  elevation: Sixteenths;
  width: Sixteenths;
  depth: Sixteenths;
  height: Sixteenths;
  rotation: number;
}

export interface KitchenDesign {
  id: string;
  floorId: string;
  roomId?: string;
  name: string;
  layoutType: KitchenLayoutType;
  position: Point2D; // World position on floor
  rotation: number;  // Degrees
  cabinetFinish: CabinetFinish;
  shutterStyle: ShutterStyle;
  handleStyle: HandleStyle;
  countertopMaterial: CountertopMaterial;
  countertopEdge: CountertopEdge;
  countertopThicknessInches: number;
  countertopOverhangInches?: number;
  hasUnderCabinetLighting: boolean;
  backsplashHeightInches: number;
  cabinets: KitchenCabinetUnit[];
  appliances: KitchenAppliance[];
}

export const COUNTERTOP_PRESETS: Record<
  CountertopMaterial,
  { name: string; color: string; roughness: number; metalness: number; costPerSqFtINR: number }
> = {
  granite_black_galaxy: {
    name: 'Black Galaxy Granite (Polished)',
    color: '#18181b',
    roughness: 0.15,
    metalness: 0.2,
    costPerSqFtINR: 380,
  },
  quartz_calacatta_white: {
    name: 'Calacatta Gold Quartz (Seamless)',
    color: '#f8fafc',
    roughness: 0.1,
    metalness: 0.05,
    costPerSqFtINR: 520,
  },
  marble_statuary: {
    name: 'Italian Statuary Marble',
    color: '#e2e8f0',
    roughness: 0.18,
    metalness: 0.08,
    costPerSqFtINR: 650,
  },
  wood_butcher_block: {
    name: 'Natural Oiled Oak Butcher Block',
    color: '#b45309',
    roughness: 0.55,
    metalness: 0.0,
    costPerSqFtINR: 280,
  },
  concrete_matte: {
    name: 'Architectural Cast Concrete',
    color: '#94a3b8',
    roughness: 0.7,
    metalness: 0.02,
    costPerSqFtINR: 320,
  },
};

export const CABINET_FINISH_PRESETS: Record<
  CabinetFinish,
  { name: string; color: string; roughness: number; metalness: number; costPerRftINR: number }
> = {
  acrylic_white_gloss: {
    name: 'Ultra High-Gloss Acrylic White',
    color: '#ffffff',
    roughness: 0.08,
    metalness: 0.1,
    costPerRftINR: 2400,
  },
  matte_slate_grey: {
    name: 'Anti-Fingerprint Matte Slate Grey',
    color: '#334155',
    roughness: 0.45,
    metalness: 0.05,
    costPerRftINR: 2200,
  },
  natural_oak_grain: {
    name: 'Natural Warm Oak Woodgrain',
    color: '#92400e',
    roughness: 0.6,
    metalness: 0.0,
    costPerRftINR: 2600,
  },
  deep_navy_blue: {
    name: 'Contemporary Midnight Navy Blue',
    color: '#0f172a',
    roughness: 0.35,
    metalness: 0.08,
    costPerRftINR: 2350,
  },
  sage_green_matte: {
    name: 'Warm Earthy Sage Green',
    color: '#4d7c0f',
    roughness: 0.4,
    metalness: 0.04,
    costPerRftINR: 2300,
  },
};

/**
 * Creates a Straight Kitchen layout of specified length in feet.
 */
export function createStraightKitchen(
  floorId: string,
  pos: Point2D = { x: 0, y: 0 },
  lengthFeet: number = 10
): KitchenDesign {
  const cabinets: KitchenCabinetUnit[] = [];
  const appliances: KitchenAppliance[] = [];
  const baseDepth = 24 * SIXTEENTHS_PER_INCH;
  const baseHeight = Math.round(34.5 * SIXTEENTHS_PER_INCH);
  const wallDepth = 12 * SIXTEENTHS_PER_INCH;
  const wallHeight = 30 * SIXTEENTHS_PER_INCH;
  const wallElevation = 54 * SIXTEENTHS_PER_INCH;

  const numUnits = Math.max(3, Math.floor(lengthFeet / 2));
  const unitWidth = Math.round((lengthFeet * SIXTEENTHS_PER_FOOT) / numUnits);

  let curX = 0;
  for (let i = 0; i < numUnits; i++) {
    const isSinkUnit = i === 1;
    const isCooktopUnit = i === numUnits - 2;

    cabinets.push({
      id: `cab_base_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: isSinkUnit ? 'base_sink_unit' : isCooktopUnit ? 'base_drawers' : 'base_cabinet',
      name: isSinkUnit ? 'Sink Base Unit' : isCooktopUnit ? 'Tandem Drawers Unit' : 'Base Cabinet',
      width: unitWidth,
      depth: baseDepth,
      height: baseHeight,
      elevation: 0,
      position: { x: curX + unitWidth / 2, y: baseDepth / 2 },
      rotation: 0,
      doorCount: isCooktopUnit ? 0 : 2,
      drawerCount: isCooktopUnit ? 3 : isSinkUnit ? 0 : 1,
    });

    cabinets.push({
      id: `cab_wall_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: 'wall_cabinet',
      name: 'Overhead Wall Cabinet',
      width: unitWidth,
      depth: wallDepth,
      height: wallHeight,
      elevation: wallElevation,
      position: { x: curX + unitWidth / 2, y: wallDepth / 2 },
      rotation: 0,
      doorCount: 2,
    });

    if (isSinkUnit) {
      appliances.push({
        id: `app_sink_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: 'sink_undermount_single',
        name: 'Single Bowl Undermount Sink',
        position: { x: curX + unitWidth / 2, y: baseDepth / 2 },
        elevation: baseHeight,
        width: 24 * SIXTEENTHS_PER_INCH,
        depth: 18 * SIXTEENTHS_PER_INCH,
        height: 9 * SIXTEENTHS_PER_INCH,
        rotation: 0,
      });
    }

    if (isCooktopUnit) {
      appliances.push({
        id: `app_hob_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: 'hob_gas_4burner',
        name: '4-Burner Tempered Glass Hob',
        position: { x: curX + unitWidth / 2, y: baseDepth / 2 },
        elevation: baseHeight,
        width: 24 * SIXTEENTHS_PER_INCH,
        depth: 20 * SIXTEENTHS_PER_INCH,
        height: 2 * SIXTEENTHS_PER_INCH,
        rotation: 0,
      });

      appliances.push({
        id: `app_chimney_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: 'chimney_hood',
        name: 'Pyramid Range Hood',
        position: { x: curX + unitWidth / 2, y: baseDepth / 2 },
        elevation: wallElevation + 6 * SIXTEENTHS_PER_INCH,
        width: 30 * SIXTEENTHS_PER_INCH,
        depth: 19 * SIXTEENTHS_PER_INCH,
        height: 24 * SIXTEENTHS_PER_INCH,
        rotation: 0,
      });
    }

    curX += unitWidth;
  }

  return {
    id: `kitchen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    floorId,
    name: 'Straight Run Modular Kitchen',
    layoutType: 'straight',
    position: pos,
    rotation: 0,
    cabinetFinish: 'acrylic_white_gloss',
    shutterStyle: 'slab',
    handleStyle: 'brushed_brass_bar',
    countertopMaterial: 'quartz_calacatta_white',
    countertopEdge: 'square',
    countertopThicknessInches: 1.5,
    countertopOverhangInches: 1.5,
    hasUnderCabinetLighting: true,
    backsplashHeightInches: 18,
    cabinets,
    appliances,
  };
}

/**
 * Creates an L-Shape Kitchen layout.
 */
export function createLShapeKitchen(
  floorId: string,
  pos: Point2D = { x: 0, y: 0 },
  run1Feet: number = 10,
  run2Feet: number = 8
): KitchenDesign {
  const base = createStraightKitchen(floorId, pos, run1Feet);
  base.name = 'L-Shape Modular Kitchen';
  base.layoutType = 'l_shape';

  const baseDepth = 24 * SIXTEENTHS_PER_INCH;
  const baseHeight = Math.round(34.5 * SIXTEENTHS_PER_INCH);
  const wallDepth = 12 * SIXTEENTHS_PER_INCH;
  const wallHeight = 30 * SIXTEENTHS_PER_INCH;
  const wallElevation = 54 * SIXTEENTHS_PER_INCH;

  const arm2Units = Math.max(2, Math.floor(run2Feet / 2));
  const unitWidth = Math.round((run2Feet * SIXTEENTHS_PER_FOOT) / arm2Units);

  let curY = baseDepth;
  for (let j = 0; j < arm2Units; j++) {
    base.cabinets.push({
      id: `cab_base_arm2_${j}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: 'base_cabinet',
      name: 'Base Storage Cabinet',
      width: unitWidth,
      depth: baseDepth,
      height: baseHeight,
      elevation: 0,
      position: { x: baseDepth / 2, y: curY + unitWidth / 2 },
      rotation: 90,
      doorCount: 2,
    });

    base.cabinets.push({
      id: `cab_wall_arm2_${j}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: 'wall_cabinet',
      name: 'Overhead Wall Cabinet',
      width: unitWidth,
      depth: wallDepth,
      height: wallHeight,
      elevation: wallElevation,
      position: { x: wallDepth / 2, y: curY + unitWidth / 2 },
      rotation: 90,
      doorCount: 2,
    });

    curY += unitWidth;
  }

  return base;
}

/**
 * Creates a U-Shape Kitchen layout.
 */
export function createUShapeKitchen(
  floorId: string,
  pos: Point2D = { x: 0, y: 0 },
  run1Feet: number = 10,
  run2Feet: number = 8,
  run3Feet: number = 8
): KitchenDesign {
  const lShape = createLShapeKitchen(floorId, pos, run1Feet, run2Feet);
  lShape.name = 'U-Shape Modular Kitchen';
  lShape.layoutType = 'u_shape';

  const baseDepth = 24 * SIXTEENTHS_PER_INCH;
  const baseHeight = Math.round(34.5 * SIXTEENTHS_PER_INCH);
  const arm3Length = run3Feet * SIXTEENTHS_PER_FOOT;
  const unitWidth = Math.round(arm3Length / 2);

  const farX = run1Feet * SIXTEENTHS_PER_FOOT;
  for (let k = 0; k < 2; k++) {
    lShape.cabinets.push({
      id: `cab_base_arm3_${k}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: 'base_cabinet',
      name: 'Base Storage Unit',
      width: unitWidth,
      depth: baseDepth,
      height: baseHeight,
      elevation: 0,
      position: { x: farX - baseDepth / 2, y: baseDepth + k * unitWidth + unitWidth / 2 },
      rotation: -90,
      doorCount: 2,
    });
  }

  return lShape;
}

/**
 * Creates an Island Kitchen layout with a freestanding cooking or breakfast island.
 */
export function createIslandKitchen(
  floorId: string,
  pos: Point2D = { x: 0, y: 0 },
  mainRunFeet: number = 12,
  islandLengthFeet: number = 6
): KitchenDesign {
  const main = createStraightKitchen(floorId, pos, mainRunFeet);
  main.name = 'Chef Island Modular Kitchen';
  main.layoutType = 'island';

  const islandWidth = islandLengthFeet * SIXTEENTHS_PER_FOOT;
  const islandDepth = 36 * SIXTEENTHS_PER_INCH;
  const baseHeight = Math.round(34.5 * SIXTEENTHS_PER_INCH);

  const aisleClearance = 42 * SIXTEENTHS_PER_INCH;
  const islandY = 24 * SIXTEENTHS_PER_INCH + aisleClearance + islandDepth / 2;
  const islandCenterX = (mainRunFeet * SIXTEENTHS_PER_FOOT) / 2;

  main.cabinets.push({
    id: `cab_island_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    type: 'island_base',
    name: 'Breakfast Island Base & Drawers',
    width: islandWidth,
    depth: islandDepth,
    height: baseHeight,
    elevation: 0,
    position: { x: islandCenterX, y: islandY },
    rotation: 0,
    drawerCount: 4,
    doorCount: 2,
  });

  return main;
}

/**
 * Computes the total countertop surface area in square feet.
 */
export function computeCountertopAreaSqFt(kitchen: KitchenDesign): number {
  let totalSqInches = 0;
  for (const cab of kitchen.cabinets) {
    if (
      cab.type === 'base_cabinet' ||
      cab.type === 'base_drawers' ||
      cab.type === 'base_sink_unit' ||
      cab.type === 'base_corner' ||
      cab.type === 'island_base'
    ) {
      const widthInches = cab.width / SIXTEENTHS_PER_INCH;
      const depthInches = cab.depth / SIXTEENTHS_PER_INCH + (kitchen.countertopOverhangInches || 1.5);
      totalSqInches += widthInches * depthInches;
    }
  }
  return Math.round((totalSqInches / 144) * 10) / 10;
}

/**
 * Computes the total linear feet of kitchen cabinetry.
 */
export function computeKitchenCabinetLinearFeet(kitchen: KitchenDesign): number {
  let totalSixteenths = 0;
  for (const cab of kitchen.cabinets) {
    if (cab.type.startsWith('base') || cab.type === 'island_base') {
      totalSixteenths += cab.width;
    }
  }
  return Math.round((totalSixteenths / SIXTEENTHS_PER_FOOT) * 10) / 10;
}

/**
 * Computes live Bill of Quantities (BOQ) cost estimate in Indian Rupees (INR ₹).
 */
export function computeKitchenEstimatedCostINR(kitchen: KitchenDesign): {
  cabinetsINR: number;
  countertopINR: number;
  appliancesINR: number;
  totalINR: number;
} {
  const linearFeet = computeKitchenCabinetLinearFeet(kitchen);
  const finishRate = CABINET_FINISH_PRESETS[kitchen.cabinetFinish]?.costPerRftINR || 2400;
  const cabinetsINR = Math.round(linearFeet * finishRate);

  const countertopSqFt = computeCountertopAreaSqFt(kitchen);
  const counterRate = COUNTERTOP_PRESETS[kitchen.countertopMaterial]?.costPerSqFtINR || 450;
  const countertopINR = Math.round(countertopSqFt * counterRate);

  let appliancesINR = 0;
  for (const app of kitchen.appliances) {
    switch (app.type) {
      case 'chimney_hood':
        appliancesINR += 18500;
        break;
      case 'hob_gas_4burner':
        appliancesINR += 14000;
        break;
      case 'hob_induction':
        appliancesINR += 22000;
        break;
      case 'sink_undermount_single':
        appliancesINR += 8500;
        break;
      case 'sink_undermount_double':
        appliancesINR += 14500;
        break;
      case 'built_in_oven':
        appliancesINR += 32000;
        break;
      case 'built_in_microwave':
        appliancesINR += 19000;
        break;
      default:
        appliancesINR += 5000;
    }
  }

  const totalINR = cabinetsINR + countertopINR + appliancesINR;
  return {
    cabinetsINR,
    countertopINR,
    appliancesINR,
    totalINR,
  };
}
