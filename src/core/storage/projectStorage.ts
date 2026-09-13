import { Project } from '../model/types';
import { createDefaultProject } from '../model/defaults';

const AUTOSAVE_KEY = 'homedesigner_autosave_v1';
const AUTOSAVE_META_KEY = 'homedesigner_autosave_meta_v1';

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function deserializeProject(jsonStr: string): {
  project: Project;
  isValid: boolean;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonStr) as Partial<Project>;
    if (!data.schemaVersion || !data.floors || !Array.isArray(data.floors)) {
      return {
        project: createDefaultProject(),
        isValid: false,
        error: 'Invalid project format: missing schemaVersion or floors array.',
      };
    }

    // Future-proof migrations can happen here
    const project = data as Project;
    return { project, isValid: true };
  } catch (err: unknown) {
    return {
      project: createDefaultProject(),
      isValid: false,
      error: err instanceof Error ? err.message : 'Unknown JSON parse error',
    };
  }
}

/**
 * Checks if the current execution context is inside Tauri desktop environment.
 */
export function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in (window as unknown as Record<string, unknown>)
  );
}

/**
 * Saves a project locally to a .homedesign file.
 * Automatically selects Tauri native dialog or browser download fallback.
 */
export async function saveProjectToFile(
  project: Project,
  suggestedName?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const jsonContent = serializeProject(project);
  const defaultFileName = suggestedName
    ? `${suggestedName.replace(/[^a-zA-Z0-9_-]/g, '_')}.homedesign`
    : `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.homedesign`;

  if (isTauriEnvironment()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const selectedPath = await save({
        filters: [{ name: 'Home Designer Project', extensions: ['homedesign', 'json'] }],
        defaultPath: defaultFileName,
      });

      if (!selectedPath) {
        return { success: false, error: 'User cancelled file save.' };
      }

      await writeTextFile(selectedPath, jsonContent);
      return { success: true, filePath: selectedPath };
    } catch (err: unknown) {
      console.warn('Tauri save failed, falling back to browser download:', err);
    }
  }

  // Web fallback: download blob
  try {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = defaultFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return { success: true, filePath: defaultFileName };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save project file',
    };
  }
}

/**
 * Opens a project file from local disk.
 * Supports Tauri native dialog or browser input fallback.
 */
export async function openProjectFromFile(): Promise<{
  success: boolean;
  project?: Project;
  filePath?: string;
  error?: string;
}> {
  if (isTauriEnvironment()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Home Designer Project', extensions: ['homedesign', 'json'] }],
      });

      if (!selected || typeof selected !== 'string') {
        return { success: false, error: 'User cancelled file open.' };
      }

      const content = await readTextFile(selected);
      const parsed = deserializeProject(content);
      if (!parsed.isValid) {
        return { success: false, error: parsed.error };
      }
      return { success: true, project: parsed.project, filePath: selected };
    } catch (err: unknown) {
      console.warn('Tauri open failed, falling back to file input:', err);
    }
  }

  // Browser fallback
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.homedesign,.json';
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ success: false, error: 'No file selected' });
        return;
      }
      try {
        const text = await file.text();
        const parsed = deserializeProject(text);
        if (!parsed.isValid) {
          resolve({ success: false, error: parsed.error });
        } else {
          resolve({ success: true, project: parsed.project, filePath: file.name });
        }
      } catch (err: unknown) {
        resolve({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to read file',
        });
      } finally {
        document.body.removeChild(input);
      }
    };

    input.oncancel = () => {
      resolve({ success: false, error: 'User cancelled file open.' });
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Saves current project snapshot into local recovery storage.
 */
export function autosaveProject(project: Project): void {
  try {
    const serialized = serializeProject(project);
    const meta = {
      projectId: project.id,
      projectName: project.name,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTOSAVE_KEY, serialized);
    localStorage.setItem(AUTOSAVE_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error('Autosave failed:', err);
  }
}

/**
 * Loads autosaved project if available.
 */
export function loadAutosavedProject(): {
  project: Project;
  savedAt: string;
} | null {
  try {
    const serialized = localStorage.getItem(AUTOSAVE_KEY);
    const metaStr = localStorage.getItem(AUTOSAVE_META_KEY);
    if (!serialized) return null;

    const parsed = deserializeProject(serialized);
    if (!parsed.isValid) return null;

    const meta = metaStr ? JSON.parse(metaStr) : { savedAt: new Date().toISOString() };
    return {
      project: parsed.project,
      savedAt: meta.savedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to load autosave:', err);
    return null;
  }
}

/**
 * Clears autosaved project from local recovery storage.
 */
export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
    localStorage.removeItem(AUTOSAVE_META_KEY);
  } catch (err) {
    console.error('Failed to clear autosave:', err);
  }
}
