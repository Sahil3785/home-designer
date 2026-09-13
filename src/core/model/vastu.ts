import { Point2D, Room, Floor, Project } from './types';

export type VastuSector =
  | 'NE' // Ishanya (Water/Spiritual)
  | 'E'  // Indra (Sun/Light)
  | 'SE' // Agni (Fire/Energy)
  | 'S'  // Yama (Earth/Strength)
  | 'SW' // Nairutya (Earth/Stability)
  | 'W'  // Varuna (Water/Prosperity)
  | 'NW' // Vayu (Air/Movement)
  | 'N'  // Kubera (Wealth/Growth)
  | 'Center'; // Brahmasthan (Ether/Core)

export interface VastuSectorInfo {
  sector: VastuSector;
  sanskritName: string;
  deity: string;
  element: string;
  color: string;
  idealRooms: string[];
  avoidRooms: string[];
  description: string;
}

export const VASTU_SECTOR_DEFS: Record<VastuSector, VastuSectorInfo> = {
  NE: {
    sector: 'NE',
    sanskritName: 'Ishanya (ईशान्य)',
    deity: 'Lord Shiva / Ishana',
    element: 'Water (Jala)',
    color: '#38bdf8',
    idealRooms: ['Pooja Room', 'Meditation', 'Study Room', 'Living Room', 'Main Entrance', 'Water Sump'],
    avoidRooms: ['Kitchen', 'Toilet', 'Heavy Storage', 'Master Bedroom'],
    description: 'Zone of divine energy, wisdom, and clarity. Keep clean, light, and open.',
  },
  E: {
    sector: 'E',
    sanskritName: 'Purva / Indra (पूर्व)',
    deity: 'Lord Indra / Surya',
    element: 'Light & Solar Energy',
    color: '#fbbf24',
    idealRooms: ['Main Entrance', 'Living Room', 'Study', 'Verandah', 'Balcony'],
    avoidRooms: ['Toilet', 'Heavy Storage'],
    description: 'Brings morning vitality, positive networking, and social prosperity.',
  },
  SE: {
    sector: 'SE',
    sanskritName: 'Agneya (आग्नेय)',
    deity: 'Lord Agni (Fire)',
    element: 'Fire (Agni)',
    color: '#f97316',
    idealRooms: ['Kitchen', 'Cooktop Hob', 'Electrical Inverter / DB Panel', 'Geyser'],
    avoidRooms: ['Master Bedroom', 'Pooja Room', 'Underground Water', 'Toilet'],
    description: 'Prime direction of culinary fire, metabolism, passion, and radiant vitality.',
  },
  S: {
    sector: 'S',
    sanskritName: 'Dakshina (दक्षिण)',
    deity: 'Lord Yama',
    element: 'Earth & Discipline',
    color: '#eab308',
    idealRooms: ['Bedrooms', 'Staircase', 'Store Room', 'Office'],
    avoidRooms: ['Pooja Room', 'Main Entrance', 'Underground Water'],
    description: 'Zone of fame, strength, rest, and relaxed sound sleep.',
  },
  SW: {
    sector: 'SW',
    sanskritName: 'Nairutya (नैऋत्य)',
    deity: 'Lord Nirriti / Earth',
    element: 'Earth (Prithvi)',
    color: '#b45309',
    idealRooms: ['Master Bedroom', 'Head of Family', 'Wardrobes / Heavy Safes'],
    avoidRooms: ['Main Entrance', 'Pooja Room', 'Kitchen', 'Underground Water', 'Toilet'],
    description: 'Highest stability, leadership, longevity, and financial anchoring.',
  },
  W: {
    sector: 'W',
    sanskritName: 'Pashchima (पश्चिम)',
    deity: 'Lord Varuna',
    element: 'Water / Space',
    color: '#64748b',
    idealRooms: ['Dining Room', 'Children Bedroom', 'Study', 'Overhead Water Tank'],
    avoidRooms: ['Main Entrance (certain padas)', 'Pooja Room'],
    description: 'Zone of profitability, successful investments, learning, and dining.',
  },
  NW: {
    sector: 'NW',
    sanskritName: 'Vayavya (वायव्य)',
    deity: 'Lord Vayu (Wind)',
    element: 'Air (Vayu)',
    color: '#a855f7',
    idealRooms: ['Guest Bedroom', 'Bathroom / Toilet', 'Pantry', 'Garage / Parking'],
    avoidRooms: ['Master Bedroom', 'Pooja Room'],
    description: 'Zone of healthy movement, visitors, travel, and swift transitions.',
  },
  N: {
    sector: 'N',
    sanskritName: 'Uttara (उत्तर)',
    deity: 'Lord Kubera',
    element: 'Water & Magnetism',
    color: '#10b981',
    idealRooms: ['Living Room', 'Cash Locker / Treasury', 'Study', 'Main Entrance'],
    avoidRooms: ['Kitchen', 'Toilet', 'Heavy Storage'],
    description: 'Magnetic zone of new opportunities, business growth, and wealth creation.',
  },
  Center: {
    sector: 'Center',
    sanskritName: 'Brahmasthan (ब्रह्मस्थान)',
    deity: 'Lord Brahma',
    element: 'Ether / Space (Akash)',
    color: '#ec4899',
    idealRooms: ['Open Courtyard / Atrium', 'Central Hall / Light Circulation'],
    avoidRooms: ['Heavy Walls', 'Columns', 'Staircase', 'Kitchen', 'Toilet'],
    description: 'The energetic navel of the home. Must remain unobstructed, bright, and harmonious.',
  },
};

