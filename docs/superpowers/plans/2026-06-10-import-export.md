# Project Import/Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users export a project to a self-contained JSON file and import it back, creating a new project or overwriting an existing one with name confirmation.

**Architecture:** Two thin thunks (`exportProject`, `importProject`) work against existing Redux slices. Export serialises state to a JSON blob and triggers a browser download. Import parses the JSON, regenerates all IDs to avoid collisions, and dispatches existing `addProject` / `addFolder` / `addFile` / `addAsset` actions in order. UI adds an Import button to the Projects list header, an Export button to each project card, and an Export icon to the editor's left activity bar.

**Tech Stack:** React, Redux Toolkit, TypeScript, uuid (already in project), Vitest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/features/projects/exportProject.ts` | Create | `buildExportJson` pure helper + `exportProject` thunk |
| `src/features/projects/importProject.ts` | Create | `importProject` thunk — ID remapping + dispatch |
| `src/components/Projects/index.tsx` | Modify | Import button in `ProjectList` header; Export button in `ProjectCard` |
| `src/components/ProjectShell/index.tsx` | Modify | Extend `ActivitySection` type; export `ExportIcon` |
| `src/pages/EditPage.tsx` | Modify | Add Export activity section |
| `tests/ui/features/projects/exportProject.test.ts` | Create | Unit tests for `buildExportJson` |
| `tests/ui/features/projects/importProject.test.ts` | Create | Integration tests for `importProject` thunk |

---

### Task 1: `exportProject` — serialisation + download

**Files:**
- Create: `src/features/projects/exportProject.ts`
- Create: `tests/ui/features/projects/exportProject.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/features/projects/exportProject.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { buildExportJson } from '../../../../src/features/projects/exportProject';

const state = {
  projects: { items: [{ id: 'p1', name: 'My Game', packageIds: ['softcore'] }] },
  folders: {
    items: [
      { id: 'f1', name: 'Classes', projectId: 'p1', parentId: null, section: 'files' as const },
    ],
  },
  files: {
    byId: {
      file1: { id: 'file1', name: 'Main', source: 'print 1', projectId: 'p1', folderId: null, fullName: 'Main.bas' },
      file2: { id: 'file2', name: 'Player', source: 'class', projectId: 'p1', folderId: 'f1', fullName: 'Classes/Player.bas' },
      other: { id: 'other', name: 'Other', source: '', projectId: 'p99', folderId: null, fullName: 'Other.bas' },
    },
    fileOrder: {
      'p1:root': ['file1'],
      'p1:f1': ['file2'],
      'p99:root': ['other'],
    },
    dirtyFileIds: [],
  },
  assets: {
    byId: {
      a1: { id: 'a1', name: 'hero.png', content: 'data:image/png;base64,abc', projectId: 'p1', folderId: null, fullName: 'hero.png' },
    },
    assetOrder: { 'p1:root': ['a1'] },
  },
};

