import {
  Project,
  Floor,
  Wall,
  WallOpening,
  MaterialDef,
  ProjectSettings,
} from './types';
import { feetInchesToSixteenths, SNAP_PRESETS } from '../units';
import { createDefaultSitePlan } from './site';

export const DEFAULT_MATERIALS: MaterialDef[] = [
  // Interior Wall Paints & Plasters
  {
    id: 'mat_interior_paint_white',
    name: 'Interior Paint — Warm White',
    category: 'paint',
    color: '#F4F4F2',
    roughness: 0.85,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_interior_paint_greige',
    name: 'Interior Paint — Modern Greige',
    category: 'paint',
    color: '#D6D1CA',
    roughness: 0.85,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_interior_paint_slate',
    name: 'Interior Paint — Slate Blue Accent',
    category: 'paint',
    color: '#486581',
    roughness: 0.8,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_interior_paint_emerald',
    name: 'Interior Paint — Emerald Forest',
    category: 'paint',
    color: '#2D5A47',
    roughness: 0.8,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_interior_paint_terracotta',
    name: 'Interior Paint — Desert Terracotta',
    category: 'paint',
    color: '#BA6E56',
    roughness: 0.85,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_interior_paint_charcoal',
    name: 'Interior Paint — Deep Charcoal Accent',
    category: 'paint',
    color: '#282C34',
    roughness: 0.85,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_venetian_plaster',
    name: 'Textured Venetian Plaster',
    category: 'paint',
    color: '#EAE6DF',
    roughness: 0.65,
    metalness: 0.08,
    isProcedural: true,
  },
  {
    id: 'mat_white_shiplap',
    name: 'Architectural White Shiplap',
    category: 'paint',
    color: '#FAFAFA',
    roughness: 0.7,
    metalness: 0.02,
    isProcedural: true,
  },

  // Luxury Hardwood & Flooring
  {
    id: 'mat_oak_hardwood',
    name: 'European White Oak Parquet',
    category: 'wood',
    color: '#B58852',
    roughness: 0.5,
    metalness: 0.1,
    isProcedural: true,
  },
  {
    id: 'mat_walnut_wood',
    name: 'American Walnut Plank',
    category: 'wood',
    color: '#4A3425',
    roughness: 0.45,
    metalness: 0.1,
    isProcedural: true,
  },
  {
    id: 'mat_chevron_parquet',
    name: 'French Chevron Parquet',
    category: 'wood',
    color: '#C49A6C',
    roughness: 0.48,
    metalness: 0.08,
    isProcedural: true,
  },
  {
    id: 'mat_pine_wood',
    name: 'Reclaimed Nordic Pine',
    category: 'wood',
    color: '#DFBE8B',
    roughness: 0.55,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_bamboo_flooring',
    name: 'Bleached Natural Bamboo',
    category: 'wood',
    color: '#E8DCC2',
    roughness: 0.42,
    metalness: 0.06,
    isProcedural: true,
  },

  // Luxury Stones & Marbles
  {
    id: 'mat_marble_calacatta',
    name: 'Calacatta Gold White Marble',
    category: 'marble',
    color: '#ECEEED',
    roughness: 0.18,
    metalness: 0.1,
    isProcedural: true,
  },
  {
    id: 'mat_marble_marquina',
    name: 'Nero Marquina Black Marble',
    category: 'marble',
    color: '#1A1C1E',
    roughness: 0.16,
    metalness: 0.12,
    isProcedural: true,
  },
  {
    id: 'mat_marble_travertine',
    name: 'Roman Silver Travertine',
    category: 'marble',
    color: '#D1C7BD',
    roughness: 0.35,
    metalness: 0.08,
    isProcedural: true,
  },
  {
    id: 'mat_terrazzo_polished',
    name: 'Venetian Polished Terrazzo',
    category: 'marble',
    color: '#E2DDD5',
    roughness: 0.25,
    metalness: 0.1,
    isProcedural: true,
  },

  // Tiles & Ceramics
  {
    id: 'mat_ceramic_tile',
    name: 'Porcelain Large Format Grey Tile',
    category: 'tile',
    color: '#C7CBD1',
    roughness: 0.35,
    metalness: 0.15,
    isProcedural: true,
  },
  {
    id: 'mat_zellige_tile',
    name: 'Moroccan Zellige Glazed Tile',
    category: 'tile',
    color: '#4A7C79',
    roughness: 0.22,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_terracotta_tile',
    name: 'Spanish Terracotta Floor Tile',
    category: 'tile',
    color: '#BF573F',
    roughness: 0.7,
    metalness: 0.02,
    isProcedural: true,
  },
  {
    id: 'mat_subway_tile',
    name: 'Glossy White Subway Tile',
    category: 'tile',
    color: '#FFFFFF',
    roughness: 0.15,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_tile_vitrified_large',
    name: '24"x48" Vitrified Italian Floor Tile',
    category: 'tile',
    color: '#E5E5E2',
    roughness: 0.18,
    metalness: 0.12,
    isProcedural: true,
  },
  {
    id: 'mat_tile_moroccan_encaustic',
    name: 'Moroccan Geometric Encaustic Floor Tile',
    category: 'tile',
    color: '#3B586B',
    roughness: 0.45,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_tile_hex_mosaic',
    name: 'Satin Hexagonal Mosaic Floor Tile',
    category: 'tile',
    color: '#F4F4F5',
    roughness: 0.32,
    metalness: 0.06,
    isProcedural: true,
  },
  {
    id: 'mat_tile_slate_black',
    name: 'Natural Riven Black Slate Floor Tile',
    category: 'tile',
    color: '#1E2126',
    roughness: 0.72,
    metalness: 0.08,
    isProcedural: true,
  },

  // Italian & Exotic Marbles
  {
    id: 'mat_marble_carrara',
    name: 'Classic Carrara White Italian Marble',
    category: 'marble',
    color: '#E8E7E3',
    roughness: 0.14,
    metalness: 0.12,
    isProcedural: true,
  },
  {
    id: 'mat_marble_crema_marfil',
    name: 'Spanish Crema Marfil Beige Marble',
    category: 'marble',
    color: '#DFD5C4',
    roughness: 0.16,
    metalness: 0.1,
    isProcedural: true,
  },
  {
    id: 'mat_marble_emerald',
    name: 'Rainforest Emerald Exotic Marble',
    category: 'marble',
    color: '#2B4A3E',
    roughness: 0.15,
    metalness: 0.12,
    isProcedural: true,
  },

  // Luxury PVC & Vinyl Flooring
  {
    id: 'mat_pvc_lvt_plank',
    name: 'Luxury Vinyl Tile (LVT) Weathered Oak Plank',
    category: 'pvc',
    color: '#8A7B6E',
    roughness: 0.62,
    metalness: 0.04,
    isProcedural: true,
  },
  {
    id: 'mat_pvc_spc_honey',
    name: 'Waterproof Rigid Core SPC Vinyl (Honey Oak)',
    category: 'pvc',
    color: '#C1935B',
    roughness: 0.58,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_pvc_slate_tile',
    name: 'Architectural Slate Grey PVC Tile',
    category: 'pvc',
    color: '#475569',
    roughness: 0.66,
    metalness: 0.04,
    isProcedural: true,
  },
  {
    id: 'mat_pvc_seamless_sheet',
    name: 'Resilient Seamless Architectural PVC Sheet',
    category: 'pvc',
    color: '#D4CDC2',
    roughness: 0.7,
    metalness: 0.03,
    isProcedural: true,
  },

  // Ultra-Matte & Microcement Finishes
  {
    id: 'mat_concrete_microcement',
    name: 'Architectural Matte Microcement (Raw Grey)',
    category: 'concrete',
    color: '#A6ABB0',
    roughness: 0.9,
    metalness: 0.02,
    isProcedural: true,
  },
  {
    id: 'mat_matte_nordic_oak',
    name: 'Ultra-Matte Nordic Oak Plank (5% Zero-Glare)',
    category: 'wood',
    color: '#CAB79C',
    roughness: 0.88,
    metalness: 0.03,
    isProcedural: true,
  },
  {
    id: 'mat_epoxy_matte_white',
    name: 'Seamless Studio Matte White Epoxy Resin',
    category: 'paint',
    color: '#F8F9FA',
    roughness: 0.94,
    metalness: 0.01,
    isProcedural: true,
  },
  {
    id: 'mat_carpet_acoustic_matting',
    name: 'Acoustic Natural Wool & Jute Floor Matting',
    category: 'fabric',
    color: '#BDB19C',
    roughness: 0.96,
    metalness: 0.01,
    isProcedural: true,
  },

  // Exterior Siding & Masonry
  {
    id: 'mat_exterior_stucco',
    name: 'Exterior Stucco — Modern Grey',
    category: 'paint',
    color: '#D8D8D6',
    roughness: 0.9,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_exterior_brick',
    name: 'Architectural Red Brick Masonry',
    category: 'brick',
    color: '#8B3A2B',
    roughness: 0.85,
    metalness: 0.04,
    isProcedural: true,
  },
  {
    id: 'mat_exterior_limestone',
    name: 'Ashlar Cut French Limestone',
    category: 'marble',
    color: '#C5BEB1',
    roughness: 0.75,
    metalness: 0.05,
    isProcedural: true,
  },
  {
    id: 'mat_vertical_siding',
    name: 'Modern Charcoal Vertical Siding',
    category: 'wood',
    color: '#373B44',
    roughness: 0.65,
    metalness: 0.1,
    isProcedural: true,
  },
  {
    id: 'mat_polished_concrete',
    name: 'Industrial Polished Concrete',
    category: 'concrete',
    color: '#8E9297',
    roughness: 0.35,
    metalness: 0.12,
    isProcedural: true,
  },

  // Architectural Metals & Glass
  {
    id: 'mat_clear_glass',
    name: 'Architectural Double-Glazed Glass',
    category: 'glass',
    color: '#90CAF9',
    roughness: 0.05,
    metalness: 0.9,
    opacity: 0.35,
    isProcedural: true,
  },
  {
    id: 'mat_brass_champagne',
    name: 'Brushed Champagne Brass',
    category: 'metal',
    color: '#D4AF37',
    roughness: 0.28,
    metalness: 0.85,
    isProcedural: true,
  },
  {
    id: 'mat_dark_aluminum',
    name: 'Anodized Dark Aluminum / Black Steel',
    category: 'metal',
    color: '#26292B',
    roughness: 0.3,
    metalness: 0.8,
    isProcedural: true,
  },
];