export interface RoomVastuAudit {
  roomId: string;
  roomName: string;
  sector: VastuSector;
  sectorInfo: VastuSectorInfo;
  status: 'auspicious' | 'acceptable' | 'inauspicious';
  score: number; // 0 to 100
  notes: string;
  remedy?: string;
}

export interface VastuProjectReport {
  overallScore: number; // 0 to 100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Needs Remedies';
  northOrientation: number;
  totalRoomsAudited: number;
  auspiciousCount: number;
  acceptableCount: number;
  inauspiciousCount: number;
  roomAudits: RoomVastuAudit[];
  generalRemedies: string[];
}

/**
 * Computes polygon centroid of a 2D closed polygon.
 */
export function computeCentroid(polygon: Point2D[]): Point2D {
  if (polygon.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const pt of polygon) {
    sx += pt.x;
    sy += pt.y;
  }
  return { x: sx / polygon.length, y: sy / polygon.length };
}

/**
 * Calculates bounding box of all walls on a floor or all floors.
 */
export function computeFloorBoundingBox(floor: Floor): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const w of floor.walls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  }

  if (!isFinite(minX)) {
    minX = -1920;
    maxX = 1920;
    minY = -1920;
    maxY = 1920;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return { minX, maxX, minY, maxY, width, height, centerX, centerY };
}

/**
 * Maps any 2D point (such as room centroid) into one of the 9 Vastu Purusha Mandala sectors.
 * Takes into account the compass North orientation angle in degrees.
 */
export function getPointVastuSector(
  pt: Point2D,
  bbox: { minX: number; maxX: number; minY: number; maxY: number; centerX: number; centerY: number },
  northDegrees: number = 0
): VastuSector {
  // Rotate point relative to center by negative northDegrees
  const rad = (-northDegrees * Math.PI) / 180;
  const dx = pt.x - bbox.centerX;
  const dy = pt.y - bbox.centerY;
  const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
  const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

  const halfW = Math.max(1, (bbox.maxX - bbox.minX) / 2);
  const halfH = Math.max(1, (bbox.maxY - bbox.minY) / 2);

  const relX = rotX / halfW; // -1 (West) to +1 (East)
  const relY = rotY / halfH; // -1 (North) to +1 (South)

  // Brahmasthan is the central 1/3 x 1/3 square
  if (Math.abs(relX) < 0.33 && Math.abs(relY) < 0.33) {
    return 'Center';
  }

  // 8 Directional Sectors based on relative quadrant
  if (relY < -0.33) {
    // Top (North)
    if (relX < -0.33) return 'NW';
    if (relX > 0.33) return 'NE';
    return 'N';
  } else if (relY > 0.33) {
    // Bottom (South)
    if (relX < -0.33) return 'SW';
    if (relX > 0.33) return 'SE';
    return 'S';
  } else {
    // Middle row
    if (relX < -0.33) return 'W';
    if (relX > 0.33) return 'E';
    return 'Center';
  }
}

