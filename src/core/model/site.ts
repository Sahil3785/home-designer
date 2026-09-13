import { Point2D, Project } from './types';
import { Sixteenths, SIXTEENTHS_PER_FOOT } from '../units';

export type OutdoorFeatureType =
  | 'pool'
  | 'patio'
  | 'deck'
  | 'driveway'
  | 'pathway'
  | 'fence'
  | 'tree'
  | 'shrub'
  | 'garden_bed';

export interface OutdoorFeature {
  id: string;
  type: OutdoorFeatureType;
  name: string;
  position: Point2D;
  width: Sixteenths;
  depth: Sixteenths;
  height?: Sixteenths;
  rotation?: number; // in degrees
  polygon?: Point2D[];
  materialId?: string;
  elevation?: Sixteenths;
  metadata?: {
    poolDepthFt?: number;
    copingWidthInches?: number;
    fenceHeightFt?: number;
    treeCanopyRadiusFt?: number;
    treeType?: 'oak' | 'palm' | 'pine';
    deckPlankOrientation?: 'horizontal' | 'vertical';
    hasWaterRipple?: boolean;
    color?: string;
  };
}

export interface SitePlan {
  id: string;
  name: string;
  lotWidth: Sixteenths;  // e.g. 60' = 11,520
  lotDepth: Sixteenths;  // e.g. 100' = 19,200
  frontSetback: Sixteenths; // e.g. 15' = 2,880
  rearSetback: Sixteenths;  // e.g. 12' = 2,304
  sideSetbackLeft: Sixteenths; // e.g. 5' = 960
  sideSetbackRight: Sixteenths; // e.g. 5' = 960
  lotBoundary?: Point2D[]; // Optional irregular polygon
  northOrientationDegrees: number; // 0 = Up, 90 = Right, 180 = Down, 270 = Left
  terrainElevation: Sixteenths;
  features: OutdoorFeature[];
  maxAllowedFAR?: number; // e.g. 1.5
  maxAllowedGroundCoveragePct?: number; // e.g. 60%
}

export interface OutdoorCatalogItem {
  id: string;
  type: OutdoorFeatureType;
  name: string;
  category: 'water' | 'hardscape' | 'vegetation' | 'barrier';
  categoryLabel: string;
  defaultWidthFt: number;
  defaultDepthFt: number;
  defaultHeightFt?: number;
  color: string;
  description: string;
  metadata?: OutdoorFeature['metadata'];
}