export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  snapGrid: SNAP_PRESETS.ONE_INCH,
  showRulers: true,
  showDimensions: true,
  showRoomLabels: true,
  orthogonalSnap: true,
  showUnderlay: true,
  showRoof3D: true,
  showMepLayer: true,
  sunTimeHours: 14.5, // 2:30 PM bright afternoon sunlight
  showSitePlan: false,
  showSolarShadows: true,
  activeSectionCutId: 'sec_AA',
  sectionCutClipping3D: false,
  dollhouseCutHeightPercent: 100,
  defaultCeilingHeight: feetInchesToSixteenths(10, 0), // 10' 0"
  defaultExteriorWallThickness: feetInchesToSixteenths(0, 9), // 9"
  defaultInteriorWallThickness: 72, // 4.5" (4 1/2 inches)
  defaultDoorHeight: feetInchesToSixteenths(7, 0), // 7' 0"
  defaultDoorWidth: feetInchesToSixteenths(3, 0), // 3' 0"
  defaultWindowHeight: feetInchesToSixteenths(4, 0), // 4' 0"
  defaultWindowSill: feetInchesToSixteenths(2, 6), // 2' 6"
  defaultVentilatorSill: feetInchesToSixteenths(6, 6), // 6' 6"
};

/**
 * Creates a clean starter project with a 24' x 16' room, front door, and windows.
 */
