import { feetInchesToSixteenths, Sixteenths } from '../units';
import { FurnitureInstance, Point2D, Point3D } from './types';

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  category: 'bedroom' | 'living' | 'dining' | 'kitchen' | 'bathroom' | 'exterior';
  defaultDimensions: {
    width: Sixteenths;
    depth: Sixteenths;
    height: Sixteenths;
  };
  description: string;
  imageUrl: string;
}

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  // Bedroom & Wardrobes
  {
    id: 'wardrobe_built_in',
    name: 'Built-in Wardrobe / Almirah',
    category: 'bedroom',
    defaultDimensions: {
      width: feetInchesToSixteenths(6, 0), // 6' 0"
      depth: feetInchesToSixteenths(2, 0), // 2' 0" standard depth
      height: feetInchesToSixteenths(7, 0), // 7' 0" height
    },
    description: 'Floor-to-ceiling modern built-in almirah with fluted oak & brass hardware',
    imageUrl: '/assets/furniture/wardrobe_built_in.jpg',
  },
  {
    id: 'bed_king',
    name: 'King Bed with Side Tables',
    category: 'bedroom',
    defaultDimensions: {
      width: feetInchesToSixteenths(6, 6), // 6' 6"
      depth: feetInchesToSixteenths(6, 6), // 6' 6"
      height: feetInchesToSixteenths(3, 0), // 3' 0" headboard
    },
    description: 'Master king bed with tailored upholstered headboard & wooden nightstands',
    imageUrl: '/assets/furniture/bed_king.jpg',
  },
  {
    id: 'bed_queen',
    name: 'Queen Bed',
    category: 'bedroom',
    defaultDimensions: {
      width: feetInchesToSixteenths(5, 0), // 5' 0"
      depth: feetInchesToSixteenths(6, 6), // 6' 6"
      height: feetInchesToSixteenths(2, 8),
    },
    description: 'Tufted linen queen bed with plush layered duvet & solid oak frame',
    imageUrl: '/assets/furniture/bed_queen.jpg',
  },

  // Living Room
  {
    id: 'sofa_3_seater',
    name: '3-Seater Sofa',
    category: 'living',
    defaultDimensions: {
      width: feetInchesToSixteenths(7, 0), // 7' 0"
      depth: feetInchesToSixteenths(3, 0), // 3' 0"
      height: feetInchesToSixteenths(2, 8),
    },
    description: 'Designer 3-seater sofa in warm oat textured fabric with tapered oak legs',
    imageUrl: '/assets/furniture/sofa_3_seater.jpg',
  },
  {
    id: 'sofa_armchair',
    name: 'Living Armchair',
    category: 'living',
    defaultDimensions: {
      width: feetInchesToSixteenths(3, 0),
      depth: feetInchesToSixteenths(3, 0),
      height: feetInchesToSixteenths(2, 8),
    },
    description: 'Scandinavian accent armchair with curved backrest & plush cushioning',
    imageUrl: '/assets/furniture/sofa_armchair.jpg',
  },
  {
    id: 'coffee_table',
    name: 'Coffee Table',
    category: 'living',
    defaultDimensions: {
      width: feetInchesToSixteenths(4, 0),
      depth: feetInchesToSixteenths(2, 0),
      height: feetInchesToSixteenths(1, 4),
    },
    description: 'Solid natural oak coffee table with bottom slatted shelf & beveled edge',
    imageUrl: '/assets/furniture/coffee_table.jpg',
  },

  // Dining Room
  {
    id: 'dining_6_seater',
    name: '6-Seater Dining Set',
    category: 'dining',
    defaultDimensions: {
      width: feetInchesToSixteenths(5, 6),
      depth: feetInchesToSixteenths(3, 2),
      height: feetInchesToSixteenths(2, 6),
    },
    description: 'Luxury solid oak dining table with 6 comfortable upholstered chairs',
    imageUrl: '/assets/furniture/dining_6_seater.jpg',
  },
  {
    id: 'dining_4_seater',
    name: '4-Seater Dining Set',
    category: 'dining',
    defaultDimensions: {
      width: feetInchesToSixteenths(4, 0),
      depth: feetInchesToSixteenths(4, 0),
      height: feetInchesToSixteenths(2, 6),
    },
    description: 'Modern round dining table with 4 curved upholstered dining chairs',
    imageUrl: '/assets/furniture/dining_4_seater.jpg',
  },

  // Kitchen
  {
    id: 'kitchen_counter_sink',
    name: 'Kitchen Counter with Sink',
    category: 'kitchen',
    defaultDimensions: {
      width: feetInchesToSixteenths(8, 0),
      depth: feetInchesToSixteenths(2, 0), // 2' 0" standard counter
      height: feetInchesToSixteenths(2, 10), // 2' 10" (34" high)
    },
    description: 'Calacatta marble counter with undermount sink, gooseneck faucet & navy cabinets',
    imageUrl: '/assets/furniture/kitchen_counter_sink.jpg',
  },
  {
    id: 'kitchen_stove_unit',
    name: 'Kitchen Stove & Hob Unit',
    category: 'kitchen',
    defaultDimensions: {
      width: feetInchesToSixteenths(3, 0),
      depth: feetInchesToSixteenths(2, 0),
      height: feetInchesToSixteenths(2, 10),
    },
    description: '4-burner black tempered glass gas hob with cast iron supports & dials',
    imageUrl: '/assets/furniture/kitchen_stove_unit.jpg',
  },

  // Bathroom & Sanitary
  {
    id: 'toilet_commode',
    name: 'Water Closet (WC) Commode',
    category: 'bathroom',
    defaultDimensions: {
      width: feetInchesToSixteenths(1, 4), // 16"
      depth: feetInchesToSixteenths(2, 4), // 28"
      height: feetInchesToSixteenths(2, 6), // 30"
    },
    description: 'One-piece skirted vitreous china toilet commode with dual-flush chrome buttons',
    imageUrl: '/assets/furniture/toilet_commode.jpg',
  },
  {
    id: 'washbasin_vanity',
    name: 'Washbasin & Vanity',
    category: 'bathroom',
    defaultDimensions: {
      width: feetInchesToSixteenths(2, 0),
      depth: feetInchesToSixteenths(1, 6),
      height: feetInchesToSixteenths(2, 8),
    },
    description: 'Floating oak wood vanity with ceramic vessel sink & tall matte black faucet',
    imageUrl: '/assets/furniture/washbasin_vanity.jpg',
  },

  // Exterior & Porch
  {
    id: 'entry_gate',
    name: 'Main Entry Gate',
    category: 'exterior',
    defaultDimensions: {
      width: feetInchesToSixteenths(10, 0), // 10' 0"
      depth: feetInchesToSixteenths(0, 6), // 6"
      height: feetInchesToSixteenths(5, 6), // 5' 6"
    },
    description: 'Modern driveway gate with matte black steel framing & privacy louvers',
    imageUrl: '/assets/furniture/entry_gate.svg',
  },
  {
    id: 'porch_car',
    name: 'Car Parking Space Marker',
    category: 'exterior',
    defaultDimensions: {
      width: feetInchesToSixteenths(8, 0), // 8' 0"
      depth: feetInchesToSixteenths(15, 0), // 15' 0"
      height: feetInchesToSixteenths(0, 2),
    },
    description: 'Paved porch car parking bay guide with vehicle space indicators',
    imageUrl: '/assets/furniture/porch_car.svg',
  },
];

