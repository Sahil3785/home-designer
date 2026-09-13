import { Sixteenths } from '../units';

export interface Point2D {
  x: Sixteenths;
  y: Sixteenths;
}

export interface Point3D {
  x: Sixteenths;
  y: Sixteenths;
  z: Sixteenths;
}

export type WallOpeningType = 'door' | 'window' | 'arch' | 'opening' | 'ventilator';

export interface WallOpening {
  id: string;
  wallId: string;
  name: string;
  type: WallOpeningType;
  /** Distance from wall.start along the center line in sixteenths */
  offsetAlongWall: Sixteenths;
  width: Sixteenths;
  height: Sixteenths;
  /** Sill height above floor level in sixteenths (0 for standard door, 6'6" for ventilator) */
  elevation: Sixteenths;
  /** Swing direction (true = swing inside, false = swing outside) */
  flipInward: boolean;
  /** Hinge position (true = right hinge, false = left hinge) */
  flipHand: boolean;
  /** Interactive 3D door swing state (true = open 90°, false = closed) */
  isOpen?: boolean;
}

export type SymbolCategory = 'electrical' | 'plumbing' | 'hvac';

export type SymbolType =
  | 'light_point'
  | 'fan_point'
  | 'socket_outlet'
  | 'switchboard'
  | 'db_board'
  | 'ac_indoor'
  | 'geyser'
  | 'drain_point'
  | 'water_tap';

export interface ArchitecturalSymbol {
  id: string;
  floorId: string;
  name: string;
  type: SymbolType;
  category: SymbolCategory;
  position: Point2D;
  /** Rotation angle in radians */
  rotation: number;
  /** Mounting height above floor slab in sixteenths */
  elevation: Sixteenths;
  /** Optional wattage rating for electrical load calculation */
  wattage?: number;
  /** Optional circuit identification tag (e.g. "C-1") */
  circuit?: string;
}

export interface Wall {
  id: string;
  floorId: string;
  start: Point2D;
  end: Point2D;
  thickness: Sixteenths;
  height: Sixteenths;
  openings: WallOpening[];
  materialExteriorId?: string;
  materialInteriorId?: string;
}

export interface FlooringConfig {
  tilePattern?: 'grid' | 'staggered' | 'herringbone';
  jointPattern?: 'grid' | 'staggered' | 'herringbone';
  tileSizeInches?: number; // e.g. 12, 24, 48
  groutColor?: string;
  groutWidthMm?: number;
  finishSheen?: 'matte' | 'satin' | 'glossy';
  sheen?: 'matte' | 'satin' | 'glossy';
  roughness?: number;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  wallIds: string[];
  polygon: Point2D[];
  floorMaterialId?: string;
  ceilingMaterialId?: string;
  computedAreaSqFt?: number;
  flooringConfig?: FlooringConfig;
}

export interface Slab {
  id: string;
  floorId: string;
  polygon: Point2D[];
  thickness: Sixteenths;
  elevation: Sixteenths;
  materialId?: string;
}

export interface FurnitureInstance {
  id: string;
  floorId: string;
  catalogId: string;
  name: string;
  category: string;
  position: Point3D;
  /** Rotation around Y axis in radians */
  rotation: number;
  dimensions: {
    width: Sixteenths;
    depth: Sixteenths;
    height: Sixteenths;
  };
  materialOverrides?: Record<string, string>;
}

export type StaircaseType = 'straight' | 'l-shaped' | 'u-shaped';

export interface Staircase {
  id: string;
  floorId: string;
  name: string;
  type: StaircaseType;
  startPoint: Point2D;
  /** Rotation angle in radians (0 = run extends along +X) */
  angle: number;
  width: Sixteenths;
  /** Total vertical rise from this floor to floor above */
  totalRise: Sixteenths;
  riserCount: number;
  riserHeight: Sixteenths;
  treadDepth: Sixteenths;
  landingDepth: Sixteenths;
  hasHandrail: boolean;
  handrailSide: 'both' | 'left' | 'right';
}

export type ColumnShape = 'rectangular' | 'round';

export interface Column {
  id: string;
  floorId: string;
  name: string;
  position: Point2D;
  shape: ColumnShape;
  width: Sixteenths;
  depth: Sixteenths;
  height: Sixteenths;
  /** Rotation around vertical axis in radians */
  rotation?: number;
  materialId?: string;
}

export type RoofType = 'gable' | 'hip' | 'flat' | 'shed';

export interface Roof {
  id: string;
  floorId: string;
  type: RoofType;
  /** Rise over 12" run (e.g. 6 means 6/12 pitch, ~26.6°) */
  pitch: number;
  /** Eave overhang in sixteenths (e.g. 1' 0" = 192) */
  overhang: Sixteenths;
  /** Fascia / rafter edge thickness in sixteenths (e.g. 6" = 96) */
  thickness: Sixteenths;
  /** Ridge orientation for gable/shed: 'x' or 'y' */
  ridgeAxis: 'x' | 'y';
  materialId?: string;
  visible?: boolean;
}