/**
 * Evaluates a single room against Vastu Shastra rules.
 */
export function auditRoomVastu(room: Room, sector: VastuSector): RoomVastuAudit {
  const sectorInfo = VASTU_SECTOR_DEFS[sector];
  const nameLower = (room.name || '').toLowerCase();

  let status: 'auspicious' | 'acceptable' | 'inauspicious' = 'acceptable';
  let score = 70;
  let notes = `${room.name} placed in ${sectorInfo.sanskritName}.`;
  let remedy: string | undefined = undefined;

  const isKitchen = nameLower.includes('kitchen') || nameLower.includes('rasoi') || nameLower.includes('cook');
  const isMasterBed =
    nameLower.includes('master') || nameLower.includes('bed 1') || nameLower.includes('bedroom 1');
  const isBedroom = nameLower.includes('bed') || nameLower.includes('guest') || nameLower.includes('kids');
  const isPooja =
    nameLower.includes('pooja') ||
    nameLower.includes('puja') ||
    nameLower.includes('prayer') ||
    nameLower.includes('mandir') ||
    nameLower.includes('temple');
  const isToilet =
    nameLower.includes('bath') ||
    nameLower.includes('toilet') ||
    nameLower.includes('wash') ||
    nameLower.includes('wc') ||
    nameLower.includes('powder');
  const isLiving =
    nameLower.includes('living') ||
    nameLower.includes('hall') ||
    nameLower.includes('drawing') ||
    nameLower.includes('lounge');
  const isDining = nameLower.includes('dining') || nameLower.includes('breakfast');

  if (isKitchen) {
    if (sector === 'SE') {
      status = 'auspicious';
      score = 100;
      notes = 'Kitchen in South-East (Agni Zone) is ideal! Fosters positive health, prosperity, and digestive fire.';
    } else if (sector === 'NW') {
      status = 'acceptable';
      score = 80;
      notes = 'Kitchen in North-West (Vayu Zone) is a recognized second-best alternative.';
    } else if (sector === 'NE' || sector === 'SW' || sector === 'Center') {
      status = 'inauspicious';
      score = 25;
      notes = `Kitchen in ${sector} clashes strongly with elemental energy (${sectorInfo.element}).`;
      remedy = 'Place a yellow stone slab or bronze Agni pyramid under the cooktop hob, and ensure cook faces East.';
    } else {
      status = 'acceptable';
      score = 65;
      notes = `Kitchen in ${sector} is workable. Ensure cooktop is placed on the East/South counter run.`;
    }
  } else if (isPooja) {
    if (sector === 'NE') {
      status = 'auspicious';
      score = 100;
      notes = 'Pooja/Prayer in North-East (Ishanya Zone) is supremely auspicious. Maximizes divine cosmic flow.';
    } else if (sector === 'E' || sector === 'N') {
      status = 'auspicious';
      score = 90;
      notes = `Pooja room in ${sector} is very harmonious and brings mental peace.`;
    } else if (sector === 'S' || sector === 'SW') {
      status = 'inauspicious';
      score = 30;
      notes = `Pooja room in ${sector} is considered inauspicious.`;
      remedy = 'Use light ivory/white walls and copper idol stands. Ensure prayer idols face East or North.';
    } else {
      status = 'acceptable';
      score = 60;
    }
  } else if (isMasterBed) {
    if (sector === 'SW') {
      status = 'auspicious';
      score = 100;
      notes = 'Master Bedroom in South-West (Nairutya Zone) establishes rock-solid authority, family stability, and sound sleep.';
    } else if (sector === 'S' || sector === 'W') {
      status = 'acceptable';
      score = 80;
      notes = `Master bedroom in ${sector} provides grounded stability.`;
    } else if (sector === 'NE') {
      status = 'inauspicious';
      score = 25;
      notes = 'Master bedroom in North-East (Water/Divine) causes restless energy and sleep disruption.';
      remedy = 'Ensure head is towards South when sleeping; place heavy furniture against South and West walls.';
    } else if (sector === 'SE') {
      status = 'inauspicious';
      score = 35;
      notes = 'Master bedroom in South-East (Fire) can trigger relationship friction.';
      remedy = 'Use soothing pastel earth/beige tones; avoid bright red colors or mirrors facing the bed.';
    }
  } else if (isToilet) {
    if (sector === 'NW' || sector === 'W') {
      status = 'auspicious';
      score = 95;
      notes = `Toilet / Bathroom in ${sector} facilitates proper detoxification and swift negative energy disposal.`;
    } else if (sector === 'S') {
      status = 'acceptable';
      score = 75;
    } else if (sector === 'NE' || sector === 'Center' || sector === 'SW') {
      status = 'inauspicious';
      score = 20;
      notes = `Toilet in ${sector} creates strong energy drainage.`;
      remedy = 'Keep toilet door strictly closed; place a bowl of natural sea salt / rock salt in the toilet corner.';
    }
  } else if (isLiving) {
    if (sector === 'N' || sector === 'E' || sector === 'NE' || sector === 'NW') {
      status = 'auspicious';
      score = 95;
      notes = `Living room in ${sector} encourages gracious hospitality, guest warmth, and buoyant social energy.`;
    } else {
      status = 'acceptable';
      score = 70;
    }
  } else if (isDining) {
    if (sector === 'W' || sector === 'E' || sector === 'N') {
      status = 'auspicious';
      score = 95;
      notes = `Dining in ${sector} brings nourishing meals, gratitude, and good digestion.`;
    } else {
      status = 'acceptable';
      score = 75;
    }
  }

  return {
    roomId: room.id,
    roomName: room.name,
    sector,
    sectorInfo,
    status,
    score,
    notes,
    remedy,
  };
}

