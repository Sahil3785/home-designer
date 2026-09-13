import { Command } from './command';
import { Project, Floor } from '../model/types';

export class GenerateFloorPlanCommand implements Command {
  id = `cmd_gen_plan_${Date.now()}`;
  name: string;
  private newFloor: Floor;
  private targetFloorId: string;
  private previousFloor?: Floor;
  private previousActiveFloorId: string;

  constructor(newFloor: Floor, targetFloorId: string, planTitle = 'Smart Generated Plan') {
    this.name = `Generate Floor Plan: ${planTitle}`;
    this.newFloor = newFloor;
    this.targetFloorId = targetFloorId;
    this.previousActiveFloorId = targetFloorId;
  }

  execute(project: Project): Project {
    const existingFloorIndex = project.floors.findIndex((f) => f.id === this.targetFloorId);
    if (existingFloorIndex !== -1) {
      this.previousFloor = { ...project.floors[existingFloorIndex] };
    }
    this.previousActiveFloorId = project.activeFloorId;

    const updatedFloors = project.floors.map((f) => {
      if (f.id === this.targetFloorId) {
        return {
          ...this.newFloor,
          id: f.id,
          name: f.name,
          levelIndex: f.levelIndex,
          elevation: f.elevation,
        };
      }
      return f;
    });

    return {
      ...project,
      floors: updatedFloors,
      activeFloorId: this.targetFloorId,
      updatedAt: new Date().toISOString(),
    };
  }

  undo(project: Project): Project {
    if (!this.previousFloor) return project;

    const revertedFloors = project.floors.map((f) => {
      if (f.id === this.targetFloorId && this.previousFloor) {
        return this.previousFloor;
      }
      return f;
    });

    return {
      ...project,
      floors: revertedFloors,
      activeFloorId: this.previousActiveFloorId,
      updatedAt: new Date().toISOString(),
    };
  }
}
