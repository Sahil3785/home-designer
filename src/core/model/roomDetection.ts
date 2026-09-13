import { Floor, Room, Point2D, Wall, FurnitureInstance } from './types';
import { distance2D } from './geometry';
import { SIXTEENTHS_PER_FOOT } from '../units';

/**
 * Classifies a room's type/name automatically using geometry and furniture heuristics.
 * Called after room detection to assign meaningful names to new rooms.
 */
export function classifyRoomByGeometry(
  polygon: Point2D[],
  walls: Wall[],
  furniture: FurnitureInstance[],
  existingName?: string
): string {
  // Don't overwrite user-assigned names
  if (existingName && existingName !== '' && !existingName.startsWith('Room ')) {
    return existingName;
  }

  const signedArea = computePolygonSignedArea(polygon);
  const sqFt = sixteenthsAreaToSquareFeet(signedArea);
  const centroid = computePolygonCentroid(polygon);

  // Check furniture inside the room
  const furnitureInside = furniture.filter((f) =>
    isPointInsidePolygon({ x: f.position.x, y: f.position.y }, polygon)
  );
  const furnitureCatalogIds = furnitureInside.map((f) => f.catalogId);

  // Furniture-based classification (highest priority)
  if (furnitureCatalogIds.some((id) => id.includes('toilet') || id.includes('commode'))) {
    return sqFt < 35 ? 'Powder Room / WC' : 'Bathroom / WC';
  }
  if (furnitureCatalogIds.some((id) => id.includes('washbasin') || id.includes('vanity'))) {
    return sqFt < 50 ? 'Bathroom' : 'Master Bathroom';
  }
  if (furnitureCatalogIds.some((id) => id.includes('bed_king'))) {
    return 'Master Bedroom';
  }
  if (furnitureCatalogIds.some((id) => id.includes('bed_queen') || id.includes('bed'))) {
    return 'Bedroom';
  }
  if (furnitureCatalogIds.some((id) => id.includes('kitchen_counter') || id.includes('stove'))) {
    return 'Kitchen';
  }
  if (furnitureCatalogIds.some((id) => id.includes('dining'))) {
    return 'Dining Room';
  }
  if (furnitureCatalogIds.some((id) => id.includes('sofa') || id.includes('coffee_table'))) {
    return 'Living Room';
  }
  if (furnitureCatalogIds.some((id) => id.includes('wardrobe'))) {
    return 'Bedroom';
  }
  if (furnitureCatalogIds.some((id) => id.includes('porch_car'))) {
    return 'Car Porch / Parking';
  }
  if (furnitureCatalogIds.some((id) => id.includes('entry_gate'))) {
    return 'Entry / Foyer';
  }

  // Count windows in surrounding walls — rooms with 0 windows = utility/store
  const wallIdsEnclosing = walls.filter((w) => {
    const midX = (w.start.x + w.end.x) / 2;
    const midY = (w.start.y + w.end.y) / 2;
    return isPointInsidePolygon({ x: midX, y: midY }, polygon);
  });
  const windowCount = wallIdsEnclosing.reduce(
    (sum, w) => sum + w.openings.filter((o) => o.type === 'window').length,
    0
  );

  // Compute bounding box for aspect ratio
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of polygon) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }
  const bboxW = (maxX - minX) / SIXTEENTHS_PER_FOOT;
  const bboxH = (maxY - minY) / SIXTEENTHS_PER_FOOT;
  const aspectRatio = Math.max(bboxW, bboxH) / Math.max(Math.min(bboxW, bboxH), 0.1);

  // Geometry-based area classification
  if (sqFt < 20) return 'Utility Niche';
  if (sqFt < 35) return windowCount === 0 ? 'Store Room' : 'Powder Room';
  if (sqFt < 60) {
    if (aspectRatio > 3) return 'Corridor / Passage';
    return windowCount === 0 ? 'Bathroom' : 'Small Room';
  }
  if (sqFt < 100) {
    if (aspectRatio > 2.5) return 'Corridor / Passage';
    return 'Bedroom';
  }
  if (sqFt < 180) return 'Bedroom';
  if (sqFt < 300) return 'Living Room';
  if (sqFt < 500) return 'Living / Dining';
  return 'Great Room / Hall';
}

