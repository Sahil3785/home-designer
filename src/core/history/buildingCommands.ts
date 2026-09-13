import { Command } from './command';
import {
  Project,
  Wall,
  WallOpening,
  ProjectSettings,
  Floor,
  Staircase,
  Column,
  Roof,
  ReferencePlan,
  FurnitureInstance,
  Room,
  ArchitecturalSymbol,
  SectionCut,
  SitePlan,
  OutdoorFeature,
  KitchenDesign,
} from '../model/types';
import { recalculateFloorElevations } from '../model/floors';
import { createDefaultSitePlan } from '../model/site';

export class AddWallCommand implements Command {
  readonly id = `cmd_add_wall_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;

  constructor(
    private floorId: string,
    private wall: Wall
  ) {
    this.name = 'Add Wall';
  }

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((floor) => {
        if (floor.id !== this.floorId) return floor;
        return {
          ...floor,
          walls: [...floor.walls, this.wall],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((floor) => {
        if (floor.id !== this.floorId) return floor;
        return {
          ...floor,
          walls: floor.walls.filter((w) => w.id !== this.wall.id),
        };
      }),
    };
  }
}

export class DeleteWallCommand implements Command {
  readonly id = `cmd_del_wall_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Wall';
  private removedWall: Wall | null = null;

  constructor(
    private floorId: string,
    private wallId: string
  ) {}

  execute(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    if (floor) {
      this.removedWall = floor.walls.find((w) => w.id === this.wallId) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.filter((w) => w.id !== this.wallId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedWall) return project;
    const wallToRestore = this.removedWall;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: [...fl.walls, wallToRestore],
        };
      }),
    };
  }
}

export class AddOpeningCommand implements Command {
  readonly id = `cmd_add_opening_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;

  constructor(
    private floorId: string,
    private wallId: string,
    private opening: WallOpening
  ) {
    this.name = `Add ${opening.type === 'door' ? 'Door' : 'Window'}`;
  }

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((floor) => {
        if (floor.id !== this.floorId) return floor;
        return {
          ...floor,
          walls: floor.walls.map((w) => {
            if (w.id !== this.wallId) return w;
            return {
              ...w,
              openings: [...w.openings, this.opening],
            };
          }),
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((floor) => {
        if (floor.id !== this.floorId) return floor;
        return {
          ...floor,
          walls: floor.walls.map((w) => {
            if (w.id !== this.wallId) return w;
            return {
              ...w,
              openings: w.openings.filter((o) => o.id !== this.opening.id),
            };
          }),
        };
      }),
    };
  }
}

export class DeleteOpeningCommand implements Command {
  readonly id = `cmd_del_opening_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;
  private removedOpening: WallOpening | null = null;

  constructor(
    private floorId: string,
    private wallId: string,
    private openingId: string
  ) {
    this.name = 'Delete Opening';
  }

  execute(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    const wall = floor?.walls.find((w) => w.id === this.wallId);
    if (wall) {
      this.removedOpening = wall.openings.find((o) => o.id === this.openingId) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.map((w) => {
            if (w.id !== this.wallId) return w;
            return {
              ...w,
              openings: w.openings.filter((o) => o.id !== this.openingId),
            };
          }),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedOpening) return project;
    const openingToRestore = this.removedOpening;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.map((w) => {
            if (w.id !== this.wallId) return w;
            return {
              ...w,
              openings: [...w.openings, openingToRestore],
            };
          }),
        };
      }),
    };
  }
}

export class UpdateOpeningCommand implements Command {
  readonly id = `cmd_upd_opening_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;
  private prevOpening: WallOpening | null = null;

  constructor(
    private floorId: string,
    private wallId: string,
    private updatedOpening: WallOpening
  ) {
    this.name = `Update ${updatedOpening.type}`;
  }

  execute(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    const wall = floor?.walls.find((w) => w.id === this.wallId);
    if (wall) {
      this.prevOpening = wall.openings.find((o) => o.id === this.updatedOpening.id) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.map((w) => {
            if (w.id !== this.wallId) return w;
            return {
              ...w,
              openings: w.openings.map((o) =>
                o.id === this.updatedOpening.id ? this.updatedOpening : o
              ),
            };
          }),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.prevOpening) return project;
    const prev = this.prevOpening;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.map((w) => {
            if (w.id !== this.wallId) return w;
            return {
              ...w,
              openings: w.openings.map((o) => (o.id === prev.id ? prev : o)),
            };
          }),
        };
      }),
    };
  }
}

export class UpdateWallBatchCommand implements Command {
  readonly id = `cmd_upd_wall_batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Move Wall Corner';
  private originalWalls: Wall[];

