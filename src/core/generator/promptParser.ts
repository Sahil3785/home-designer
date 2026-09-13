import { Sixteenths, feetInchesToSixteenths, SIXTEENTHS_PER_FOOT } from '../units';

export type RoomCategory =
  | 'living'
  | 'bedroom'
  | 'master_bedroom'
  | 'kitchen'
  | 'dining'
  | 'bathroom'
  | 'attached_toilet'
  | 'puja'
  | 'balcony'
  | 'study'
  | 'utility';

export type ZonePlacement = 'NE' | 'NW' | 'SE' | 'SW' | 'N' | 'S' | 'E' | 'W' | 'C' | 'ANY';

export interface RoomSpec {
  id: string;
  name: string;
  category: RoomCategory;
  widthFt: number;
  depthFt: number;
  preferredZone: ZonePlacement;
  attachedToId?: string; // e.g. toilet attached to master bedroom
}

export interface PlanGenerationSpec {
  title: string;
  plotWidthFt: number;
  plotDepthFt: number;
  rooms: RoomSpec[];
  vastuCompliant: boolean;
  autoFurniture: boolean;
  exteriorWallThicknessInches: number;
  interiorWallThicknessInches: number;
  ceilingHeightFt: number;
}

export const QUICK_TEMPLATES: { label: string; prompt: string; description: string; bhk: string }[] = [
  {
    label: '✨ 3 BHK Luxury Villa (40′ × 50′)',
    bhk: '3 BHK',
    description: 'Spacious 3 bedroom house with master suite, attached baths, modular kitchen & puja room',
    prompt: '3 BHK 40x50 with master bedroom 14x16 in SW with attached toilet 6x8, bedroom 12x14 in NW, bedroom 12x12 in North, modular kitchen 10x12 in SE, living hall 18x22 in NE, dining 12x14, puja room 6x6 in NE, common toilet 6x7',
  },
  {
    label: '🏠 2 BHK Modern Home (30′ × 40′)',
    bhk: '2 BHK',
    description: 'Optimal family home with 2 bedrooms, open kitchen dining, living room and 2 toilets',
    prompt: '2 BHK 30x40 with master bedroom 13x14 in SW with attached toilet 5x7, guest bedroom 11x12 in NW, kitchen 9x11 in SE, living room 15x18 in NE, common bath 5x7',
  },
  {
    label: '🧭 Vastu-Harmonious 3 BHK (35′ × 45′)',
    bhk: '3 BHK',
    description: 'Strict 9-zone Vastu Shastra compliant plan (Master in SW, Kitchen in SE Agni, Living in NE Ishanya)',
    prompt: 'Vastu compliant 3 BHK 35x45 with master bed 14x15 in south west, kitchen 10x12 in south east, living 16x20 in north east, puja 6x6 in east, bedroom 12x13 in north west, bedroom 11x12 in west, 2 attached toilets',
  },
  {
    label: '🏢 1 BHK Studio / Compact (20′ × 30′)',
    bhk: '1 BHK',
    description: 'Efficient compact home with master bedroom, living hall, kitchen and bathroom',
    prompt: '1 BHK 20x30 with bedroom 11x13 in SW, living room 12x15 in NE, kitchen 8x10 in SE, bathroom 5x7',
  },
  {
    label: '🏰 4 BHK Executive Duplex (45′ × 60′)',
    bhk: '4 BHK',
    description: 'Grand luxury 4 bedroom residence with master suites, formal living, dining, puja, study & utility',
    prompt: '4 BHK 45x60 with master bedroom 16x18 in SW with attached toilet 8x10, 3 bedrooms 14x14, grand living hall 20x26 in NE, kitchen 12x14 in SE with utility, dining 14x16, study 10x12, puja 7x7 in NE',
  },
];

/**
 * Standard default dimensions (in feet) for various room categories.
 */
export const DEFAULT_ROOM_DIMENSIONS: Record<RoomCategory, { widthFt: number; depthFt: number; name: string; defaultZone: ZonePlacement }> = {
  master_bedroom: { widthFt: 14, depthFt: 15, name: 'Master Bedroom', defaultZone: 'SW' },
  bedroom: { widthFt: 12, depthFt: 13, name: 'Bedroom', defaultZone: 'NW' },
  living: { widthFt: 16, depthFt: 18, name: 'Living Room', defaultZone: 'NE' },
  kitchen: { widthFt: 10, depthFt: 12, name: 'Modular Kitchen', defaultZone: 'SE' },
  dining: { widthFt: 11, depthFt: 13, name: 'Dining Room', defaultZone: 'E' },
  bathroom: { widthFt: 6, depthFt: 7, name: 'Common Bathroom', defaultZone: 'W' },
  attached_toilet: { widthFt: 5, depthFt: 7, name: 'Attached Toilet', defaultZone: 'SW' },
  puja: { widthFt: 6, depthFt: 6, name: 'Puja Room', defaultZone: 'NE' },
  study: { widthFt: 10, depthFt: 11, name: 'Study / Home Office', defaultZone: 'N' },
  balcony: { widthFt: 10, depthFt: 5, name: 'Balcony', defaultZone: 'N' },
  utility: { widthFt: 7, depthFt: 6, name: 'Utility / Wash', defaultZone: 'SE' },
};

