import { Project, Floor, Wall } from './types';
import { Sixteenths, feetInchesToSixteenths } from '../units';

export const DEFAULT_SLAB_THICKNESS: Sixteenths = feetInchesToSixteenths(1, 0); // 1' 0" = 192
export const DEFAULT_CEILING_HEIGHT: Sixteenths = feetInchesToSixteenths(9, 0);  // 9' 0" = 1728

/**
 * Recalculates floor elevations based on levelIndex ordering.
 * Floor N elevation = Floor N-1 elevation + Floor N-1 ceiling height + Floor N-1 slab thickness.
 */
export function recalculateFloorElevations(floors: Floor[]): Floor[] {
  if (floors.length === 0) return [];

  // Sort by levelIndex to establish correct vertical stacking order
  const sorted = [...floors].sort((a, b) => a.levelIndex - b.levelIndex);

  // Find index of ground level (levelIndex == 0, or lowest positive)
  const groundIndex = sorted.findIndex((f) => f.levelIndex === 0);
  const baseIndex = groundIndex >= 0 ? groundIndex : 0;

  // Ground level elevation defaults to 0
  sorted[baseIndex] = {
    ...sorted[baseIndex],
    elevation: sorted[baseIndex].elevation || 0,
  };

  // Stack upwards (levelIndex > 0)
  for (let i = baseIndex + 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const prevSlab = prev.slabThickness ?? DEFAULT_SLAB_THICKNESS;
    const elev = prev.elevation + prev.ceilingHeight + prevSlab;
    sorted[i] = {
      ...sorted[i],
      elevation: elev,
    };
  }

  // Stack downwards (levelIndex < 0, basements)
  for (let i = baseIndex - 1; i >= 0; i--) {
    const next = sorted[i + 1];
    const curSlab = sorted[i].slabThickness ?? DEFAULT_SLAB_THICKNESS;
    const elev = next.elevation - (sorted[i].ceilingHeight + curSlab);
    sorted[i] = {
      ...sorted[i],
      elevation: elev,
    };
  }

  // Preserve the original ordering in the returned array
  const elevationMap = new Map(sorted.map((f) => [f.id, f.elevation]));
  return floors.map((f) => ({
    ...f,
    elevation: elevationMap.get(f.id) ?? f.elevation,
  }));
}

/**
 * Returns total floor-to-floor rise from this floor to the next floor above.
 */
export function getFloorRise(floor: Floor): Sixteenths {
  return floor.ceilingHeight + (floor.slabThickness ?? DEFAULT_SLAB_THICKNESS);
}

/**
 * Clones walls from a source floor to align upper floor load-bearing walls.
 */
export function cloneWallsForNewFloor(sourceFloor: Floor, targetFloorId: string, wallHeight: Sixteenths): Wall[] {
  return sourceFloor.walls.map((w, idx) => ({
    id: `wall_${targetFloorId}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    floorId: targetFloorId,
    start: { ...w.start },
    end: { ...w.end },
    thickness: w.thickness,
    height: wallHeight,
    openings: [], // new floor starts with clean walls (user can add doors/windows)
    materialExteriorId: w.materialExteriorId,
    materialInteriorId: w.materialInteriorId,
  }));
}

export interface AddFloorOptions {
  name?: string;
  ceilingHeight?: Sixteenths;
  slabThickness?: Sixteenths;
  cloneWallsFromFloorId?: string;
}

const FLOOR_NAMES = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Attic'];

/**
 * Adds a new floor level to the project, optionally cloning load-bearing exterior walls.
 */
export function addFloorToProject(
  project: Project,
  options: AddFloorOptions = {}
): { project: Project; newFloor: Floor } {
  const maxLevel = project.floors.reduce((max, f) => Math.max(max, f.levelIndex), -1);
  const newLevelIndex = maxLevel + 1;

  const newFloorId = `floor_level_${newLevelIndex}_${Date.now()}`;
  const ceilingHeight = options.ceilingHeight ?? project.floors[0]?.ceilingHeight ?? DEFAULT_CEILING_HEIGHT;
  const slabThickness = options.slabThickness ?? DEFAULT_SLAB_THICKNESS;

  const defaultName =
    newLevelIndex < FLOOR_NAMES.length
      ? FLOOR_NAMES[newLevelIndex]
      : `Level ${newLevelIndex + 1}`;
  const name = options.name?.trim() || defaultName;

  let newWalls: Wall[] = [];
  if (options.cloneWallsFromFloorId) {
    const src = project.floors.find((f) => f.id === options.cloneWallsFromFloorId);
    if (src) {
      newWalls = cloneWallsForNewFloor(src, newFloorId, ceilingHeight);
    }
  }

  const newFloor: Floor = {
    id: newFloorId,
    name,
    levelIndex: newLevelIndex,
    elevation: 0, // will be computed below
    ceilingHeight,
    slabThickness,
    defaultWallThickness: project.floors[0]?.defaultWallThickness ?? feetInchesToSixteenths(0, 6),
    walls: newWalls,
    rooms: [],
    slabs: [],
    furniture: [],
    stairs: [],
    columns: [],
  };

  const updatedFloors = recalculateFloorElevations([...project.floors, newFloor]);
  const finalNewFloor = updatedFloors.find((f) => f.id === newFloorId)!;

  const updatedProject: Project = {
    ...project,
    updatedAt: new Date().toISOString(),
    floors: updatedFloors,
    activeFloorId: newFloorId,
  };

  return { project: updatedProject, newFloor: finalNewFloor };
}

/**
 * Removes a floor from the project. Ensures at least one floor remains.
 */
export function removeFloorFromProject(project: Project, floorId: string): Project {
  if (project.floors.length <= 1) {
    return project; // Cannot delete the only floor
  }

  const filtered = project.floors.filter((f) => f.id !== floorId);
  const updatedFloors = recalculateFloorElevations(filtered);

  let activeFloorId = project.activeFloorId;
  if (activeFloorId === floorId) {
    activeFloorId = updatedFloors[0].id;
  }

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    floors: updatedFloors,
    activeFloorId,
  };
}