  constructor(
    private floorId: string,
    private updatedWalls: Wall[],
    originalFloorWalls: Wall[]
  ) {
    const updatedIds = new Set(updatedWalls.map((w) => w.id));
    this.originalWalls = originalFloorWalls.filter((w) => updatedIds.has(w.id));
  }

  execute(project: Project): Project {
    const updatedMap = new Map(this.updatedWalls.map((w) => [w.id, w]));

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.map((w) => (updatedMap.has(w.id) ? updatedMap.get(w.id)! : w)),
        };
      }),
    };
  }

  undo(project: Project): Project {
    const origMap = new Map(this.originalWalls.map((w) => [w.id, w]));

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          walls: fl.walls.map((w) => (origMap.has(w.id) ? origMap.get(w.id)! : w)),
        };
      }),
    };
  }
}

export class UpdateSettingsCommand implements Command {
  readonly id = `cmd_update_settings_${Date.now()}`;
  readonly name = 'Update Settings';
  private oldSettings: ProjectSettings;

  constructor(
    project: Project,
    private newSettings: Partial<ProjectSettings>
  ) {
    this.oldSettings = { ...project.settings };
  }

  execute(project: Project): Project {
    return {
      ...project,
      settings: {
        ...project.settings,
        ...this.newSettings,
      },
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      settings: { ...this.oldSettings },
    };
  }
}

export class AddFloorCommand implements Command {
  readonly id = `cmd_add_floor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;
  private previousActiveFloorId: string = '';

  constructor(private newFloor: Floor) {
    this.name = `Add ${newFloor.name}`;
  }

  execute(project: Project): Project {
    this.previousActiveFloorId = project.activeFloorId;
    const updatedFloors = recalculateFloorElevations([...project.floors, this.newFloor]);
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: updatedFloors,
      activeFloorId: this.newFloor.id,
    };
  }

  undo(project: Project): Project {
    const remainingFloors = project.floors.filter((f) => f.id !== this.newFloor.id);
    const updatedFloors = recalculateFloorElevations(remainingFloors);
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: updatedFloors,
      activeFloorId: this.previousActiveFloorId || updatedFloors[0]?.id || '',
    };
  }
}

export class DeleteFloorCommand implements Command {
  readonly id = `cmd_del_floor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;
  private removedFloor: Floor | null = null;
  private previousActiveFloorId: string = '';

  constructor(private floorId: string) {
    this.name = 'Delete Floor';
  }

  execute(project: Project): Project {
    if (project.floors.length <= 1) return project;
    this.removedFloor = project.floors.find((f) => f.id === this.floorId) || null;
    this.previousActiveFloorId = project.activeFloorId;

    const remainingFloors = project.floors.filter((f) => f.id !== this.floorId);
    const updatedFloors = recalculateFloorElevations(remainingFloors);

    let nextActiveId = project.activeFloorId;
    if (nextActiveId === this.floorId) {
      nextActiveId = updatedFloors[0].id;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: updatedFloors,
      activeFloorId: nextActiveId,
    };
  }

  undo(project: Project): Project {
    if (!this.removedFloor) return project;
    const restored = [...project.floors, this.removedFloor].sort((a, b) => a.levelIndex - b.levelIndex);
    const updatedFloors = recalculateFloorElevations(restored);

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: updatedFloors,
      activeFloorId: this.previousActiveFloorId || this.floorId,
    };
  }
}

export class UpdateFloorCommand implements Command {
  readonly id = `cmd_upd_floor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Floor';
  private previousFloor: Floor | null = null;

  constructor(
    private floorId: string,
    private updates: Partial<Floor>
  ) {}

  execute(project: Project): Project {
    const cur = project.floors.find((f) => f.id === this.floorId);
    if (cur) this.previousFloor = { ...cur };

    const updatedFloors = project.floors.map((fl) => {
      if (fl.id !== this.floorId) return fl;
      return { ...fl, ...this.updates };
    });

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: recalculateFloorElevations(updatedFloors),
    };
  }

  undo(project: Project): Project {
    if (!this.previousFloor) return project;
    const prev = this.previousFloor;

    const updatedFloors = project.floors.map((fl) => (fl.id === this.floorId ? prev : fl));
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: recalculateFloorElevations(updatedFloors),
    };
  }
}

export class AddStaircaseCommand implements Command {
  readonly id = `cmd_add_stair_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Add Staircase';

