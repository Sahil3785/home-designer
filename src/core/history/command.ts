import { Project } from '../model/types';

export interface Command {
  id: string;
  name: string;
  execute(project: Project): Project;
  undo(project: Project): Project;
}

export type HistoryListener = (project: Project, canUndo: boolean, canRedo: boolean) => void;

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number;
  private currentProject: Project;
  private listeners: Set<HistoryListener> = new Set();
  private dirty: boolean = false;

  constructor(initialProject: Project, maxHistory = 100) {
    this.currentProject = initialProject;
    this.maxHistory = maxHistory;
  }

  getProject(): Project {
    return this.currentProject;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  markClean(): void {
    this.dirty = false;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoActionName(): string | null {
    const last = this.undoStack[this.undoStack.length - 1];
    return last ? last.name : null;
  }

  getRedoActionName(): string | null {
    const next = this.redoStack[this.redoStack.length - 1];
    return next ? next.name : null;
  }

  execute(command: Command): Project {
    const newProject = command.execute(this.currentProject);
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // clear redo on new action
    this.currentProject = newProject;
    this.dirty = true;
    this.notify();
    return this.currentProject;
  }

  undo(): Project | null {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;

    const reverted = cmd.undo(this.currentProject);
    this.redoStack.push(cmd);
    this.currentProject = reverted;
    this.dirty = true;
    this.notify();
    return this.currentProject;
  }

  redo(): Project | null {
    const cmd = this.redoStack.pop();
    if (!cmd) return null;

    const applied = cmd.execute(this.currentProject);
    this.undoStack.push(cmd);
    this.currentProject = applied;
    this.dirty = true;
    this.notify();
    return this.currentProject;
  }

  reset(newProject: Project): void {
    this.currentProject = newProject;
    this.undoStack = [];
    this.redoStack = [];
    this.dirty = false;
    this.notify();
  }

  subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProject, this.canUndo(), this.canRedo());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const p = this.currentProject;
    const u = this.canUndo();
    const r = this.canRedo();
    this.listeners.forEach((fn) => fn(p, u, r));
  }
}