/**
 * Runs a complete Vastu Shastra audit for the current floor plan or project.
 */
export function generateVastuReport(project: Project): VastuProjectReport {
  const activeFloor = project.floors.find((f) => f.id === project.activeFloorId) || project.floors[0];
  const northOrientation = project.site?.northOrientationDegrees || 0;

  if (!activeFloor || activeFloor.rooms.length === 0) {
    return {
      overallScore: 80,
      rating: 'Good',
      northOrientation,
      totalRoomsAudited: 0,
      auspiciousCount: 0,
      acceptableCount: 0,
      inauspiciousCount: 0,
      roomAudits: [],
      generalRemedies: [
        'Ensure the main entrance faces East, North, or North-East for positive energy influx.',
        'Keep the central Brahmasthan open, uncluttered, and well-illuminated.',
        'Position the kitchen cooking hob so that the cook faces East while cooking.',
      ],
    };
  }

  const bbox = computeFloorBoundingBox(activeFloor);
  const roomAudits: RoomVastuAudit[] = [];

  let totalScore = 0;
  let auspiciousCount = 0;
  let acceptableCount = 0;
  let inauspiciousCount = 0;

  for (const room of activeFloor.rooms) {
    const centroid = computeCentroid(room.polygon);
    const sector = getPointVastuSector(centroid, bbox, northOrientation);
    const audit = auditRoomVastu(room, sector);

    roomAudits.push(audit);
    totalScore += audit.score;

    if (audit.status === 'auspicious') auspiciousCount++;
    else if (audit.status === 'acceptable') acceptableCount++;
    else inauspiciousCount++;
  }

  const overallScore = Math.round(totalScore / Math.max(1, roomAudits.length));

  let rating: 'Excellent' | 'Good' | 'Fair' | 'Needs Remedies' = 'Good';
  if (overallScore >= 85) rating = 'Excellent';
  else if (overallScore >= 70) rating = 'Good';
  else if (overallScore >= 50) rating = 'Fair';
  else rating = 'Needs Remedies';

  const generalRemedies: string[] = [
    'Align heavy wardrobes, cupboards, and bed headboards against South and West walls.',
    'Keep North and East sides light with plenty of windows to allow morning solar prana.',
    'Position the kitchen cooking hob so the cook faces East for energetic harmony.',
    'Keep the central Brahmasthan free of heavy pillars, staircase landings, or toilets.',
  ];

  return {
    overallScore,
    rating,
    northOrientation,
    totalRoomsAudited: roomAudits.length,
    auspiciousCount,
    acceptableCount,
    inauspiciousCount,
    roomAudits,
    generalRemedies,
  };
}