  constructor(
    private floorId: string,
    private staircase: Staircase
  ) {}

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          stairs: [...(fl.stairs || []), this.staircase],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          stairs: (fl.stairs || []).filter((s) => s.id !== this.staircase.id),
        };
      }),
    };
  }
}

export class UpdateStaircaseCommand implements Command {
  readonly id = `cmd_upd_stair_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Staircase';
  private previousStair: Staircase | null = null;

  constructor(
    private floorId: string,
    private updatedStair: Staircase
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.previousStair = (fl.stairs || []).find((s) => s.id === this.updatedStair.id) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          stairs: (f.stairs || []).map((s) => (s.id === this.updatedStair.id ? this.updatedStair : s)),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.previousStair) return project;
    const prev = this.previousStair;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          stairs: (f.stairs || []).map((s) => (s.id === prev.id ? prev : s)),
        };
      }),
    };
  }
}

export class DeleteStaircaseCommand implements Command {
  readonly id = `cmd_del_stair_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Staircase';
  private removedStair: Staircase | null = null;

  constructor(
    private floorId: string,
    private staircaseId: string
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.removedStair = (fl.stairs || []).find((s) => s.id === this.staircaseId) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          stairs: (f.stairs || []).filter((s) => s.id !== this.staircaseId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedStair) return project;
    const toRestore = this.removedStair;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          stairs: [...(f.stairs || []), toRestore],
        };
      }),
    };
  }
}

export class AddColumnCommand implements Command {
  readonly id = `cmd_add_col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Add Column';

  constructor(
    private floorId: string,
    private column: Column
  ) {}

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          columns: [...(fl.columns || []), this.column],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          columns: (fl.columns || []).filter((c) => c.id !== this.column.id),
        };
      }),
    };
  }
}

export class UpdateColumnCommand implements Command {
  readonly id = `cmd_upd_col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Column';
  private previousCol: Column | null = null;

  constructor(
    private floorId: string,
    private updatedColumn: Column
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.previousCol = (fl.columns || []).find((c) => c.id === this.updatedColumn.id) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          columns: (f.columns || []).map((c) => (c.id === this.updatedColumn.id ? this.updatedColumn : c)),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.previousCol) return project;
    const prev = this.previousCol;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          columns: (f.columns || []).map((c) => (c.id === prev.id ? prev : c)),
        };
      }),
    };
  }
}

export class DeleteColumnCommand implements Command {
  readonly id = `cmd_del_col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Column';
  private removedCol: Column | null = null;

  constructor(
    private floorId: string,
    private columnId: string
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.removedCol = (fl.columns || []).find((c) => c.id === this.columnId) || null;
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          columns: (f.columns || []).filter((c) => c.id !== this.columnId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedCol) return project;
    const toRestore = this.removedCol;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          columns: [...(f.columns || []), toRestore],
        };
      }),
    };
  }
}

export class UpdateRoofCommand implements Command {
  readonly id = `cmd_upd_roof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Roof';
  private previousRoof: Roof | undefined;

  constructor(
    private floorId: string,
    private roof: Roof | undefined
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) this.previousRoof = fl.roof;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          roof: this.roof,
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          roof: this.previousRoof,
        };
      }),
    };
  }
}

export class SetReferencePlanCommand implements Command {
  readonly id = `cmd_set_ref_plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Set Reference Plan';
  private previousPlan: ReferencePlan | undefined;

  constructor(
    private floorId: string,
    private plan: ReferencePlan
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) this.previousPlan = fl.referencePlan;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          referencePlan: this.plan,
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          referencePlan: this.previousPlan,
        };
      }),
    };
  }
}

export class UpdateReferencePlanCommand implements Command {
  readonly id = `cmd_upd_ref_plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Reference Plan';
  private previousPlan: ReferencePlan | undefined;

  constructor(
    private floorId: string,
    private patch: Partial<ReferencePlan>
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) this.previousPlan = fl.referencePlan;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId || !f.referencePlan) return f;
        return {
          ...f,
          referencePlan: {
            ...f.referencePlan,
            ...this.patch,
          },
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          referencePlan: this.previousPlan,
        };
      }),
    };
  }
}

