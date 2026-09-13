import { describe, it, expect } from 'vitest';
import { HistoryManager } from './command';
import { AddWallCommand, DeleteWallCommand, AddOpeningCommand } from './buildingCommands';
import { createDefaultProject } from '../model/defaults';
import { Wall, WallOpening } from '../model/types';
import { feetInchesToSixteenths } from '../units';

describe('Command and History System (Undo / Redo)', () => {
  it('initializes with clean state and empty undo/redo stacks', () => {
    const project = createDefaultProject();
    const history = new HistoryManager(project);

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.isDirty()).toBe(false);
  });

  it('executes AddWallCommand, updates project, and allows undo/redo', () => {
    const project = createDefaultProject();
    const history = new HistoryManager(project);
    const initialWallCount = project.floors[0].walls.length;

    const newWall: Wall = {
      id: 'wall_partition_1',
      floorId: project.activeFloorId,
      start: { x: 0, y: -1536 },
      end: { x: 0, y: 1536 },
      thickness: feetInchesToSixteenths(0, 4, 8), // 4 1/2"
      height: feetInchesToSixteenths(9, 0),
      openings: [],
    };

    // Execute command
    history.execute(newWallCommand(project.activeFloorId, newWall));
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.isDirty()).toBe(true);
    expect(history.getProject().floors[0].walls.length).toBe(initialWallCount + 1);

    // Undo
    history.undo();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
    expect(history.getProject().floors[0].walls.length).toBe(initialWallCount);

    // Redo
    history.redo();
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.getProject().floors[0].walls.length).toBe(initialWallCount + 1);
  });

  it('deletes a wall and restores it on undo', () => {
    const project = createDefaultProject();
    const history = new HistoryManager(project);
    const floorId = project.activeFloorId;
    const wallToDeleteId = project.floors[0].walls[0].id;
    const initialCount = project.floors[0].walls.length;

    history.execute(new DeleteWallCommand(floorId, wallToDeleteId));
    expect(history.getProject().floors[0].walls.length).toBe(initialCount - 1);
    expect(history.getProject().floors[0].walls.some((w) => w.id === wallToDeleteId)).toBe(false);

    // Undo restores the wall
    history.undo();
    expect(history.getProject().floors[0].walls.length).toBe(initialCount);
    expect(history.getProject().floors[0].walls.some((w) => w.id === wallToDeleteId)).toBe(true);
  });

  it('adds an opening to a wall and restores on undo', () => {
    const project = createDefaultProject();
    const history = new HistoryManager(project);
    const floorId = project.activeFloorId;
    const wall = project.floors[0].walls[3]; // wall_west has no openings initially
    expect(wall.openings.length).toBe(0);

    const door: WallOpening = {
      id: 'op_back_door',
      wallId: wall.id,
      name: 'Back Porch Door',
      type: 'door',
      offsetAlongWall: feetInchesToSixteenths(8, 0),
      width: feetInchesToSixteenths(3, 0),
      height: feetInchesToSixteenths(6, 8),
      elevation: 0,
      flipInward: true,
      flipHand: false,
    };

    history.execute(new AddOpeningCommand(floorId, wall.id, door));
    const updatedWall = history.getProject().floors[0].walls.find((w) => w.id === wall.id)!;
    expect(updatedWall.openings.length).toBe(1);
    expect(updatedWall.openings[0].id).toBe('op_back_door');

    // Undo removes it
    history.undo();
    const revertedWall = history.getProject().floors[0].walls.find((w) => w.id === wall.id)!;
    expect(revertedWall.openings.length).toBe(0);
  });
});

function newWallCommand(floorId: string, wall: Wall) {
  return new AddWallCommand(floorId, wall);
}