describe('buildExportJson', () => {
  test('version is 1', () => {
    expect(buildExportJson('p1', state).version).toBe(1);
  });

  test('project name is preserved', () => {
    expect(buildExportJson('p1', state).project.name).toBe('My Game');
  });

  test('only includes files for the exported project', () => {
    const json = buildExportJson('p1', state);
    expect(json.files).toHaveLength(2);
    expect(json.files.every((f) => f.id !== 'other')).toBe(true);
  });

  test('file entries do not include projectId', () => {
    const json = buildExportJson('p1', state);
    expect('projectId' in json.files[0]).toBe(false);
  });

  test('fileOrder keys have projectId prefix stripped', () => {
    const json = buildExportJson('p1', state);
    expect(Object.keys(json.fileOrder)).toContain(':root');
    expect(Object.keys(json.fileOrder)).toContain(':f1');
    expect(Object.keys(json.fileOrder).some((k) => k.includes('p1'))).toBe(false);
  });

  test('fileOrder keys do not include keys from other projects', () => {
    const json = buildExportJson('p1', state);
    expect(Object.keys(json.fileOrder)).toHaveLength(2);
  });

  test('asset content is preserved as-is', () => {
    const json = buildExportJson('p1', state);
    expect(json.assets[0].content).toBe('data:image/png;base64,abc');
  });

  test('folder entries do not include projectId', () => {
    const json = buildExportJson('p1', state);
    expect('projectId' in json.folders[0]).toBe(false);
  });

  test('throws if projectId is not found', () => {
    expect(() => buildExportJson('no-such', state)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run tests/ui/features/projects/exportProject.test.ts
```

Expected: All tests fail with "Cannot find module" or similar.

- [ ] **Step 3: Implement `exportProject.ts`**

Create `src/features/projects/exportProject.ts`:

```ts
import { AppDispatch, RootState } from '../../store';
import { Project } from './projectsSlice';
import { IFile } from '../files/filesSlice';
import { IAsset } from '../assets/assetsSlice';
import { IFolder } from '../folders/foldersSlice';

export interface ProjectExportJson {
  version: 1;
  project: { name: string };
  folders: Array<{ id: string; name: string; parentId: string | null; section: 'files' | 'assets' }>;
  files: Array<{ id: string; name: string; source: string; folderId: string | null; fullName: string }>;
  assets: Array<{ id: string; name: string; content: string; folderId: string | null; fullName: string }>;
  fileOrder: Record<string, string[]>;
  assetOrder: Record<string, string[]>;
}

type ExportableState = {
  projects: { items: Project[] };
  folders: { items: IFolder[] };
  files: { byId: Record<string, IFile>; fileOrder: Record<string, string[]> };
  assets: { byId: Record<string, IAsset>; assetOrder: Record<string, string[]> };
};

export function buildExportJson(projectId: string, state: ExportableState): ProjectExportJson {
  const project = state.projects.items.find((p) => p.id === projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const folders = state.folders.items
    .filter((f) => f.projectId === projectId)
    .map(({ id, name, parentId, section }) => ({ id, name, parentId, section }));

  const files = Object.values(state.files.byId)
    .filter((f) => f.projectId === projectId)
    .map(({ id, name, source, folderId, fullName }) => ({ id, name, source, folderId, fullName }));

  const assets = Object.values(state.assets.byId)
    .filter((a) => a.projectId === projectId)
    .map(({ id, name, content, folderId, fullName }) => ({ id, name, content, folderId, fullName }));

  const fileOrder: Record<string, string[]> = {};
  Object.entries(state.files.fileOrder).forEach(([key, ids]) => {
    if (key.startsWith(`${projectId}:`)) {
      fileOrder[key.slice(projectId.length)] = ids;
    }
  });

  const assetOrder: Record<string, string[]> = {};
  Object.entries(state.assets.assetOrder).forEach(([key, ids]) => {
    if (key.startsWith(`${projectId}:`)) {
      assetOrder[key.slice(projectId.length)] = ids;
    }
  });

  return { version: 1, project: { name: project.name }, folders, files, assets, fileOrder, assetOrder };
}

export function triggerDownload(json: ProjectExportJson, filename: string): void {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportProject =
  (projectId: string) => (_dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const project = state.projects.items.find((p) => p.id === projectId);
    if (!project) return;
    const json = buildExportJson(projectId, state);
    triggerDownload(json, `${project.name}.b4wgl.json`);
  };
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/ui/features/projects/exportProject.test.ts
```

Expected: All 9 tests pass.

- [ ] **Step 5: Commit**

```
git add src/features/projects/exportProject.ts tests/ui/features/projects/exportProject.test.ts
git commit -m "feat: add exportProject thunk and buildExportJson helper"
```

---

### Task 2: `importProject` — ID remapping + dispatch

**Files:**
- Create: `src/features/projects/importProject.ts`
- Create: `tests/ui/features/projects/importProject.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/features/projects/importProject.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../../../../src/features/projects/projectsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import { importProject } from '../../../../src/features/projects/importProject';
import { ProjectExportJson } from '../../../../src/features/projects/exportProject';

function makeStore() {
  return configureStore({
    reducer: {
      projects: projectsReducer,
      folders: foldersReducer,
      files: filesReducer,
      assets: assetsReducer,
    },
  });
}

const sampleJson: ProjectExportJson = {
  version: 1,
  project: { name: 'My Game' },
  folders: [
    { id: 'f1', name: 'Classes', parentId: null, section: 'files' },
  ],
  files: [
    { id: 'file1', name: 'Main', source: 'print 1', folderId: null, fullName: 'Main.bas' },
    { id: 'file2', name: 'Player', source: 'class', folderId: 'f1', fullName: 'Classes/Player.bas' },
  ],
  assets: [
    { id: 'a1', name: 'hero.png', content: 'data:image/png;base64,abc', folderId: null, fullName: 'hero.png' },
  ],
  fileOrder: { ':root': ['file1'], ':f1': ['file2'] },
  assetOrder: { ':root': ['a1'] },
};

describe('importProject', () => {
  test('creates a project with the correct name', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    expect(store.getState().projects.items[0].name).toBe('My Game');
  });

  test('assigns a new projectId (not the original)', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const projectId = store.getState().projects.items[0].id;
    expect(projectId).toBeTruthy();
    // The JSON has no projectId — any new unique id is correct
  });

  test('imports all files with new IDs', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const fileIds = Object.keys(store.getState().files.byId);
    expect(fileIds).toHaveLength(2);
    expect(fileIds).not.toContain('file1');
    expect(fileIds).not.toContain('file2');
  });

  test('file source is preserved', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const files = Object.values(store.getState().files.byId);
    const main = files.find((f) => f.name === 'Main');
    expect(main?.source).toBe('print 1');
  });

  test('file order is preserved for root bucket', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const projectId = store.getState().projects.items[0].id;
    const order = store.getState().files.fileOrder[`${projectId}:root`];
    expect(order).toHaveLength(1);
    const mainFile = Object.values(store.getState().files.byId).find((f) => f.name === 'Main');
    expect(order[0]).toBe(mainFile?.id);
  });

  test('file in folder is assigned the new folderId', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const folder = store.getState().folders.items.find((f) => f.name === 'Classes');
    const playerFile = Object.values(store.getState().files.byId).find((f) => f.name === 'Player');
    expect(playerFile?.folderId).toBe(folder?.id);
  });

  test('imports all assets with new IDs', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const assetIds = Object.keys(store.getState().assets.byId);
    expect(assetIds).toHaveLength(1);
    expect(assetIds).not.toContain('a1');
  });

  test('asset content is preserved', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    const asset = Object.values(store.getState().assets.byId)[0];
    expect(asset.content).toBe('data:image/png;base64,abc');
  });

  test('project packageIds default to softcore + softgfx', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    expect(store.getState().projects.items[0].packageIds).toEqual(['softcore', 'softgfx']);
  });

  test('two imports of the same JSON create two independent projects', () => {
    const store = makeStore();
    store.dispatch(importProject(sampleJson));
    store.dispatch(importProject(sampleJson));
    expect(store.getState().projects.items).toHaveLength(2);
    const [id1, id2] = store.getState().projects.items.map((p) => p.id);
    expect(id1).not.toBe(id2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run tests/ui/features/projects/importProject.test.ts
```

Expected: All tests fail with "Cannot find module".

- [ ] **Step 3: Implement `importProject.ts`**

Create `src/features/projects/importProject.ts`:

```ts
import { v4 as uuidv4 } from 'uuid';
import { AppDispatch } from '../../store';
import { addProject } from './projectsSlice';
import { addFolder } from '../folders/foldersSlice';
import { addFile } from '../files/filesSlice';
import { addAsset } from '../assets/assetsSlice';
import { ProjectExportJson } from './exportProject';

export const importProject =
  (json: ProjectExportJson) => (dispatch: AppDispatch) => {
    const newProjectId = uuidv4();

    const folderIdMap: Record<string, string> = {};
    json.folders.forEach((f) => { folderIdMap[f.id] = uuidv4(); });

    const fileIdMap: Record<string, string> = {};
    json.files.forEach((f) => { fileIdMap[f.id] = uuidv4(); });

    const assetIdMap: Record<string, string> = {};
    json.assets.forEach((a) => { assetIdMap[a.id] = uuidv4(); });

    dispatch(addProject({ id: newProjectId, name: json.project.name, packageIds: ['softcore', 'softgfx'] }));

    json.folders.forEach((f) => {
      dispatch(addFolder({
        id: folderIdMap[f.id],
        name: f.name,
        projectId: newProjectId,
        parentId: f.parentId ? (folderIdMap[f.parentId] ?? null) : null,
        section: f.section,
      }));
    });

    // Dispatch files in fileOrder order so bucket order is preserved
    const dispatchedFileIds = new Set<string>();
    Object.values(json.fileOrder).forEach((orderedIds) => {
      orderedIds.forEach((oldId) => {
        const file = json.files.find((f) => f.id === oldId);
        if (!file) return;
        dispatch(addFile({
          id: fileIdMap[oldId],
          name: file.name,
          source: file.source,
          projectId: newProjectId,
          folderId: file.folderId ? (folderIdMap[file.folderId] ?? null) : null,
          fullName: file.fullName,
        }));
        dispatchedFileIds.add(oldId);
      });
    });
    // Catch any files absent from fileOrder (defensive)
    json.files.forEach((file) => {
      if (dispatchedFileIds.has(file.id)) return;
      dispatch(addFile({
        id: fileIdMap[file.id],
        name: file.name,
        source: file.source,
        projectId: newProjectId,
        folderId: file.folderId ? (folderIdMap[file.folderId] ?? null) : null,
        fullName: file.fullName,
      }));
    });

    // Dispatch assets in assetOrder order
    const dispatchedAssetIds = new Set<string>();
    Object.values(json.assetOrder).forEach((orderedIds) => {
      orderedIds.forEach((oldId) => {
        const asset = json.assets.find((a) => a.id === oldId);
        if (!asset) return;
        dispatch(addAsset({
          id: assetIdMap[oldId],
          name: asset.name,
          content: asset.content,
          projectId: newProjectId,
          folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
          fullName: asset.fullName,
        }));
        dispatchedAssetIds.add(oldId);
      });
    });
    json.assets.forEach((asset) => {
      if (dispatchedAssetIds.has(asset.id)) return;
      dispatch(addAsset({
        id: assetIdMap[asset.id],
        name: asset.name,
        content: asset.content,
        projectId: newProjectId,
        folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
        fullName: asset.fullName,
      }));
    });
  };
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run tests/ui/features/projects/importProject.test.ts
```

Expected: All 10 tests pass.

- [ ] **Step 5: Run the full test suite to check for regressions**

```
npx vitest run
```

Expected: All tests pass (previously ~713+).

- [ ] **Step 6: Commit**

```
git add src/features/projects/importProject.ts tests/ui/features/projects/importProject.test.ts
git commit -m "feat: add importProject thunk with ID remapping"
```

---

### Task 3: Projects page — Export button on `ProjectCard`

**Files:**
- Modify: `src/components/Projects/index.tsx`

The `ProjectCard` component already has `dispatch = useDispatch<AppDispatch>()`. Add an Export button that appears on hover in the card footer, on the left side near "Open →".

- [ ] **Step 1: Add `exportProject` import to `Projects/index.tsx`**

At the top of `src/components/Projects/index.tsx`, add to the existing imports:

```ts
import { exportProject } from '../../features/projects/exportProject';
```

- [ ] **Step 2: Add the Export button to `ProjectCard`'s footer row**

In `ProjectCard`, find the `<div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border-subtle">` block. It currently contains the "Open →" link on the left and the "Delete" button on the right. Add an Export button between them:

```tsx
<div className="flex items-center justify-between mt-4 pt-3 border-t border-ds-border-subtle">
  <Link
    to={`/projects/${project.id}/edit`}
    className="text-ds-accent-btn-text bg-ds-accent-btn text-xs font-semibold px-3 py-1.5 rounded hover:opacity-90 transition"
  >
    Open →
  </Link>
  <div className="flex items-center gap-3">
    <button
      onClick={() => dispatch(exportProject(project.id))}
      className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text-muted text-xs transition-opacity"
      aria-label={`Export project ${project.name}`}
    >
      Export
    </button>
    <button
      onClick={openDeleteModal}
      className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error text-xs transition-opacity"
      aria-label={`Delete project ${project.name}`}
    >
      Delete
    </button>
  </div>
</div>
```

- [ ] **Step 3: Verify the app compiles without TypeScript errors**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```
git add src/components/Projects/index.tsx
git commit -m "feat: add Export button to ProjectCard"
```

---

### Task 4: Projects page — Import button + overwrite modal in `ProjectList`

**Files:**
- Modify: `src/components/Projects/index.tsx`

The `ProjectList` component already has `dispatch`, `projects` from Redux, and a `showModal` + `newName` state for "New project". We add an Import button in the page header, a hidden file input, and an overwrite confirmation modal.

- [ ] **Step 1: Add `importProject` and `deleteProjectWithMainFile` imports**

Add to the existing imports at the top of `src/components/Projects/index.tsx`:

```ts
import { importProject } from '../../features/projects/importProject';
import { deleteProjectWithMainFile } from '../../features/projects/deleteProjectAndFiles';
import { ProjectExportJson } from '../../features/projects/exportProject';
```

- [ ] **Step 2: Add state and ref to `ProjectList`**

Inside the `ProjectList` component, after the existing `useState`/`useRef` declarations, add:

```tsx
const importInputRef = useRef<HTMLInputElement>(null);
const [importPendingJson, setImportPendingJson] = useState<ProjectExportJson | null>(null);
const [showImportOverwriteModal, setShowImportOverwriteModal] = useState(false);
const [importConfirmName, setImportConfirmName] = useState('');
const importOverwriteInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 3: Add the file-selected handler**

Inside `ProjectList`, after `handleRemove`, add:

```tsx
const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!importInputRef.current) return;
  importInputRef.current.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    let json: ProjectExportJson;
    try {
      json = JSON.parse(event.target?.result as string) as ProjectExportJson;
    } catch {
      alert('Invalid file: not valid JSON');
      return;
    }
    if (json.version !== 1) {
      alert('Unsupported export version');
      return;
    }
    const existing = projects.find((p) => p.name === json.project.name);
    if (existing) {
      setImportPendingJson(json);
      setImportConfirmName('');
      setShowImportOverwriteModal(true);
    } else {
      dispatch(importProject(json));
    }
  };
  reader.readAsText(file);
};

