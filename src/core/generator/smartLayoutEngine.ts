import {
  Floor,
  Wall,
  WallOpening,
  Room,
  Slab,
  FurnitureInstance,
  Point2D,
  SectionCut,
} from '../model/types';
import { PlanGenerationSpec, RoomSpec, RoomCategory, ZonePlacement } from './promptParser';
import { Sixteenths, SIXTEENTHS_PER_FOOT, feetInchesToSixteenths } from '../units';

export interface GeneratedPlanResult {
  floor: Floor;
  summary: {
    totalAreaSqFt: number;
    roomCount: number;
    wallCount: number;
    doorCount: number;
    windowCount: number;
    furnitureCount: number;
  };
}

interface PlacedBox {
  spec: RoomSpec;
  x1: number; // in feet
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Intelligent 2D Architectural Layout Synthesis Engine.
 * 100% offline, deterministic, and creates fully connected 2D/3D building structures.
 */
export function generateSmartFloorPlan(
  spec: PlanGenerationSpec,
  floorId = 'floor_ground'
): GeneratedPlanResult {
  const plotW = spec.plotWidthFt;
  const plotD = spec.plotDepthFt;

  // 1. Arrange rooms inside a structured 2D grid/packing system
  // We center the building at (0,0) in world coordinates.
  const placedBoxes: PlacedBox[] = layoutRoomsInGrid(spec.rooms, plotW, plotD);

  // Compute building bounding box in feet
  let minXFt = Infinity, maxXFt = -Infinity, minYFt = Infinity, maxYFt = -Infinity;
  for (const b of placedBoxes) {
    minXFt = Math.min(minXFt, b.x1);
    maxXFt = Math.max(maxXFt, b.x2);
    minYFt = Math.min(minYFt, b.y1);
    maxYFt = Math.max(maxYFt, b.y2);
  }

  // Center around (0,0)
  const centerOffsetX = (minXFt + maxXFt) / 2;
  const centerOffsetY = (minYFt + maxYFt) / 2;

  for (const b of placedBoxes) {
    b.x1 -= centerOffsetX;
    b.x2 -= centerOffsetX;
    b.y1 -= centerOffsetY;
    b.y2 -= centerOffsetY;
  }

  minXFt -= centerOffsetX;
  maxXFt -= centerOffsetX;
  minYFt -= centerOffsetY;
  maxYFt -= centerOffsetY;

  // 2. Generate Segments (Walls) from Box Edges
  // Avoid duplicating internal shared partition walls!
  const extWallThick = feetInchesToSixteenths(0, spec.exteriorWallThicknessInches || 9);
  const intWallThick = feetInchesToSixteenths(0, spec.interiorWallThicknessInches || 4.5);
  const wallHeight = feetInchesToSixteenths(spec.ceilingHeightFt || 10, 0);

  const rawSegments: { p1: Point2D; p2: Point2D; isExterior: boolean; roomIds: string[] }[] = [];

  const addOrMergeSegment = (p1: Point2D, p2: Point2D, roomId: string) => {
    // Normalize direction (left-to-right, bottom-to-top)
    let start = { ...p1 };
    let end = { ...p2 };
    if (start.x > end.x || (Math.abs(start.x - end.x) < 0.01 && start.y > end.y)) {
      start = { ...p2 };
      end = { ...p1 };
    }

    const existing = rawSegments.find(
      (s) =>
        Math.abs(s.p1.x - start.x) < 0.1 &&
        Math.abs(s.p1.y - start.y) < 0.1 &&
        Math.abs(s.p2.x - end.x) < 0.1 &&
        Math.abs(s.p2.y - end.y) < 0.1
    );

    if (existing) {
      if (!existing.roomIds.includes(roomId)) {
        existing.roomIds.push(roomId);
      }
      existing.isExterior = false; // shared wall is interior
    } else {
      rawSegments.push({
        p1: start,
        p2: end,
        isExterior: true, // initial assumption
        roomIds: [roomId],
      });
    }
  };

  for (const b of placedBoxes) {
    const pBL = { x: b.x1, y: b.y1 };
    const pBR = { x: b.x2, y: b.y1 };
    const pTR = { x: b.x2, y: b.y2 };
    const pTL = { x: b.x1, y: b.y2 };

    addOrMergeSegment(pBL, pBR, b.spec.id); // South
    addOrMergeSegment(pBR, pTR, b.spec.id); // East
    addOrMergeSegment(pTL, pTR, b.spec.id); // North
    addOrMergeSegment(pBL, pTL, b.spec.id); // West
  }

  // 3. Create Walls with Openings (Doors & Windows)
  const walls: Wall[] = [];
  let openingCounter = 1;
  let doorCount = 0;
  let windowCount = 0;

  rawSegments.forEach((seg, idx) => {
    const wallId = `gen_wall_${idx + 1}`;
    const startSixteenths: Point2D = {
      x: Math.round(seg.p1.x * SIXTEENTHS_PER_FOOT),
      y: Math.round(seg.p1.y * SIXTEENTHS_PER_FOOT),
    };
    const endSixteenths: Point2D = {
      x: Math.round(seg.p2.x * SIXTEENTHS_PER_FOOT),
      y: Math.round(seg.p2.y * SIXTEENTHS_PER_FOOT),
    };

    const lengthFt = Math.hypot(seg.p2.x - seg.p1.x, seg.p2.y - seg.p1.y);
    const lengthSixteenths = lengthFt * SIXTEENTHS_PER_FOOT;

    const openings: WallOpening[] = [];

    // Add Door to interior walls or exterior main entrance
    if (!seg.isExterior && lengthFt >= 5) {
      // Internal Door
      const doorWidth = feetInchesToSixteenths(3, 0); // 3' 0"
      const doorHeight = feetInchesToSixteenths(6, 8); // 6' 8"
      const offset = Math.round(lengthSixteenths / 2);

      openings.push({
        id: `gen_door_${openingCounter++}`,
        wallId,
        name: 'Interior Door',
        type: 'door',
        offsetAlongWall: offset,
        width: doorWidth,
        height: doorHeight,
        elevation: 0,
        flipInward: true,
        flipHand: true,
      });
      doorCount++;
    } else if (seg.isExterior && lengthFt >= 8) {
      // Check if it's the South/Front wall of living room -> Main Entrance Door
      const isSouthWall = Math.abs(seg.p1.y - minYFt) < 0.1 && Math.abs(seg.p2.y - minYFt) < 0.1;
      if (isSouthWall && doorCount === 0) {
        const doorWidth = feetInchesToSixteenths(3, 6); // 3' 6" Main entrance
        const doorHeight = feetInchesToSixteenths(7, 0);
        openings.push({
          id: `gen_main_door_${openingCounter++}`,
          wallId,
          name: 'Main Entrance Door',
          type: 'door',
          offsetAlongWall: Math.round(lengthSixteenths / 2),
          width: doorWidth,
          height: doorHeight,
          elevation: 0,
          flipInward: true,
          flipHand: false,
        });
        doorCount++;
      } else {
        // Exterior Window for natural light & ventilation
        const winWidth = feetInchesToSixteenths(4, 0); // 4' 0"
        const winHeight = feetInchesToSixteenths(4, 0); // 4' 0"
        const winSill = feetInchesToSixteenths(2, 8); // 2' 8"
        openings.push({
          id: `gen_window_${openingCounter++}`,
          wallId,
          name: 'Exterior Window',
          type: 'window',
          offsetAlongWall: Math.round(lengthSixteenths / 2),
          width: winWidth,
          height: winHeight,
          elevation: winSill,
          flipInward: false,
          flipHand: false,
        });
        windowCount++;
      }
    }

    walls.push({
      id: wallId,
      floorId,
      start: startSixteenths,
      end: endSixteenths,
      thickness: seg.isExterior ? extWallThick : intWallThick,
      height: wallHeight,
      openings,
    });
  });

  // 4. Generate Room Models
  const rooms: Room[] = placedBoxes.map((b) => {
    const p1 = { x: Math.round(b.x1 * SIXTEENTHS_PER_FOOT), y: Math.round(b.y1 * SIXTEENTHS_PER_FOOT) };
    const p2 = { x: Math.round(b.x2 * SIXTEENTHS_PER_FOOT), y: Math.round(b.y1 * SIXTEENTHS_PER_FOOT) };
    const p3 = { x: Math.round(b.x2 * SIXTEENTHS_PER_FOOT), y: Math.round(b.y2 * SIXTEENTHS_PER_FOOT) };
    const p4 = { x: Math.round(b.x1 * SIXTEENTHS_PER_FOOT), y: Math.round(b.y2 * SIXTEENTHS_PER_FOOT) };

    const areaSqFt = Math.round((b.x2 - b.x1) * (b.y2 - b.y1));

    let floorMaterialId = 'mat_oak_hardwood';
    if (b.spec.category === 'kitchen') floorMaterialId = 'mat_granite_black';
    else if (b.spec.category === 'bathroom' || b.spec.category === 'attached_toilet') floorMaterialId = 'mat_ceramic_white';
    else if (b.spec.category === 'puja') floorMaterialId = 'mat_marble_calacatta';
    else if (b.spec.category === 'living') floorMaterialId = 'mat_chevron_parquet';

    return {
      id: `room_${b.spec.id}`,
      floorId,
      name: b.spec.name,
      wallIds: walls.map((w) => w.id),
      polygon: [p1, p2, p3, p4],
      floorMaterialId,
      ceilingMaterialId: 'mat_interior_paint_white',
      computedAreaSqFt: areaSqFt,
    };
  });

  // 5. Generate Base Floor Slab
  const slabs: Slab[] = [
    {
      id: 'slab_base_primary',
      floorId,
      polygon: [
        { x: Math.round(minXFt * SIXTEENTHS_PER_FOOT - extWallThick), y: Math.round(minYFt * SIXTEENTHS_PER_FOOT - extWallThick) },
        { x: Math.round(maxXFt * SIXTEENTHS_PER_FOOT + extWallThick), y: Math.round(minYFt * SIXTEENTHS_PER_FOOT - extWallThick) },
        { x: Math.round(maxXFt * SIXTEENTHS_PER_FOOT + extWallThick), y: Math.round(maxYFt * SIXTEENTHS_PER_FOOT + extWallThick) },
        { x: Math.round(minXFt * SIXTEENTHS_PER_FOOT - extWallThick), y: Math.round(maxYFt * SIXTEENTHS_PER_FOOT + extWallThick) },
      ],
      thickness: feetInchesToSixteenths(0, 4), // 4"
      elevation: 0,
      materialId: 'mat_oak_hardwood',
    },
  ];

  // 6. Auto-Stage Key Furniture Items
  const furniture: FurnitureInstance[] = [];
  if (spec.autoFurniture) {
    let furnId = 1;
    for (const b of placedBoxes) {
      const centerX = Math.round(((b.x1 + b.x2) / 2) * SIXTEENTHS_PER_FOOT);
      const centerY = Math.round(((b.y1 + b.y2) / 2) * SIXTEENTHS_PER_FOOT);

      if (b.spec.category === 'master_bedroom') {
        furniture.push({
          id: `furn_bed_${furnId++}`,
          floorId,
          catalogId: 'bed_king',
          name: 'Master King Bed',
          category: 'bedroom',
          position: { x: centerX, y: centerY, z: 0 },
          rotation: 0,
          dimensions: {
            width: feetInchesToSixteenths(6, 4),
            depth: feetInchesToSixteenths(6, 8),
            height: feetInchesToSixteenths(3, 0),
          },
        });
      } else if (b.spec.category === 'bedroom') {
        furniture.push({
          id: `furn_bed_${furnId++}`,
          floorId,
          catalogId: 'bed_queen',
          name: 'Queen Bed',
          category: 'bedroom',
          position: { x: centerX, y: centerY, z: 0 },
          rotation: 0,
          dimensions: {
            width: feetInchesToSixteenths(5, 0),
            depth: feetInchesToSixteenths(6, 6),
            height: feetInchesToSixteenths(3, 0),
          },
        });
      } else if (b.spec.category === 'living') {
        furniture.push({
          id: `furn_sofa_${furnId++}`,
          floorId,
          catalogId: 'sofa_3seater',
          name: 'Living Room 3-Seater Sofa',
          category: 'living',
          position: { x: centerX, y: centerY, z: 0 },
          rotation: 0,
          dimensions: {
            width: feetInchesToSixteenths(7, 0),
            depth: feetInchesToSixteenths(3, 0),
            height: feetInchesToSixteenths(2, 10),
          },
        });
      } else if (b.spec.category === 'dining') {
        furniture.push({
          id: `furn_dining_${furnId++}`,
          floorId,
          catalogId: 'dining_6seater',
          name: '6-Seater Dining Table',
          category: 'dining',
          position: { x: centerX, y: centerY, z: 0 },
          rotation: 0,
          dimensions: {
            width: feetInchesToSixteenths(5, 6),
            depth: feetInchesToSixteenths(3, 2),
            height: feetInchesToSixteenths(2, 6),
          },
        });
      } else if (b.spec.category === 'kitchen') {
        furniture.push({
          id: `furn_sink_${furnId++}`,
          floorId,
          catalogId: 'kitchen_sink',
          name: 'Kitchen Sink Unit',
          category: 'kitchen',
          position: { x: centerX, y: centerY, z: 0 },
          rotation: 0,
          dimensions: {
            width: feetInchesToSixteenths(3, 0),
            depth: feetInchesToSixteenths(2, 0),
            height: feetInchesToSixteenths(2, 10),
          },
        });
      } else if (b.spec.category === 'bathroom' || b.spec.category === 'attached_toilet') {
        furniture.push({
          id: `furn_wc_${furnId++}`,
          floorId,
          catalogId: 'toilet_commode',
          name: 'Wall-Hung Commode',
          category: 'bathroom',
          position: { x: centerX, y: centerY, z: 0 },
          rotation: 0,
          dimensions: {
            width: feetInchesToSixteenths(1, 6),
            depth: feetInchesToSixteenths(2, 2),
            height: feetInchesToSixteenths(2, 6),
          },
        });
      }
    }
  }

  // 7. Standard Section Cut Line
  const sections: SectionCut[] = [
    {
      id: 'sec_AA',
      name: "Section A-A'",
      label: 'A',
      sheetRef: 'A-301',
      p1: { x: Math.round((minXFt - 2) * SIXTEENTHS_PER_FOOT), y: 0 },
      p2: { x: Math.round((maxXFt + 2) * SIXTEENTHS_PER_FOOT), y: 0 },
      viewDirection: 'left',
    },
  ];

  const totalAreaSqFt = rooms.reduce((acc, r) => acc + (r.computedAreaSqFt || 0), 0);

  const floor: Floor = {
    id: floorId,
    name: 'Ground Floor',
    levelIndex: 0,
    elevation: 0,
    ceilingHeight: wallHeight,
    defaultWallThickness: extWallThick,
    slabThickness: feetInchesToSixteenths(1, 0),
    walls,
    rooms,
    slabs,
    furniture,
    stairs: [],
    columns: [],
    symbols: [],
    sections,
  };

  return {
    floor,
    summary: {
      totalAreaSqFt,
      roomCount: rooms.length,
      wallCount: walls.length,
      doorCount,
      windowCount,
      furnitureCount: furniture.length,
    },
  };
}

/**
 * Packs requested rooms into a coherent 2D layout based on Vastu/Zone constraints.
 */
function layoutRoomsInGrid(rooms: RoomSpec[], maxPlotW: number, maxPlotD: number): PlacedBox[] {
  const placed: PlacedBox[] = [];

  // Group rooms by major zones
  // Grid quadrants:
  // NW (Top-Left), NE (Top-Right)
  // SW (Bottom-Left), SE (Bottom-Right)

  // Primary anchor rooms
  const swRooms = rooms.filter((r) => r.preferredZone === 'SW' || r.category === 'master_bedroom' || r.category === 'attached_toilet');
  const seRooms = rooms.filter((r) => (r.preferredZone === 'SE' || r.category === 'kitchen' || r.category === 'utility') && !swRooms.includes(r));
  const neRooms = rooms.filter((r) => (r.preferredZone === 'NE' || r.category === 'living' || r.category === 'puja') && !swRooms.includes(r) && !seRooms.includes(r));
  const nwRooms = rooms.filter((r) => !swRooms.includes(r) && !seRooms.includes(r) && !neRooms.includes(r));

  // Compute column widths and row heights
  const westColW = Math.max(
    ...swRooms.map((r) => r.widthFt),
    ...nwRooms.map((r) => r.widthFt),
    12
  );
  const eastColW = Math.max(
    ...seRooms.map((r) => r.widthFt),
    ...neRooms.map((r) => r.widthFt),
    12
  );

  const southRowD = Math.max(
    ...swRooms.map((r) => r.depthFt),
    ...seRooms.map((r) => r.depthFt),
    14
  );
  const northRowD = Math.max(
    ...nwRooms.map((r) => r.depthFt),
    ...neRooms.map((r) => r.depthFt),
    14
  );

  let currentX = 0;
  let currentY = 0;

  // 1. Place SW Quadrant (Master Bedroom + Attached Toilet)
  let swX = 0;
  let swY = 0;
  for (const r of swRooms) {
    if (r.category === 'attached_toilet') {
      // Place toilet adjacent to master bedroom
      placed.push({
        spec: r,
        x1: swX + westColW - r.widthFt,
        y1: swY,
        x2: swX + westColW,
        y2: swY + r.depthFt,
      });
    } else {
      placed.push({
        spec: r,
        x1: swX,
        y1: swY,
        x2: swX + westColW,
        y2: swY + southRowD,
      });
    }
  }

  // 2. Place SE Quadrant (Kitchen + Dining / Utility)
  let seX = westColW;
  let seY = 0;
  let currentSeY = seY;
  for (const r of seRooms) {
    const roomD = seRooms.length > 1 ? southRowD / seRooms.length : southRowD;
    placed.push({
      spec: r,
      x1: seX,
      y1: currentSeY,
      x2: seX + eastColW,
      y2: currentSeY + roomD,
    });
    currentSeY += roomD;
  }

  // 3. Place NW Quadrant (Bedrooms / Study / Common Bath)
  let nwX = 0;
  let nwY = southRowD;
  let currentNwY = nwY;
  for (const r of nwRooms) {
    const roomD = nwRooms.length > 1 ? northRowD / nwRooms.length : northRowD;
    placed.push({
      spec: r,
      x1: nwX,
      y1: currentNwY,
      x2: nwX + westColW,
      y2: currentNwY + roomD,
    });
    currentNwY += roomD;
  }

  // 4. Place NE Quadrant (Living Room + Puja)
  let neX = westColW;
  let neY = southRowD;
  let currentNeY = neY;
  for (const r of neRooms) {
    const roomD = neRooms.length > 1 ? (r.category === 'puja' ? 6 : northRowD - 6) : northRowD;
    placed.push({
      spec: r,
      x1: neX,
      y1: currentNeY,
      x2: neX + eastColW,
      y2: currentNeY + roomD,
    });
    currentNeY += roomD;
  }

  return placed;
}