export const OUTDOOR_CATALOG: OutdoorCatalogItem[] = [
  // 1. SWIMMING POOLS & WATER
  {
    id: 'pool_family_rectangular',
    type: 'pool',
    name: '16′×32′ Inground Family Swimming Pool',
    category: 'water',
    categoryLabel: 'Swimming Pools & Water',
    defaultWidthFt: 16,
    defaultDepthFt: 32,
    defaultHeightFt: 6,
    color: '#38bdf8',
    description: 'Classic rectangular inground pool with turquoise water, bullnose stone coping, and dual depth gradient.',
    metadata: {
      poolDepthFt: 6,
      copingWidthInches: 12,
      hasWaterRipple: true,
      color: '#0284c7',
    },
  },
  {
    id: 'pool_lap_exercise',
    type: 'pool',
    name: '8′×40′ Architectural Lap Pool',
    category: 'water',
    categoryLabel: 'Swimming Pools & Water',
    defaultWidthFt: 8,
    defaultDepthFt: 40,
    defaultHeightFt: 4.5,
    color: '#0ea5e9',
    description: 'Sleek geometric lap pool designed for side yard easements and fitness swimming.',
    metadata: {
      poolDepthFt: 4.5,
      copingWidthInches: 8,
      hasWaterRipple: true,
      color: '#0369a1',
    },
  },
  {
    id: 'pool_plunge_spa',
    type: 'pool',
    name: '10′×14′ Heated Plunge Pool & Spa',
    category: 'water',
    categoryLabel: 'Swimming Pools & Water',
    defaultWidthFt: 10,
    defaultDepthFt: 14,
    defaultHeightFt: 4,
    color: '#06b6d4',
    description: 'Compact urban plunge pool with integrated seating bench and soothing hydromassage jets.',
    metadata: {
      poolDepthFt: 4,
      copingWidthInches: 10,
      hasWaterRipple: true,
      color: '#0891b2',
    },
  },

  // 2. HARDSCAPE: DECKS, PATIOS & DRIVEWAYS
  {
    id: 'deck_timber_composite',
    type: 'deck',
    name: '20′×16′ Teak Composite Sun Deck',
    category: 'hardscape',
    categoryLabel: 'Hardscape & Terraces',
    defaultWidthFt: 20,
    defaultDepthFt: 16,
    defaultHeightFt: 1,
    color: '#92400e',
    description: 'Elevated exterior decking with grooved teak composite planks and perimeter fascia band.',
    metadata: {
      deckPlankOrientation: 'horizontal',
      color: '#b45309',
    },
  },
  {
    id: 'patio_stone_paver',
    type: 'patio',
    name: '24′×18′ Travertine Outdoor Dining Terrace',
    category: 'hardscape',
    categoryLabel: 'Hardscape & Terraces',
    defaultWidthFt: 24,
    defaultDepthFt: 18,
    defaultHeightFt: 0.5,
    color: '#d6d3d1',
    description: 'Natural brushed travertine paver terrace for outdoor barbecue, loungers, and alfresco dining.',
    metadata: {
      color: '#e7e5e4',
    },
  },
  {
    id: 'driveway_paver_interlock',
    type: 'driveway',
    name: '18′×36′ Interlocking Cobblestone Driveway',
    category: 'hardscape',
    categoryLabel: 'Hardscape & Terraces',
    defaultWidthFt: 18,
    defaultDepthFt: 36,
    defaultHeightFt: 0.25,
    color: '#64748b',
    description: 'Heavy-duty vehicle driveway with 45° herringbone charcoal interlocking concrete pavers.',
    metadata: {
      color: '#475569',
    },
  },
  {
    id: 'pathway_pedestrian_walk',
    type: 'pathway',
    name: '4′×24′ Garden Stepping Stone Walkway',
    category: 'hardscape',
    categoryLabel: 'Hardscape & Terraces',
    defaultWidthFt: 4,
    defaultDepthFt: 24,
    defaultHeightFt: 0.2,
    color: '#94a3b8',
    description: 'Flagstone pedestrian walkway connecting front driveway entrance to entry porch and garden.',
    metadata: {
      color: '#cbd5e1',
    },
  },

  // 3. BARRIERS: WALLS & FENCES
  {
    id: 'fence_modern_slat',
    type: 'fence',
    name: 'Horizontal Cedar Privacy Fence (6ft)',
    category: 'barrier',
    categoryLabel: 'Perimeter Walls & Fencing',
    defaultWidthFt: 30,
    defaultDepthFt: 1,
    defaultHeightFt: 6,
    color: '#78350f',
    description: 'Modern architectural horizontal slatted cedar privacy screen with powder-coated steel posts.',
    metadata: {
      fenceHeightFt: 6,
      color: '#92400e',
    },
  },
  {
    id: 'wall_masonry_boundary',
    type: 'fence',
    name: 'Rendered Masonry Boundary Wall (7ft)',
    category: 'barrier',
    categoryLabel: 'Perimeter Walls & Fencing',
    defaultWidthFt: 40,
    defaultDepthFt: 1,
    defaultHeightFt: 7,
    color: '#e2e8f0',
    description: 'Solid reinforced concrete block boundary wall with smooth white stucco and coped cap.',
    metadata: {
      fenceHeightFt: 7,
      color: '#f1f5f9',
    },
  },

  // 4. VEGETATION & TREES
  {
    id: 'tree_shade_oak',
    type: 'tree',
    name: 'Mature Majestic Shade Oak Tree',
    category: 'vegetation',
    categoryLabel: 'Landscape Foliage & Trees',
    defaultWidthFt: 14,
    defaultDepthFt: 14,
    defaultHeightFt: 22,
    color: '#15803d',
    description: 'Lush broadleaf deciduous shade tree offering natural solar cooling and rich aesthetic canopy.',
    metadata: {
      treeType: 'oak',
      treeCanopyRadiusFt: 8,
      color: '#16a34a',
    },
  },
  {
    id: 'tree_royal_palm',
    type: 'tree',
    name: 'Tall Tropical Royal Palm Tree',
    category: 'vegetation',
    categoryLabel: 'Landscape Foliage & Trees',
    defaultWidthFt: 10,
    defaultDepthFt: 10,
    defaultHeightFt: 26,
    color: '#166534',
    description: 'Elegant tropical palm with slender ringed trunk and sculptural frond crown for poolside accent.',
    metadata: {
      treeType: 'palm',
      treeCanopyRadiusFt: 5,
      color: '#22c55e',
    },
  },
  {
    id: 'tree_evergreen_pine',
    type: 'tree',
    name: 'Conical Evergreen Pine Tree',
    category: 'vegetation',
    categoryLabel: 'Landscape Foliage & Trees',
    defaultWidthFt: 12,
    defaultDepthFt: 12,
    defaultHeightFt: 24,
    color: '#14532d',
    description: 'Upright pyramidal evergreen conifer ideal for property perimeter windbreaks and privacy borders.',
    metadata: {
      treeType: 'pine',
      treeCanopyRadiusFt: 6,
      color: '#15803d',
    },
  },
  {
    id: 'shrub_flowering_hydrangea',
    type: 'shrub',
    name: 'Flowering Perennial Garden Bed',
    category: 'vegetation',
    categoryLabel: 'Landscape Foliage & Trees',
    defaultWidthFt: 12,
    defaultDepthFt: 4,
    defaultHeightFt: 3,
    color: '#ec4899',
    description: 'Vibrant perennial flower bed with blooming hydrangeas and ornamental border grasses.',
    metadata: {
      color: '#f472b6',
    },
  },
  {
    id: 'shrub_boxwood_hedge',
    type: 'shrub',
    name: 'Formed Boxwood Hedge Border',
    category: 'vegetation',
    categoryLabel: 'Landscape Foliage & Trees',
    defaultWidthFt: 24,
    defaultDepthFt: 2.5,
    defaultHeightFt: 4,
    color: '#15803d',
    description: 'Manicured evergreen boxwood hedge for clean boundary definition along walkways and terraces.',
    metadata: {
      color: '#16a34a',
    },
  },
];