/**
 * Natural language parser that extracts plot sizes, room counts, dimensions, and zone preferences.
 * 100% offline, deterministic, and instant without API keys!
 */
export function parseFloorPlanPrompt(prompt: string): PlanGenerationSpec {
  const cleanPrompt = prompt.toLowerCase();

  // 1. Detect Plot Dimensions (e.g. "30x40", "40' x 50'", "35 by 45", "30*40")
  let plotWidthFt = 35;
  let plotDepthFt = 45;

  const plotDimRegex = /(?:plot|size|site|dimension)?\s*(\d{2,3})\s*(?:x|\*|by|'|ft|\s)\s*(\d{2,3})/i;
  const plotMatch = cleanPrompt.match(plotDimRegex);
  if (plotMatch) {
    const w = parseInt(plotMatch[1], 10);
    const d = parseInt(plotMatch[2], 10);
    if (w >= 15 && w <= 150 && d >= 15 && d <= 150) {
      plotWidthFt = w;
      plotDepthFt = d;
    }
  }

  // 2. Check Vastu preference
  const vastuCompliant = /vastu|vaastu|shastra|ishanya|agni|nairutya|vayavya/i.test(cleanPrompt);

  // 3. Extract BHK intent if specified (e.g. "3 bhk", "2bhk", "4 bedroom")
  let bhkCount = 2;
  const bhkMatch = cleanPrompt.match(/(\d)\s*(?:bhk|bedroom|bed|room)/i);
  if (bhkMatch) {
    bhkCount = Math.max(1, Math.min(6, parseInt(bhkMatch[1], 10)));
  }

  const rooms: RoomSpec[] = [];
  let roomCounter = 1;

  // Helper to parse individual room dimensions e.g. "master bedroom 14x16"
  const extractRoomDim = (segment: string, fallbackW: number, fallbackD: number) => {
    const dimMatch = segment.match(/(\d{1,2}(?:\.\d+)?)\s*(?:x|\*|by|'|ft)\s*(\d{1,2}(?:\.\d+)?)/i);
    if (dimMatch) {
      return {
        widthFt: Math.max(4, Math.min(40, parseFloat(dimMatch[1]))),
        depthFt: Math.max(4, Math.min(40, parseFloat(dimMatch[2]))),
      };
    }
    return { widthFt: fallbackW, depthFt: fallbackD };
  };

  // Helper to detect zone from text
  const extractZone = (segment: string, fallback: ZonePlacement): ZonePlacement => {
    if (/south\s*west|sw|nairutya/i.test(segment)) return 'SW';
    if (/south\s*east|se|agni/i.test(segment)) return 'SE';
    if (/north\s*east|ne|ishanya/i.test(segment)) return 'NE';
    if (/north\s*west|nw|vayavya/i.test(segment)) return 'NW';
    if (/\bnorth\b|\bn\b/i.test(segment)) return 'N';
    if (/\bsouth\b|\bs\b/i.test(segment)) return 'S';
    if (/\beast\b|\be\b/i.test(segment)) return 'E';
    if (/\bwest\b|\bw\b/i.test(segment)) return 'W';
    if (/\bcenter\b|\bmiddle\b|\bbrahmasthan\b/i.test(segment)) return 'C';
    return fallback;
  };

  // 4. Extract Living Room
  const livingMatch = cleanPrompt.match(/living[^\,\.\;]*/i);
  const livingDim = extractRoomDim(
    livingMatch ? livingMatch[0] : '',
    bhkCount >= 3 ? 18 : 15,
    bhkCount >= 3 ? 20 : 16
  );
  const livingZone = livingMatch ? extractZone(livingMatch[0], 'NE') : 'NE';
  rooms.push({
    id: `spec_living_${roomCounter++}`,
    name: 'Living Hall',
    category: 'living',
    widthFt: livingDim.widthFt,
    depthFt: livingDim.depthFt,
    preferredZone: livingZone,
  });

  // 5. Extract Kitchen
  const kitchenMatch = cleanPrompt.match(/kitchen[^\,\.\;]*/i);
  const kitchenDim = extractRoomDim(kitchenMatch ? kitchenMatch[0] : '', 10, 12);
  const kitchenZone = kitchenMatch ? extractZone(kitchenMatch[0], 'SE') : 'SE';
  rooms.push({
    id: `spec_kitchen_${roomCounter++}`,
    name: 'Modular Kitchen',
    category: 'kitchen',
    widthFt: kitchenDim.widthFt,
    depthFt: kitchenDim.depthFt,
    preferredZone: kitchenZone,
  });

  // 6. Extract Master Bedroom & Attached Toilet
  const masterMatch = cleanPrompt.match(/master[^\,\.\;]*/i);
  const masterDim = extractRoomDim(
    masterMatch ? masterMatch[0] : '',
    bhkCount >= 3 ? 14 : 13,
    bhkCount >= 3 ? 16 : 14
  );
  const masterZone = masterMatch ? extractZone(masterMatch[0], 'SW') : 'SW';
  const masterId = `spec_master_${roomCounter++}`;
  rooms.push({
    id: masterId,
    name: 'Master Bedroom',
    category: 'master_bedroom',
    widthFt: masterDim.widthFt,
    depthFt: masterDim.depthFt,
    preferredZone: masterZone,
  });

  // Attached toilet to master bedroom
  const hasAttached = /attached|ensuite/i.test(cleanPrompt) || masterMatch != null;
  if (hasAttached) {
    const attachedMatch = cleanPrompt.match(/(?:attached|master)\s*(?:toilet|bath|washroom|wc)[^\,\.\;]*/i);
    const attDim = extractRoomDim(attachedMatch ? attachedMatch[0] : '', 5.5, 7.5);
    rooms.push({
      id: `spec_att_toilet_${roomCounter++}`,
      name: 'Master Bath (Attached)',
      category: 'attached_toilet',
      widthFt: attDim.widthFt,
      depthFt: attDim.depthFt,
      preferredZone: masterZone,
      attachedToId: masterId,
    });
  }

  // 7. Additional Bedrooms based on BHK count
  const extraBedroomsNeeded = Math.max(0, bhkCount - 1);
  const zoneCycle: ZonePlacement[] = ['NW', 'N', 'W', 'S'];

  for (let i = 0; i < extraBedroomsNeeded; i++) {
    const bedName = i === 0 ? 'Bedroom 2 (Guest)' : i === 1 ? 'Bedroom 3 (Kids)' : `Bedroom ${i + 2}`;
    const bedZone = zoneCycle[i % zoneCycle.length];
    rooms.push({
      id: `spec_bed_${roomCounter++}`,
      name: bedName,
      category: 'bedroom',
      widthFt: 12,
      depthFt: 13,
      preferredZone: bedZone,
    });
  }

  // 8. Dining Room (if mentioned or if >= 3 BHK)
  if (/dining/i.test(cleanPrompt) || bhkCount >= 3) {
    const diningMatch = cleanPrompt.match(/dining[^\,\.\;]*/i);
    const diningDim = extractRoomDim(diningMatch ? diningMatch[0] : '', 11, 13);
    rooms.push({
      id: `spec_dining_${roomCounter++}`,
      name: 'Dining Room',
      category: 'dining',
      widthFt: diningDim.widthFt,
      depthFt: diningDim.depthFt,
      preferredZone: 'E',
    });
  }

  // 9. Common Bathroom
  const commonBathMatch = cleanPrompt.match(/(?:common|public|guest)\s*(?:bath|toilet|washroom)[^\,\.\;]*/i);
  const comDim = extractRoomDim(commonBathMatch ? commonBathMatch[0] : '', 5.5, 7);
  rooms.push({
    id: `spec_com_bath_${roomCounter++}`,
    name: 'Common Bathroom',
    category: 'bathroom',
    widthFt: comDim.widthFt,
    depthFt: comDim.depthFt,
    preferredZone: 'W',
  });

  // 10. Puja Room (if mentioned or Vastu)
  if (/puja|pooja|prayer|mandir/i.test(cleanPrompt) || vastuCompliant) {
    const pujaMatch = cleanPrompt.match(/(?:puja|pooja|prayer|mandir)[^\,\.\;]*/i);
    const pujaDim = extractRoomDim(pujaMatch ? pujaMatch[0] : '', 6, 6);
    rooms.push({
      id: `spec_puja_${roomCounter++}`,
      name: 'Puja Room',
      category: 'puja',
      widthFt: pujaDim.widthFt,
      depthFt: pujaDim.depthFt,
      preferredZone: 'NE',
    });
  }

  // 11. Study / Balcony / Utility if mentioned
  if (/study|office|work/i.test(cleanPrompt)) {
    rooms.push({
      id: `spec_study_${roomCounter++}`,
      name: 'Study / Office',
      category: 'study',
      widthFt: 10,
      depthFt: 11,
      preferredZone: 'N',
    });
  }

  if (/balcony|terrace|verandah/i.test(cleanPrompt)) {
    rooms.push({
      id: `spec_balcony_${roomCounter++}`,
      name: 'Balcony',
      category: 'balcony',
      widthFt: 10,
      depthFt: 5,
      preferredZone: 'N',
    });
  }

  return {
    title: `${bhkCount} BHK Floor Plan (${plotWidthFt}′ × ${plotDepthFt}′)`,
    plotWidthFt,
    plotDepthFt,
    rooms,
    vastuCompliant,
    autoFurniture: true,
    exteriorWallThicknessInches: 9,
    interiorWallThicknessInches: 4.5,
    ceilingHeightFt: 10,
  };
}