const handleImportOverwrite = () => {
  if (!importPendingJson || importConfirmName !== importPendingJson.project.name) return;
  const existing = projects.find((p) => p.name === importPendingJson.project.name);
  if (existing) dispatch(deleteProjectWithMainFile(existing.id));
  dispatch(importProject(importPendingJson));
  setShowImportOverwriteModal(false);
  setImportPendingJson(null);
  setImportConfirmName('');
};
```

- [ ] **Step 4: Add the keyboard and focus effects for the overwrite modal**

Inside `ProjectList`, after the existing `useEffect` blocks:

```tsx
useEffect(() => {
  if (showImportOverwriteModal) setTimeout(() => importOverwriteInputRef.current?.focus(), 0);
}, [showImportOverwriteModal]);

useEffect(() => {
  if (!showImportOverwriteModal) return;
  const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowImportOverwriteModal(false); };
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}, [showImportOverwriteModal]);
```

- [ ] **Step 5: Add the overwrite modal JSX**

Inside `ProjectList`, after the existing `const modal = ...` declaration, add:

```tsx
const importOverwriteModal = showImportOverwriteModal && importPendingJson
  ? ReactDOM.createPortal(
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        onClick={(e) => { if (e.target === e.currentTarget) setShowImportOverwriteModal(false); }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-overwrite-modal-title"
          className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
        >
          <h2 id="import-overwrite-modal-title" className="text-ds-text text-lg font-semibold mb-2">
            Overwrite project
          </h2>
          <p className="text-ds-text-muted text-sm mb-4">
            A project named <span className="text-ds-text font-medium">{importPendingJson.project.name}</span> already exists. This will replace all its files and assets. Type the project name to confirm.
          </p>
          <input
            ref={importOverwriteInputRef}
            type="text"
            value={importConfirmName}
            onChange={(e) => setImportConfirmName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleImportOverwrite(); }}
            placeholder={importPendingJson.project.name}
            className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={handleImportOverwrite}
              disabled={importConfirmName !== importPendingJson.project.name}
              className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import & Overwrite
            </button>
            <button
              onClick={() => setShowImportOverwriteModal(false)}
              className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  : null;
```

- [ ] **Step 6: Wire the modal and hidden input into the JSX return**

In the `ProjectList` return, add `{importOverwriteModal}` after `{modal}`, and add the hidden input and Import button.

The return currently starts with `<>{modal}<div className="flex items-center justify-between mb-6">...`. Change it to:

```tsx
return (
  <>
    {modal}
    {importOverwriteModal}
    <input
      ref={importInputRef}
      type="file"
      accept=".json"
      className="hidden"
      onChange={handleImportFileSelected}
    />
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-ds-text">My Projects</h1>
        <p className="text-ds-text-muted text-sm mt-0.5">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>
      <button
        onClick={() => importInputRef.current?.click()}
        className="text-ds-text-dim hover:text-ds-text-muted text-sm transition-colors"
        aria-label="Import project"
      >
        Import
      </button>
    </div>
    {/* rest of JSX unchanged */}
```

- [ ] **Step 7: Verify the app compiles without TypeScript errors**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```
git add src/components/Projects/index.tsx
git commit -m "feat: add Import button and overwrite modal to ProjectList"
```

---

### Task 5: Editor activity bar — Export icon

**Files:**
- Modify: `src/components/ProjectShell/index.tsx`
- Modify: `src/pages/EditPage.tsx`

The `ActivitySection` type currently requires `content`. We extend it with an optional `onAction` that fires instead of toggling the sidebar, then add an Export icon and wire it up in `EditPage`.

- [ ] **Step 1: Update `ActivitySection` type and add `ExportIcon` in `ProjectShell`**

In `src/components/ProjectShell/index.tsx`:

1. Add `ExportIcon` after `AssetsIcon`:

```tsx
const ExportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
```

2. Update the `ActivitySection` type:

```ts
export type ActivitySection = {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  content?: React.ReactNode;
  onAction?: () => void;
};
```

3. Update the activity bar button's `onClick` in the `ProjectShell` render:

```tsx
onClick={() => section.onAction ? section.onAction() : toggleSection(section.id)}
```

4. Update the export at the bottom:

```tsx
export { FilesIcon, AssetsIcon, ExportIcon };
```

- [ ] **Step 2: Wire the Export section into `EditPage`**

In `src/pages/EditPage.tsx`:

1. Update the import from `ProjectShell` to include `ExportIcon`:

```tsx
import ProjectShell, { FilesIcon, ExportIcon } from '../components/ProjectShell';
```

2. Import `exportProject`:

```tsx
import { exportProject } from '../features/projects/exportProject';
```

3. In the `activitySections` array, add the export section after the files section:

```tsx
activitySections={[
  {
    id: 'files',
    icon: <FilesIcon />,
    ariaLabel: 'Files',
    content: <TreePanel projectId={project.id} onOpenAsset={handleOpenAsset} />,
  },
  {
    id: 'export',
    icon: <ExportIcon />,
    ariaLabel: 'Export project',
    onAction: () => dispatch(exportProject(project.id)),
  },
]}
```

- [ ] **Step 3: Verify the app compiles without TypeScript errors**

```
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```
git add src/components/ProjectShell/index.tsx src/pages/EditPage.tsx
git commit -m "feat: add Export icon to editor activity bar"
```