/**
 * Creates default suburban site plan (60' x 100' lot with standard setbacks).
 */
export function createDefaultSitePlan(): SitePlan {
  const lotWidth = 60 * SIXTEENTHS_PER_FOOT; // 11,520
  const lotDepth = 100 * SIXTEENTHS_PER_FOOT; // 19,200
  const frontSetback = 15 * SIXTEENTHS_PER_FOOT; // 2,880
  const rearSetback = 12 * SIXTEENTHS_PER_FOOT; // 2,304
  const sideSetback = 5 * SIXTEENTHS_PER_FOOT; // 960

  return {
    id: 'site_primary',
    name: 'Primary Property Lot',
    lotWidth,
    lotDepth,
    frontSetback,
    rearSetback,
    sideSetbackLeft: sideSetback,
    sideSetbackRight: sideSetback,
    northOrientationDegrees: 0, // 0 = True North pointing directly upwards
    terrainElevation: 0,
    maxAllowedFAR: 1.5,
    maxAllowedGroundCoveragePct: 50,
    features: [],
  };
}

/**
 * Returns the 4-point polygon of the property lot boundary centered or aligned to building origin.
 */
export function computeLotPolygon(site: SitePlan): Point2D[] {
  if (site.lotBoundary && site.lotBoundary.length >= 3) {
    return site.lotBoundary;
  }
  const halfW = site.lotWidth / 2;
  const halfD = site.lotDepth / 2;
  return [
    { x: -halfW, y: -halfD },
    { x: halfW, y: -halfD },
    { x: halfW, y: halfD },
    { x: -halfW, y: halfD },
  ];
}

/**
 * Returns the buildable setback envelope polygon inside the lot.
 */
export function computeSetbackPolygon(site: SitePlan): Point2D[] {
  const halfW = site.lotWidth / 2;
  const halfD = site.lotDepth / 2;

  const minX = -halfW + site.sideSetbackLeft;
  const maxX = halfW - site.sideSetbackRight;
  const minY = -halfD + site.frontSetback;
  const maxY = halfD - site.rearSetback;

  if (maxX <= minX || maxY <= minY) return [];

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

/**
 * Computes exact lot land area in square feet.
 */
export function computeSiteAreaSqFt(site: SitePlan): number {
  return Math.round((site.lotWidth * site.lotDepth) / (SIXTEENTHS_PER_FOOT * SIXTEENTHS_PER_FOOT));
}

/**
 * Computes total ground floor building footprint area in square feet.
 */
export function computeBuildingFootprintSqFt(project: Project): number {
  const groundFloor = project.floors.find((f) => f.levelIndex === 0) || project.floors[0];
  if (!groundFloor) return 0;

  // Sum room areas
  if (groundFloor.rooms && groundFloor.rooms.length > 0) {
    return groundFloor.rooms.reduce((sum, r) => sum + (r.computedAreaSqFt || 0), 0);
  }

  // Fallback to wall envelope
  if (groundFloor.walls && groundFloor.walls.length >= 3) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const w of groundFloor.walls) {
      minX = Math.min(minX, w.start.x, w.end.x);
      maxX = Math.max(maxX, w.start.x, w.end.x);
      minY = Math.min(minY, w.start.y, w.end.y);
      maxY = Math.max(maxY, w.start.y, w.end.y);
    }
    return Math.round(((maxX - minX) * (maxY - minY)) / (SIXTEENTHS_PER_FOOT * SIXTEENTHS_PER_FOOT));
  }
  return 0;
}