export class RemoveReferencePlanCommand implements Command {
  readonly id = `cmd_del_ref_plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Remove Reference Plan';
  private previousPlan: ReferencePlan | undefined;

  constructor(private floorId: string) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) this.previousPlan = fl.referencePlan;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        const { referencePlan: _, ...rest } = f;
        return rest as Floor;
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          referencePlan: this.previousPlan,
        };
      }),
    };
  }
}

export class AddFurnitureCommand implements Command {
  readonly id = `cmd_add_furn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Add Furniture';

  constructor(
    private floorId: string,
    private furniture: FurnitureInstance
  ) {}

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          furniture: [...(f.furniture || []), this.furniture],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          furniture: (f.furniture || []).filter((item) => item.id !== this.furniture.id),
        };
      }),
    };
  }
}

export class UpdateFurnitureCommand implements Command {
  readonly id = `cmd_upd_furn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Furniture';
  private previousFurniture: FurnitureInstance | undefined;

  constructor(
    private floorId: string,
    private furnitureId: string,
    private patch: Partial<FurnitureInstance>
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.previousFurniture = fl.furniture?.find((item) => item.id === this.furnitureId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          furniture: (f.furniture || []).map((item) => {
            if (item.id !== this.furnitureId) return item;
            return {
              ...item,
              ...this.patch,
              dimensions: this.patch.dimensions
                ? { ...item.dimensions, ...this.patch.dimensions }
                : item.dimensions,
              position: this.patch.position
                ? { ...item.position, ...this.patch.position }
                : item.position,
            };
          }),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.previousFurniture) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          furniture: (f.furniture || []).map((item) =>
            item.id === this.furnitureId ? this.previousFurniture! : item
          ),
        };
      }),
    };
  }
}

export class DeleteFurnitureCommand implements Command {
  readonly id = `cmd_del_furn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Furniture';
  private removedFurniture: FurnitureInstance | undefined;

  constructor(
    private floorId: string,
    private furnitureId: string
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.removedFurniture = fl.furniture?.find((item) => item.id === this.furnitureId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          furniture: (f.furniture || []).filter((item) => item.id !== this.furnitureId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedFurniture) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          furniture: [...(f.furniture || []), this.removedFurniture!],
        };
      }),
    };
  }
}

export class UpdateProjectSettingsCommand implements Command {
  readonly id = `cmd_upd_settings_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Project Settings';
  private previousSettings: ProjectSettings | undefined;

  constructor(private settingsPatch: Partial<ProjectSettings>) {}

  execute(project: Project): Project {
    this.previousSettings = { ...project.settings };
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      settings: {
        ...project.settings,
        ...this.settingsPatch,
      },
    };
  }

  undo(project: Project): Project {
    if (!this.previousSettings) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      settings: this.previousSettings,
    };
  }
}

export class UpdateRoomCommand implements Command {
  readonly id = `cmd_upd_room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Room Properties';
  private previousRoom: Room | undefined;

  constructor(
    private floorId: string,
    private updatedRoom: Room
  ) {}

  execute(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    if (!floor) return project;

    const existing = floor.rooms.find((r) => r.id === this.updatedRoom.id);
    if (existing) {
      this.previousRoom = { ...existing };
    }

    const newRooms = existing
      ? floor.rooms.map((r) => (r.id === this.updatedRoom.id ? this.updatedRoom : r))
      : [...floor.rooms, this.updatedRoom];

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          rooms: newRooms,
        };
      }),
    };
  }

  undo(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    if (!floor) return project;

    const revertedRooms = this.previousRoom
      ? floor.rooms.map((r) => (r.id === this.updatedRoom.id ? this.previousRoom! : r))
      : floor.rooms.filter((r) => r.id !== this.updatedRoom.id);

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          rooms: revertedRooms,
        };
      }),
    };
  }
}

export class AddSymbolCommand implements Command {
  readonly id = `cmd_add_sym_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Add MEP Symbol';

  constructor(
    private floorId: string,
    private symbol: ArchitecturalSymbol
  ) {}

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          symbols: [...(f.symbols || []), this.symbol],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          symbols: (f.symbols || []).filter((s) => s.id !== this.symbol.id),
        };
      }),
    };
  }
}

export class UpdateSymbolCommand implements Command {
  readonly id = `cmd_upd_sym_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update MEP Symbol';
  private previousSymbol: ArchitecturalSymbol | undefined;
  private symbolId: string;
  private patch: Partial<ArchitecturalSymbol>;