/**
 * Computes exact bounding box dimensions of a room polygon in feet.
 */
export function computeRoomBoundingDimensions(polygon: Point2D[]): { widthFt: number; depthFt: number } {
  if (polygon.length === 0) return { widthFt: 0, depthFt: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of polygon) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }
  return {
    widthFt: (maxX - minX) / SIXTEENTHS_PER_FOOT,
    depthFt: (maxY - minY) / SIXTEENTHS_PER_FOOT,
  };
}

/**
 * Returns room area in exact square feet (floating point).
 */
export function computeRoomAreaSqFt(polygon: Point2D[]): number {
  const signedArea = computePolygonSignedArea(polygon);
  return Math.abs(signedArea) / (SIXTEENTHS_PER_FOOT * SIXTEENTHS_PER_FOOT);
}

const TOLERANCE = 192; // 12 inches snap tolerance for graph nodes and CAD wall junctions

interface GraphNode {
  id: number;
  point: Point2D;
  edges: DirectedEdge[];
}

interface DirectedEdge {
  fromNode: GraphNode;
  toNode: GraphNode;
  wall: Wall;
  angle: number; // Angle in [0, 2*PI)
  visited: boolean;
}

/**
 * Computes polygon signed area using Shoelace formula.
 * Positive = Counter-Clockwise (Interior face), Negative = Clockwise (Exterior face).
 */