/**
 * Computes total gross built-up area across all floor levels in square feet.
 */
export function computeTotalBuiltUpAreaSqFt(project: Project): number {
  let total = 0;
  for (const floor of project.floors) {
    if (floor.rooms && floor.rooms.length > 0) {
      total += floor.rooms.reduce((sum, r) => sum + (r.computedAreaSqFt || 0), 0);
    }
  }
  return total > 0 ? total : computeBuildingFootprintSqFt(project);
}

/**
 * Computes Ground Coverage Ratio (%) = (Footprint / Lot Area) * 100
 */
export function computeGroundCoveragePercentage(project: Project, site: SitePlan): number {
  const lotSqFt = computeSiteAreaSqFt(site);
  if (lotSqFt <= 0) return 0;
  const footprintSqFt = computeBuildingFootprintSqFt(project);
  return Number(((footprintSqFt / lotSqFt) * 100).toFixed(1));
}

/**
 * Computes Floor Area Ratio (FAR) = Total Built-Up Area / Lot Area
 */
export function computeFloorAreaRatio(project: Project, site: SitePlan): number {
  const lotSqFt = computeSiteAreaSqFt(site);
  if (lotSqFt <= 0) return 0;
  const totalSqFt = computeTotalBuiltUpAreaSqFt(project);
  return Number((totalSqFt / lotSqFt).toFixed(2));
}

/**
 * Calculates sun azimuth (degrees), elevation angle (degrees), light intensity, and sky color
 * from time of day (0.0 to 24.0) and compass North orientation.
 */
export function computeSolarPosition(
  timeOfDayHours: number,
  northOrientationDegrees: number = 0
): {
  azimuthDeg: number;
  elevationDeg: number;
  intensity: number;
  skyColor: string;
  isNight: boolean;
  sunColor: string;
} {
  // Normalize time into [0, 24)
  const t = Math.max(0, Math.min(24, timeOfDayHours));

  // Sun rises ~6:00 AM (East), reaches peak elevation ~12:00 PM (South in Northern Hemisphere), sets ~6:30 PM (West)
  const sunrise = 6.0;
  const sunset = 18.5;
  const isNight = t < sunrise || t > sunset;

  let elevationDeg = 0;
  let azimuthDeg = 0;
  let intensity = 0;
  let skyColor = '#0f172a'; // Deep midnight blue
  let sunColor = '#ffffff';

  if (!isNight) {
    const dayProgress = (t - sunrise) / (sunset - sunrise); // 0 at dawn, 0.5 at noon, 1.0 at sunset
    // Elevation: parabolic arch peaking at ~62 degrees at noon
    elevationDeg = Math.sin(dayProgress * Math.PI) * 62;

    // Azimuth: from 85° (East) through 180° (South) to 275° (West)
    const baseAzimuth = 85 + dayProgress * (275 - 85);
    azimuthDeg = (baseAzimuth + northOrientationDegrees) % 360;

    // Intensity and colors
    if (t < 7.5 || t > 17.0) {
      // Golden Hour / Twilight
      intensity = 0.85 + Math.sin(dayProgress * Math.PI) * 0.4;
      skyColor = t < 7.5 ? '#fbcfe8' : '#fed7aa'; // Rosy pink dawn vs warm peach golden sunset
      sunColor = '#fb923c'; // Warm amber golden sun
    } else {
      // Midday crisp sunshine
      intensity = 1.35;
      skyColor = '#38bdf8'; // Vibrant azure sky
      sunColor = '#fffbeb'; // Crisp warm white
    }
  } else {
    // Night
    elevationDeg = -20;
    azimuthDeg = (180 + northOrientationDegrees) % 360;
    intensity = 0.15; // Soft moonlight ambient
    skyColor = '#090d16'; // Obsidian dark night
    sunColor = '#94a3b8'; // Cool pale moonlight
  }

  return {
    azimuthDeg,
    elevationDeg,
    intensity,
    skyColor,
    isNight,
    sunColor,
  };
}