export interface ReferencePlan {
  id: string;
  floorId: string;
  fileName: string;
  imageUrl: string;
  /** CAD world origin (top-left) in Sixteenths */
  x: Sixteenths;
  y: Sixteenths;
  /** Calibrated CAD world width and height in Sixteenths */
  width: Sixteenths;
  height: Sixteenths;
  /** Original natural pixel dimensions of the imported image */
  naturalWidth: number;
  naturalHeight: number;
  /** Sixteenths per natural image pixel */
  scale: number;
  /** Opacity from 0.05 to 1.0 (default 0.5) */
  opacity: number;
  /** When locked, canvas clicks pass directly through to CAD drawing tools */
  isLocked: boolean;
  /** Layer visibility */
  isVisible: boolean;
  /** Has the plan been calibrated using 2 known points */
  isCalibrated: boolean;
  /** Recorded calibration points and entered dimension */
  calibrationData?: {
    p1: Point2D;
    p2: Point2D;
    knownDistance: Sixteenths;
  };
}

export interface SectionCut {
  id: string;
  name: string; // e.g. "Section A-A'"
  p1: Point2D;
  p2: Point2D;
  viewDirection: 'left' | 'right'; // Which side of the line is viewed
  label: string; // "A", "B", etc.
  sheetRef?: string; // "A-301"
}

export interface Floor {
  id: string;
  name: string;
  levelIndex: number;
  elevation: Sixteenths;
  ceilingHeight: Sixteenths;
  defaultWallThickness: Sixteenths;
  slabThickness?: Sixteenths;
  walls: Wall[];
  rooms: Room[];
  slabs: Slab[];
  furniture: FurnitureInstance[];
  stairs?: Staircase[];
  columns?: Column[];
  roof?: Roof;
  referencePlan?: ReferencePlan;
  symbols?: ArchitecturalSymbol[];
  sections?: SectionCut[];
  floorMaterialId?: string;
  flooringConfig?: FlooringConfig;
  kitchens?: import('./kitchen').KitchenDesign[];
}

export type MaterialCategory =
  | 'paint'
  | 'wood'
  | 'tile'
  | 'marble'
  | 'pvc'
  | 'brick'
  | 'glass'
  | 'metal'
  | 'concrete'
  | 'fabric';

export interface MaterialDef {
  id: string;
  name: string;
  category: MaterialCategory;
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  textureUrl?: string;
  isProcedural?: boolean;
}

export type ViewMode = '2d' | '3d-orbit' | 'first-person' | 'split';

export interface CameraState {
  mode: ViewMode;
  position: Point3D;
  target: Point3D;
  fov: number;
  /** Eye height for first person walkthrough, default 5' 6" = 1056 sixteenths */
  eyeHeight: Sixteenths;
}

export interface ProjectSettings {
  snapGrid: Sixteenths;
  showRulers: boolean;
  showDimensions: boolean;
  showRoomLabels: boolean;
  orthogonalSnap: boolean;
  showUnderlay?: boolean;
  showRoof3D?: boolean;
  showMepLayer?: boolean;
  sunTimeHours?: number; // 0.0 to 24.0 (e.g. 14.5 = 2:30 PM)
  showSitePlan?: boolean;
  showSolarShadows?: boolean;
  activeSectionCutId?: string;
  sectionCutClipping3D?: boolean;
  dollhouseCutHeightPercent?: number; // 0 to 100 for 3D horizontal slice
  // Project architectural dimension defaults in pure feet/inches (sixteenths)
  defaultCeilingHeight?: Sixteenths;
  defaultExteriorWallThickness?: Sixteenths;
  defaultInteriorWallThickness?: Sixteenths;
  defaultDoorHeight?: Sixteenths;
  defaultDoorWidth?: Sixteenths;
  defaultWindowHeight?: Sixteenths;
  defaultWindowWidth?: Sixteenths;
  defaultWindowSill?: Sixteenths;
  defaultWindowSillHeight?: Sixteenths;
  defaultVentilatorWidth?: Sixteenths;
  defaultVentilatorHeight?: Sixteenths;
  defaultVentilatorSill?: Sixteenths;
  defaultVentilatorSillHeight?: Sixteenths;
  showVastuGrid?: boolean;
  northAngle?: number; // Compass North orientation in degrees (0 = up/top of screen)
  showKitchens?: boolean;
}

export type { OutdoorFeature, OutdoorFeatureType, SitePlan } from './site';
export type {
  KitchenDesign,
  KitchenCabinetUnit,
  KitchenAppliance,
  KitchenLayoutType,
  CabinetUnitType,
  CountertopMaterial,
  CountertopEdge,
  CabinetFinish,
  ShutterStyle,
  HandleStyle,
} from './kitchen';

export interface Project {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  floors: Floor[];
  activeFloorId: string;
  materials: MaterialDef[];
  savedCameras: { id: string; name: string; state: CameraState }[];
  settings: ProjectSettings;
  site?: import('./site').SitePlan;
}