/**
 * Instantiates a new FurnitureInstance from the catalog.
 */
export function createFurnitureInstance(
  catalogId: string,
  floorId: string,
  pos: Point2D,
  elevation: Sixteenths = 0,
  rotation: number = 0
): FurnitureInstance {
  // Defensive check: if arguments were transposed, auto-resolve correctly
  let resolvedCatId = catalogId;
  let resolvedFloorId = floorId;
  if (
    !FURNITURE_CATALOG.some((c) => c.id === resolvedCatId) &&
    FURNITURE_CATALOG.some((c) => c.id === resolvedFloorId)
  ) {
    resolvedCatId = floorId;
    resolvedFloorId = catalogId;
  }

  const item = FURNITURE_CATALOG.find((c) => c.id === resolvedCatId) || FURNITURE_CATALOG[0];
  return {
    id: `furn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    floorId: resolvedFloorId,
    catalogId: item.id,
    name: item.name,
    category: item.category,
    position: {
      x: pos.x,
      y: pos.y,
      z: elevation,
    },
    rotation,
    dimensions: {
      width: item.defaultDimensions.width,
      depth: item.defaultDimensions.depth,
      height: item.defaultDimensions.height,
    },
  };
}

/**
 * Returns the 4 corner points of a furniture item in CAD world coordinates.
 */
export function getFurnitureFootprint(furniture: FurnitureInstance): Point2D[] {
  const hw = furniture.dimensions.width / 2;
  const hd = furniture.dimensions.depth / 2;
  const cos = Math.cos(furniture.rotation);
  const sin = Math.sin(furniture.rotation);

  const localCorners: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];

  return localCorners.map(([lx, ly]) => ({
    x: Math.round(furniture.position.x + lx * cos - ly * sin),
    y: Math.round(furniture.position.y + lx * sin + ly * cos),
  }));
}

/**
 * Tests if a CAD point is inside a furniture item's 2D footprint.
 */
export function isPointInsideFurniture(point: Point2D, furniture: FurnitureInstance): boolean {
  // Transform point into furniture's local unrotated coordinate space
  const dx = point.x - furniture.position.x;
  const dy = point.y - furniture.position.y;
  const cos = Math.cos(-furniture.rotation);
  const sin = Math.sin(-furniture.rotation);

  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const hw = furniture.dimensions.width / 2;
  const hd = furniture.dimensions.depth / 2;

  return (
    localX >= -hw &&
    localX <= hw &&
    localY >= -hd &&
    localY <= hd
  );
}