  constructor(
    private floorId: string,
    symbolOrId: string | ArchitecturalSymbol,
    patch?: Partial<ArchitecturalSymbol>
  ) {
    if (typeof symbolOrId === 'string') {
      this.symbolId = symbolOrId;
      this.patch = patch || {};
    } else {
      this.symbolId = symbolOrId.id;
      this.patch = symbolOrId;
    }
  }

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.previousSymbol = fl.symbols?.find((s) => s.id === this.symbolId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          symbols: (f.symbols || []).map((s) => {
            if (s.id !== this.symbolId) return s;
            return {
              ...s,
              ...this.patch,
              position: this.patch.position ? { ...s.position, ...this.patch.position } : s.position,
            };
          }),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.previousSymbol) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          symbols: (f.symbols || []).map((s) => (s.id === this.symbolId ? this.previousSymbol! : s)),
        };
      }),
    };
  }
}

export class DeleteSymbolCommand implements Command {
  readonly id = `cmd_del_sym_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete MEP Symbol';
  private removedSymbol: ArchitecturalSymbol | undefined;

  constructor(
    private floorId: string,
    private symbolId: string
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.removedSymbol = fl.symbols?.find((s) => s.id === this.symbolId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          symbols: (f.symbols || []).filter((s) => s.id !== this.symbolId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedSymbol) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          symbols: [...(f.symbols || []), this.removedSymbol!],
        };
      }),
    };
  }
}

export class AddSectionCutCommand implements Command {
  readonly id = `cmd_add_sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Add Section Cut';

  constructor(
    private floorId: string,
    private sectionCut: SectionCut
  ) {}

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          sections: [...(f.sections || []), this.sectionCut],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          sections: (f.sections || []).filter((s) => s.id !== this.sectionCut.id),
        };
      }),
    };
  }
}

export class UpdateSectionCutCommand implements Command {
  readonly id = `cmd_upd_sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Section Cut';
  private previousCut: SectionCut | undefined;
  private cutId: string;
  private patch: Partial<SectionCut>;

  constructor(
    private floorId: string,
    cutOrId: string | SectionCut,
    patch?: Partial<SectionCut>
  ) {
    if (typeof cutOrId === 'string') {
      this.cutId = cutOrId;
      this.patch = patch || {};
    } else {
      this.cutId = cutOrId.id;
      this.patch = cutOrId;
    }
  }

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.previousCut = fl.sections?.find((s) => s.id === this.cutId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          sections: (f.sections || []).map((s) => {
            if (s.id !== this.cutId) return s;
            return {
              ...s,
              ...this.patch,
              p1: this.patch.p1 ? { ...this.patch.p1 } : s.p1,
              p2: this.patch.p2 ? { ...this.patch.p2 } : s.p2,
            };
          }),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.previousCut) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          sections: (f.sections || []).map((s) => (s.id === this.cutId ? this.previousCut! : s)),
        };
      }),
    };
  }
}

export class DeleteSectionCutCommand implements Command {
  readonly id = `cmd_del_sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Section Cut';
  private removedCut: SectionCut | undefined;

  constructor(
    private floorId: string,
    private cutId: string
  ) {}

  execute(project: Project): Project {
    const fl = project.floors.find((f) => f.id === this.floorId);
    if (fl) {
      this.removedCut = fl.sections?.find((s) => s.id === this.cutId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          sections: (f.sections || []).filter((s) => s.id !== this.cutId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedCut) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((f) => {
        if (f.id !== this.floorId) return f;
        return {
          ...f,
          sections: [...(f.sections || []), this.removedCut!],
        };
      }),
    };
  }
}

export class UpdateSiteSettingsCommand implements Command {
  readonly id = `cmd_upd_site_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Update Site Settings';
  private previousSite: SitePlan | undefined;

  constructor(private updates: Partial<SitePlan>) {}

  execute(project: Project): Project {
    if (project.site) {
      this.previousSite = { ...project.site };
    }

    const currentSite = project.site || createDefaultSitePlan();
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...currentSite,
        ...this.updates,
      },
    };
  }

  undo(project: Project): Project {
    if (!this.previousSite) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: { ...this.previousSite },
    };
  }
}

export class AddOutdoorFeatureCommand implements Command {
  readonly id = `cmd_add_outdoor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;

  constructor(private feature: OutdoorFeature) {
    this.name = `Add ${feature.name}`;
  }

  execute(project: Project): Project {
    const site = project.site || createDefaultSitePlan();
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...site,
        features: [...site.features, this.feature],
      },
    };
  }

  undo(project: Project): Project {
    if (!project.site) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...project.site,
        features: project.site.features.filter((f) => f.id !== this.feature.id),
      },
    };
  }
}

