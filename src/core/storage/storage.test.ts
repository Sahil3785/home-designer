import { describe, it, expect, beforeEach } from 'vitest';
import { createDefaultProject } from '../model/defaults';
import {
  serializeProject,
  deserializeProject,
  autosaveProject,
  loadAutosavedProject,
  clearAutosave,
} from './projectStorage';

describe('Project Storage & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('serializes and deserializes a project losslessly', () => {
    const original = createDefaultProject();
    const json = serializeProject(original);
    expect(typeof json).toBe('string');

    const result = deserializeProject(json);
    expect(result.isValid).toBe(true);
    expect(result.project.id).toBe(original.id);
    expect(result.project.floors.length).toBe(original.floors.length);
    expect(result.project.floors[0].walls.length).toBe(original.floors[0].walls.length);

    // Verify coordinates in sixteenths are preserved exactly
    const origWall = original.floors[0].walls[0];
    const restoredWall = result.project.floors[0].walls[0];
    expect(restoredWall.start.x).toBe(origWall.start.x);
    expect(restoredWall.start.y).toBe(origWall.start.y);
    expect(restoredWall.end.x).toBe(origWall.end.x);
    expect(restoredWall.end.y).toBe(origWall.end.y);
    expect(restoredWall.thickness).toBe(origWall.thickness);
  });

  it('handles invalid JSON gracefully', () => {
    const badResult = deserializeProject('{ not valid json');
    expect(badResult.isValid).toBe(false);
    expect(badResult.project).toBeDefined();
    expect(badResult.error).toBeDefined();
  });

  it('autosaves and restores interrupted session from localStorage', () => {
    const project = createDefaultProject();
    project.name = 'Autosaved Dream House';

    autosaveProject(project);

    const loaded = loadAutosavedProject();
    expect(loaded).not.toBeNull();
    expect(loaded?.project.name).toBe('Autosaved Dream House');

    clearAutosave();
    expect(loadAutosavedProject()).toBeNull();
  });
});
