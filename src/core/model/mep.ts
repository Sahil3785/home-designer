import { ArchitecturalSymbol, SymbolType, SymbolCategory, Point2D } from './types';
import { feetInchesToSixteenths, Sixteenths } from '../units';

export type { SymbolType, SymbolCategory };

export interface MepCatalogItem {
  type: SymbolType;
  category: SymbolCategory;
  name: string;
  description: string;
  defaultElevation: Sixteenths; // standard architectural mounting height
  defaultWattage: number;      // electrical rating in Watts
  symbolCode: string;          // CAD drawing code
  hotkey: string;
}

export const MEP_CATALOG: MepCatalogItem[] = [
  {
    type: 'light_point',
    category: 'electrical',
    name: 'Ceiling LED Light',
    description: 'Recessed warm 3000K ceiling downlight or pendant point',
    defaultElevation: feetInchesToSixteenths(9, 6), // ceiling mount
    defaultWattage: 18, // 18W LED
    symbolCode: 'LIGHT',
    hotkey: '1',
  },
  {
    type: 'fan_point',
    category: 'electrical',
    name: 'Ceiling Fan Hook',
    description: 'Ceiling fan point with downrod hook and regulator circuit',
    defaultElevation: feetInchesToSixteenths(9, 6), // ceiling mount
    defaultWattage: 65, // 65W BLDC/Induction
    symbolCode: 'FAN',
    hotkey: '2',
  },
  {
    type: 'switchboard',
    category: 'electrical',
    name: 'Modular Switchboard',
    description: 'Wall-mounted 6/8 module switch plate at standard light switch height',
    defaultElevation: feetInchesToSixteenths(4, 0), // 4' 0" standard elbow height
    defaultWattage: 50,
    symbolCode: 'SW',
    hotkey: '3',
  },
  {
    type: 'socket_outlet',
    category: 'electrical',
    name: '16A Power Socket',
    description: 'Twin 6A/16A universal power outlet with earth pin',
    defaultElevation: feetInchesToSixteenths(1, 6), // 1' 6" skirting height
    defaultWattage: 200, // 200W nominal
    symbolCode: 'SOCK',
    hotkey: '4',
  },
  {
    type: 'ac_indoor',
    category: 'hvac',
    name: 'Split AC Indoor Unit',
    description: 'High-wall mounted 1.5-Ton inverter AC point with copper sleeve',
    defaultElevation: feetInchesToSixteenths(7, 6), // 7' 6" high wall
    defaultWattage: 1500, // 1.5 kW
    symbolCode: 'AC',
    hotkey: '5',
  },
  {
    type: 'db_board',
    category: 'electrical',
    name: 'Distribution Board (DB)',
    description: 'Main MCB/ELCB distribution board with isolator switches',
    defaultElevation: feetInchesToSixteenths(5, 6), // 5' 6" eye level
    defaultWattage: 0,
    symbolCode: 'DB',
    hotkey: '6',
  },
  {
    type: 'water_tap',
    category: 'plumbing',
    name: 'Water Supply Point',
    description: '1/2" CPVC cold/hot water inlet bib cock / mixer point',
    defaultElevation: feetInchesToSixteenths(2, 6), // 2' 6" counter height
    defaultWattage: 0,
    symbolCode: 'TAP',
    hotkey: '7',
  },
  {
    type: 'geyser',
    category: 'plumbing',
    name: 'Water Heater / Geyser',
    description: 'Storage electric geyser point with 25A DP switch connection',
    defaultElevation: feetInchesToSixteenths(6, 6), // 6' 6" high wall
    defaultWattage: 2000, // 2 kW
    symbolCode: 'GYS',
    hotkey: '8',
  },
  {
    type: 'drain_point',
    category: 'plumbing',
    name: 'Floor Trap / Drain',
    description: '4" Nahani floor trap with stainless steel grating',
    defaultElevation: 0, // floor level
    defaultWattage: 0,
    symbolCode: 'DRN',
    hotkey: '9',
  },
];

/**
 * Creates an ArchitecturalSymbol instance with default catalog values.
 */
export function createDefaultMepSymbol(
  type: SymbolType,
  floorId: string,
  position: Point2D,
  rotation: number = 0
): ArchitecturalSymbol {
  const item = MEP_CATALOG.find((c) => c.type === type) || MEP_CATALOG[0];
  return {
    id: `sym_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    floorId,
    name: item.name,
    type: item.type,
    category: item.category,
    position,
    rotation,
    elevation: item.defaultElevation,
    wattage: item.defaultWattage,
  };
}

export interface MepTakeoffSummary {
  totalPoints: number;
  electricalCount: number;
  plumbingCount: number;
  hvacCount: number;
  totalWattage: number;
  totalKw: number;
  recommendedSupply: 'Single-Phase (230V)' | 'Three-Phase (415V)';
  recommendedSanctionedLoadKw: number;
  itemized: {
    type: SymbolType;
    name: string;
    category: SymbolCategory;
    count: number;
    totalWatts: number;
  }[];
}

/**
 * Calculates total MEP fixture takeoff, load in Watts and kW, and service connection sizing.
 */
export function calculateMepTakeoff(symbols: ArchitecturalSymbol[]): MepTakeoffSummary {
  const map = new Map<SymbolType, { item: MepCatalogItem; count: number; totalWatts: number }>();

  MEP_CATALOG.forEach((cat) => {
    map.set(cat.type, { item: cat, count: 0, totalWatts: 0 });
  });

  symbols.forEach((sym) => {
    const entry = map.get(sym.type);
    if (entry) {
      entry.count += 1;
      entry.totalWatts += sym.wattage ?? entry.item.defaultWattage;
    }
  });

  const itemized: MepTakeoffSummary['itemized'] = [];
  let electricalCount = 0;
  let plumbingCount = 0;
  let hvacCount = 0;
  let totalWattage = 0;

  map.forEach(({ item, count, totalWatts }) => {
    if (count > 0) {
      itemized.push({
        type: item.type,
        name: item.name,
        category: item.category,
        count,
        totalWatts,
      });

      if (item.category === 'electrical') electricalCount += count;
      if (item.category === 'plumbing') plumbingCount += count;
      if (item.category === 'hvac') hvacCount += count;
      totalWattage += totalWatts;
    }
  });

  // Apply diversity factor of 0.7 for realistic concurrent demand load
  const diversifiedWatts = totalWattage * 0.7;
  const diversifiedKw = Math.round((diversifiedWatts / 1000) * 10) / 10;
  const recommendedSanctionedLoadKw = Math.max(3.0, Math.ceil(diversifiedKw));

  return {
    totalPoints: symbols.length,
    electricalCount,
    plumbingCount,
    hvacCount,
    totalWattage,
    totalKw: Math.round((totalWattage / 1000) * 10) / 10,
    recommendedSupply: recommendedSanctionedLoadKw > 7 ? 'Three-Phase (415V)' : 'Single-Phase (230V)',
    recommendedSanctionedLoadKw,
    itemized,
  };
}