export class UpdateOutdoorFeatureCommand implements Command {
  readonly id = `cmd_upd_outdoor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;
  private previousFeature: OutdoorFeature | undefined;

  constructor(
    private target: OutdoorFeature | string,
    private updates?: Partial<OutdoorFeature>
  ) {
    this.name = typeof target === 'string' ? 'Update Outdoor Feature' : `Update ${target.name}`;
  }

  execute(project: Project): Project {
    const site = project.site || createDefaultSitePlan();
    const id = typeof this.target === 'string' ? this.target : this.target.id;
    const existing = site.features.find((f) => f.id === id);
    if (existing) {
      this.previousFeature = { ...existing };
    }

    const updated = typeof this.target === 'string'
      ? (existing ? { ...existing, ...this.updates } : null)
      : this.target;

    if (!updated) return project;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...site,
        features: site.features.map((f) => (f.id === id ? updated : f)),
      },
    };
  }

  undo(project: Project): Project {
    if (!this.previousFeature) return project;
    const site = project.site || createDefaultSitePlan();
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...site,
        features: site.features.map((f) =>
          f.id === this.previousFeature!.id ? this.previousFeature! : f
        ),
      },
    };
  }
}

export class DeleteOutdoorFeatureCommand implements Command {
  readonly id = `cmd_del_outdoor_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Outdoor Feature';
  private removedFeature: OutdoorFeature | undefined;

  constructor(private featureId: string) {}

  execute(project: Project): Project {
    if (project.site) {
      this.removedFeature = project.site.features.find((f) => f.id === this.featureId);
    }

    if (!project.site) return project;

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...project.site,
        features: project.site.features.filter((f) => f.id !== this.featureId),
      },
    };
  }

  undo(project: Project): Project {
    if (!project.site || !this.removedFeature) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      site: {
        ...project.site,
        features: [...project.site.features, this.removedFeature],
      },
    };
  }
}

export class AddKitchenDesignCommand implements Command {
  readonly id = `cmd_add_kitchen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;

  constructor(
    private floorId: string,
    private kitchen: KitchenDesign
  ) {
    this.name = `Add Kitchen (${kitchen.name})`;
  }

  execute(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          kitchens: [...(fl.kitchens || []), this.kitchen],
        };
      }),
    };
  }

  undo(project: Project): Project {
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          kitchens: (fl.kitchens || []).filter((k) => k.id !== this.kitchen.id),
        };
      }),
    };
  }
}

export class UpdateKitchenDesignCommand implements Command {
  readonly id = `cmd_upd_kitchen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name: string;
  private previousKitchen: KitchenDesign | undefined;

  constructor(
    private floorId: string,
    private updatedKitchen: KitchenDesign
  ) {
    this.name = `Update Kitchen (${updatedKitchen.name})`;
  }

  execute(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    if (floor && floor.kitchens) {
      const existing = floor.kitchens.find((k) => k.id === this.updatedKitchen.id);
      if (existing) {
        this.previousKitchen = { ...existing };
      }
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          kitchens: (fl.kitchens || []).map((k) =>
            k.id === this.updatedKitchen.id ? this.updatedKitchen : k
          ),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.previousKitchen) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          kitchens: (fl.kitchens || []).map((k) =>
            k.id === this.previousKitchen!.id ? this.previousKitchen! : k
          ),
        };
      }),
    };
  }
}

export class DeleteKitchenDesignCommand implements Command {
  readonly id = `cmd_del_kitchen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  readonly name = 'Delete Kitchen';
  private removedKitchen: KitchenDesign | undefined;

  constructor(
    private floorId: string,
    private kitchenId: string
  ) {}

  execute(project: Project): Project {
    const floor = project.floors.find((f) => f.id === this.floorId);
    if (floor && floor.kitchens) {
      this.removedKitchen = floor.kitchens.find((k) => k.id === this.kitchenId);
    }

    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          kitchens: (fl.kitchens || []).filter((k) => k.id !== this.kitchenId),
        };
      }),
    };
  }

  undo(project: Project): Project {
    if (!this.removedKitchen) return project;
    return {
      ...project,
      updatedAt: new Date().toISOString(),
      floors: project.floors.map((fl) => {
        if (fl.id !== this.floorId) return fl;
        return {
          ...fl,
          kitchens: [...(fl.kitchens || []), this.removedKitchen!],
        };
      }),
    };
  }
}