export function createDefaultProject(): Project {
  const floorId = 'floor_ground';
  const wallThickness = feetInchesToSixteenths(0, 6); // 6" = 96
  const wallHeight = feetInchesToSixteenths(9, 0);    // 9' 0" = 1728

  // Room coordinates: 24' x 16'
  // Coordinates centered around (0, 0)
  // Half width: 12' = 2304, Half height: 8' = 1536
  const x1 = -feetInchesToSixteenths(12, 0); // -2304
  const y1 = -feetInchesToSixteenths(8, 0);  // -1536
  const x2 = feetInchesToSixteenths(12, 0);  // 2304
  const y2 = feetInchesToSixteenths(8, 0);   // 1536

  // 4 walls
  const wallSouth: Wall = {
    id: 'wall_south',
    floorId,
    start: { x: x1, y: y1 },
    end: { x: x2, y: y1 },
    thickness: wallThickness,
    height: wallHeight,
    openings: [
      {
        id: 'opening_front_door',
        wallId: 'wall_south',
        name: 'Front Entry Door',
        type: 'door',
        offsetAlongWall: feetInchesToSixteenths(10, 6), // centered along 24' wall
        width: feetInchesToSixteenths(3, 0),          // 3' 0"
        height: feetInchesToSixteenths(6, 8),         // 6' 8"
        elevation: 0,
        flipInward: true,
        flipHand: true,
      },
    ],
  };

  const wallEast: Wall = {
    id: 'wall_east',
    floorId,
    start: { x: x2, y: y1 },
    end: { x: x2, y: y2 },
    thickness: wallThickness,
    height: wallHeight,
    openings: [
      {
        id: 'opening_window_east',
        wallId: 'wall_east',
        name: 'East Window',
        type: 'window',
        offsetAlongWall: feetInchesToSixteenths(6, 0),
        width: feetInchesToSixteenths(4, 0),
        height: feetInchesToSixteenths(4, 0),
        elevation: feetInchesToSixteenths(3, 0),
        flipInward: false,
        flipHand: false,
      },
    ],
  };

  const wallNorth: Wall = {
    id: 'wall_north',
    floorId,
    start: { x: x2, y: y2 },
    end: { x: x1, y: y2 },
    thickness: wallThickness,
    height: wallHeight,
    openings: [
      {
        id: 'opening_window_north_1',
        wallId: 'wall_north',
        name: 'North Window Left',
        type: 'window',
        offsetAlongWall: feetInchesToSixteenths(6, 0),
        width: feetInchesToSixteenths(4, 0),
        height: feetInchesToSixteenths(4, 0),
        elevation: feetInchesToSixteenths(3, 0),
        flipInward: false,
        flipHand: false,
      },
      {
        id: 'opening_window_north_2',
        wallId: 'wall_north',
        name: 'North Window Right',
        type: 'window',
        offsetAlongWall: feetInchesToSixteenths(14, 0),
        width: feetInchesToSixteenths(4, 0),
        height: feetInchesToSixteenths(4, 0),
        elevation: feetInchesToSixteenths(3, 0),
        flipInward: false,
        flipHand: false,
      },
    ],
  };

  const wallWest: Wall = {
    id: 'wall_west',
    floorId,
    start: { x: x1, y: y2 },
    end: { x: x1, y: y1 },
    thickness: wallThickness,
    height: wallHeight,
    openings: [],
  };

  const groundFloor: Floor = {
    id: floorId,
    name: 'Ground Floor',
    levelIndex: 0,
    elevation: 0,
    ceilingHeight: wallHeight,
    defaultWallThickness: wallThickness,
    slabThickness: feetInchesToSixteenths(1, 0), // 1' 0" = 192
    walls: [wallSouth, wallEast, wallNorth, wallWest],
    rooms: [
      {
        id: 'room_living',
        floorId,
        name: 'Living Room',
        wallIds: ['wall_south', 'wall_east', 'wall_north', 'wall_west'],
        polygon: [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
        ],
        floorMaterialId: 'mat_oak_hardwood',
        ceilingMaterialId: 'mat_interior_paint_white',
        computedAreaSqFt: 384, // 24' * 16'
      },
    ],
    slabs: [
      {
        id: 'slab_ground',
        floorId,
        polygon: [
          { x: x1 - wallThickness, y: y1 - wallThickness },
          { x: x2 + wallThickness, y: y1 - wallThickness },
          { x: x2 + wallThickness, y: y2 + wallThickness },
          { x: x1 - wallThickness, y: y2 + wallThickness },
        ],
        thickness: feetInchesToSixteenths(0, 4), // 4"
        elevation: 0,
        materialId: 'mat_oak_hardwood',
      },
    ],
    furniture: [],
    stairs: [],
    columns: [],
    symbols: [],
    sections: [
      {
        id: 'sec_AA',
        name: "Section A-A'",
        label: 'A',
        sheetRef: 'A-301',
        p1: { x: x1 - feetInchesToSixteenths(3, 0), y: 0 },
        p2: { x: x2 + feetInchesToSixteenths(3, 0), y: 0 },
        viewDirection: 'left',
      },
    ],
  };

  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: `project_${Date.now()}`,
    name: 'My New House',
    createdAt: now,
    updatedAt: now,
    floors: [groundFloor],
    activeFloorId: floorId,
    materials: DEFAULT_MATERIALS,
    savedCameras: [
      {
        id: 'cam_orbit_front',
        name: 'Front Perspective View',
        state: {
          mode: '3d-orbit',
          position: {
            x: 0,
            y: -feetInchesToSixteenths(35, 0),
            z: feetInchesToSixteenths(20, 0),
          },
          target: { x: 0, y: 0, z: feetInchesToSixteenths(4, 6) },
          fov: 45,
          eyeHeight: feetInchesToSixteenths(5, 6),
        },
      },
    ],
    settings: DEFAULT_PROJECT_SETTINGS,
    site: createDefaultSitePlan(),
  };
}