export function computePolygonSignedArea(polygon: Point2D[]): number {
  if (polygon.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return area / 2;
}

/**
 * Converts internal sixteenths^2 area to square feet.
 * 1 sq foot = 192 * 192 = 36,864 sq sixteenths.
 */
export function sixteenthsAreaToSquareFeet(areaSixteenthsSq: number): number {
  return Math.round(Math.abs(areaSixteenthsSq) / (SIXTEENTHS_PER_FOOT * SIXTEENTHS_PER_FOOT));
}

export function isPointInsidePolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function computePolygonCentroid(polygon: Point2D[]): Point2D {
  if (polygon.length === 0) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  for (const pt of polygon) {
    cx += pt.x;
    cy += pt.y;
  }
  return {
    x: Math.round(cx / polygon.length),
    y: Math.round(cy / polygon.length),
  };
}

/**
 * Normalizes angle into [0, 2*PI)
 */
function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

/**
 * Automatically detects enclosed rooms from connected wall loops in a floor.
 */
export function detectRoomsFromWalls(floor: Floor): Room[] {
  const walls = floor.walls;
  if (walls.length < 3) return [];

  // 1. Build Nodes and collect all split points along walls
  const nodes: GraphNode[] = [];

  function getOrCreateNode(pt: Point2D): GraphNode {
    let node = nodes.find((n) => distance2D(n.point, pt) <= TOLERANCE);
    if (!node) {
      node = {
        id: nodes.length,
        point: { ...pt },
        edges: [],
      };
      nodes.push(node);
    }
    return node;
  }

  // Collect all unique endpoints
  const allEndpoints: Point2D[] = [];
  for (const w of walls) {
    allEndpoints.push(w.start, w.end);
  }

  // 2. Subdivide walls that have T-junctions
  interface SubSegment {
    start: Point2D;
    end: Point2D;
    wall: Wall;
  }
  const subSegments: SubSegment[] = [];

  for (const wall of walls) {
    const splitPoints: { pt: Point2D; t: number }[] = [
      { pt: wall.start, t: 0 },
      { pt: wall.end, t: 1 },
    ];

    const len = distance2D(wall.start, wall.end);
    if (len <= 0) continue;

    for (const ep of allEndpoints) {
      if (distance2D(ep, wall.start) <= TOLERANCE || distance2D(ep, wall.end) <= TOLERANCE) {
        continue;
      }

      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const t = ((ep.x - wall.start.x) * dx + (ep.y - wall.start.y) * dy) / (len * len);

      if (t > 0.02 && t < 0.98) {
        const projX = wall.start.x + t * dx;
        const projY = wall.start.y + t * dy;
        if (Math.hypot(ep.x - projX, ep.y - projY) <= TOLERANCE) {
          splitPoints.push({ pt: ep, t });
        }
      }
    }

    // Sort split points along wall
    splitPoints.sort((a, b) => a.t - b.t);

    for (let i = 0; i < splitPoints.length - 1; i++) {
      subSegments.push({
        start: splitPoints[i].pt,
        end: splitPoints[i + 1].pt,
        wall,
      });
    }
  }

  // 3. Create Directed Edges
  const allEdges: DirectedEdge[] = [];

  for (const seg of subSegments) {
    const nodeA = getOrCreateNode(seg.start);
    const nodeB = getOrCreateNode(seg.end);
    if (nodeA === nodeB) continue;

    const angleAB = normalizeAngle(Math.atan2(nodeB.point.y - nodeA.point.y, nodeB.point.x - nodeA.point.x));
    const angleBA = normalizeAngle(Math.atan2(nodeA.point.y - nodeB.point.y, nodeA.point.x - nodeB.point.x));

    const edgeAB: DirectedEdge = {
      fromNode: nodeA,
      toNode: nodeB,
      wall: seg.wall,
      angle: angleAB,
      visited: false,
    };

    const edgeBA: DirectedEdge = {
      fromNode: nodeB,
      toNode: nodeA,
      wall: seg.wall,
      angle: angleBA,
      visited: false,
    };

    nodeA.edges.push(edgeAB);
    nodeB.edges.push(edgeBA);
    allEdges.push(edgeAB, edgeBA);
  }

  // 4. Sort outgoing edges at each node counter-clockwise by polar angle
  for (const node of nodes) {
    node.edges.sort((a, b) => a.angle - b.angle);
  }

  // 5. Traverse minimal counter-clockwise faces
  const detectedRooms: Room[] = [];
  let roomIndex = 1;

  for (const edge of allEdges) {
    if (edge.visited) continue;

    const cycleNodes: GraphNode[] = [];
    const cycleWalls: Wall[] = [];
    let curEdge: DirectedEdge | null = edge;

    while (curEdge && !curEdge.visited) {
      curEdge.visited = true;
      cycleNodes.push(curEdge.fromNode);
      if (!cycleWalls.some((w) => w.id === curEdge!.wall.id)) {
        cycleWalls.push(curEdge.wall);
      }

      const nextNode: GraphNode = curEdge.toNode;
      const outgoing: DirectedEdge[] = nextNode.edges;
      if (outgoing.length === 0) {
        curEdge = null;
        break;
      }

      // Find reverse angle from nextNode back to curEdge.fromNode
      const backAngle = normalizeAngle(
        Math.atan2(
          curEdge.fromNode.point.y - nextNode.point.y,
          curEdge.fromNode.point.x - nextNode.point.x
        )
      );

      // In the CCW sorted list of outgoing edges at nextNode,
      // the left-most turn (which traces CCW face) is the edge immediately preceding backAngle in CCW order!
      let nextIdx = -1;
      for (let i = outgoing.length - 1; i >= 0; i--) {
        if (outgoing[i].angle < backAngle) {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx === -1) {
        nextIdx = outgoing.length - 1; // Wrap around to highest angle
      }

      curEdge = outgoing[nextIdx];

      if (curEdge && curEdge.fromNode === edge.fromNode && curEdge.toNode === edge.toNode) {
        break;
      }
    }

    if (cycleNodes.length >= 3) {
      const polygon = cycleNodes.map((n) => ({ ...n.point }));
      const signedArea = computePolygonSignedArea(polygon);

      // Positive signed area = counter-clockwise = enclosed interior room
      if (signedArea > 0) {
        const sqFt = sixteenthsAreaToSquareFeet(signedArea);
        if (sqFt >= 10 && sqFt <= 50000) {
          const centroid = computePolygonCentroid(polygon);
          const existingRoom = floor.rooms.find((r) => isPointInsidePolygon(centroid, r.polygon));

          const floorMat = existingRoom?.floorMaterialId || floor.floorMaterialId || 'mat_oak_hardwood';
          const ceilMat = existingRoom?.ceilingMaterialId || 'mat_interior_paint_white';
          const flooringConfig = existingRoom?.flooringConfig || floor.flooringConfig;

          // Use smart classification for new rooms, preserve user-assigned name for existing rooms
          const roomName = classifyRoomByGeometry(
            polygon,
            floor.walls,
            floor.furniture || [],
            existingRoom?.name
          );

          detectedRooms.push({
            id: existingRoom ? existingRoom.id : `room_${Date.now()}_${roomIndex++}`,
            floorId: floor.id,
            name: roomName,
            wallIds: cycleWalls.map((w) => w.id),
            polygon,
            floorMaterialId: floorMat,
            ceilingMaterialId: ceilMat,
            computedAreaSqFt: sqFt,
            flooringConfig,
          });
        }
      }
    }
  }

  // Remove duplicate rooms with virtually identical centroids
  const uniqueRooms: Room[] = [];
  for (const r of detectedRooms) {
    const c = computePolygonCentroid(r.polygon);
    if (!uniqueRooms.some((u) => distance2D(computePolygonCentroid(u.polygon), c) < 96)) {
      uniqueRooms.push(r);
    }
  }

  // Robust Fallback: If graph cycle detection found 0 rooms:
  // 1. If the floor already had valid rooms, preserve them rather than deleting
  if (uniqueRooms.length === 0 && floor.rooms && floor.rooms.length > 0) {
    return floor.rooms;
  }

  // 2. If floor has >= 3 walls, compute bounding room enclosure so the floor and room ALWAYS exist
  if (uniqueRooms.length === 0 && floor.walls.length >= 3) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const w of floor.walls) {
      minX = Math.min(minX, w.start.x, w.end.x);
      maxX = Math.max(maxX, w.start.x, w.end.x);
      minY = Math.min(minY, w.start.y, w.end.y);
      maxY = Math.max(maxY, w.start.y, w.end.y);
    }
    const width = maxX - minX;
    const depth = maxY - minY;
    if (width > 384 && depth > 384) {
      const polygon: Point2D[] = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
      const signedArea = computePolygonSignedArea(polygon);
      const sqFt = sixteenthsAreaToSquareFeet(signedArea);
      const centroid = computePolygonCentroid(polygon);
      const existingRoom = floor.rooms?.find((r) => isPointInsidePolygon(centroid, r.polygon)) || floor.rooms?.[0];
      const floorMat = existingRoom?.floorMaterialId || floor.floorMaterialId || 'mat_oak_hardwood';
      const ceilMat = existingRoom?.ceilingMaterialId || 'mat_interior_paint_white';
      const roomName = classifyRoomByGeometry(
        polygon,
        floor.walls,
        floor.furniture || [],
        existingRoom?.name
      );

      uniqueRooms.push({
        id: existingRoom ? existingRoom.id : `room_${floor.id}_main`,
        floorId: floor.id,
        name: roomName || 'Main Room',
        wallIds: floor.walls.map((w) => w.id),
        polygon,
        floorMaterialId: floorMat,
        ceilingMaterialId: ceilMat,
        computedAreaSqFt: sqFt,
        flooringConfig: existingRoom?.flooringConfig || floor.flooringConfig,
      });
    }
  }

  return uniqueRooms;
}
