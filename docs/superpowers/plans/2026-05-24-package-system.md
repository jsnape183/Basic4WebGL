# Package System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `projectLib` constant with a Redux-backed package registry, split built-in libs into `softCore`/`softGfx`, convert library sources to `.bas` files, and add a collapsible packages section to the FileTree panel.

**Architecture:** New `packagesSlice` holds the registry. `Project` gains `packageIds`. `useProjectForBuild` reads packages from the store and builds the compiler's `ProjectFile[]` from a static `packageModules` map backed by Vite `?raw` imports of real `.bas` files. App seeds first-party packages on mount. FileTree renders a collapsible `PackagesSection` above files, with an `AddPackageModal` triggered from the section header.

**Tech Stack:** TypeScript, React, Redux Toolkit, Vite (`?raw` imports), Vitest + Testing Library.

---

## File Map

| Action | Path |
|---|---|
| Create | `src/vite-env.d.ts` |
| Create | `src/lib/Basic4WebGL/defs/math.bas` |
| Create | `src/lib/Basic4WebGL/defs/string.bas` |
| Create | `src/lib/Basic4WebGL/defs/array.bas` |
| Create | `src/lib/Basic4WebGL/defs/gfx.bas` |
| Create | `src/lib/Basic4WebGL/defs/drawing.bas` |
| Create | `src/lib/Basic4WebGL/defs/stage.bas` |
| Create | `src/lib/Basic4WebGL/defs/pen.bas` |
| Create | `src/lib/Basic4WebGL/defs/text.bas` |
| Create | `src/lib/Basic4WebGL/defs/transform.bas` |
| Create | `src/lib/Basic4WebGL/defs/assetmanager.bas` |
| Create | `src/lib/Basic4WebGL/defs/spritemanager.bas` |
| Create | `src/constants/packageModules.ts` |
| Create | `src/constants/firstPartyPackages.ts` |
| Create | `src/features/packages/packagesSlice.ts` |
| Create | `src/components/FileTree/PackagesSection.tsx` |
| Create | `src/components/AddPackageModal/index.tsx` |
| Create | `tests/ui/features/packages/packagesSlice.test.ts` |
| Create | `tests/ui/components/FileTree/PackagesSection.test.tsx` |
| Create | `tests/ui/components/AddPackageModal/AddPackageModal.test.tsx` |
| Create | `tests/ui/hooks/useProjectForBuild.test.tsx` |
| Modify | `src/features/projects/projectsSlice.ts` |
| Modify | `src/features/projects/createProjectWithMainFile.ts` |
| Modify | `src/hooks/useProjectForBuild.ts` |
| Modify | `src/hooks/useCompiler.ts` |
| Modify | `src/store.ts` |
| Modify | `src/App.tsx` |
| Modify | `src/components/FileTree/index.tsx` |
| Modify | `tests/ui/components/FileTree/FileTree.test.tsx` |
| Modify | `tests/ui/components/FileTree/FileTreeReorder.test.tsx` |
| Modify | `tests/ui/components/FileTree/FileTreeValidation.test.tsx` |
| Delete | `src/constants/projectLib.ts` |
| Delete | `src/lib/Basic4WebGL/defs/softMath.ts` |
| Delete | `src/lib/Basic4WebGL/defs/softString.ts` |
| Delete | `src/lib/Basic4WebGL/defs/softArray.ts` |
| Delete | `src/lib/Basic4WebGL/defs/softGFX.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softDrawing.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softStage.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softPen.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softText.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softTransform.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softAssetManager.ts` |
| Delete | `src/lib/Basic4WebGL/defs/graphics/softSpriteManager.ts` |

---

## Task 1: Vite types + `.bas` source files + `packageModules.ts`

Convert all library string constants to real `.bas` files and wire them up via Vite `?raw` imports. No logic changes yet — the compiler still gets the same source strings.

**Files:**
- Create: `src/vite-env.d.ts`
- Create: `src/lib/Basic4WebGL/defs/math.bas` through `spritemanager.bas` (11 files)
- Create: `src/constants/packageModules.ts`
- Delete: all files in `src/lib/Basic4WebGL/defs/` that end in `.ts`

- [ ] **Step 1: Add Vite client types**

Create `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />
```

This gives TypeScript the type declaration for `?raw` imports (`import x from 'file?raw'` → `string`).

- [ ] **Step 2: Create `math.bas`**

Create `src/lib/Basic4WebGL/defs/math.bas`:

```
' Start of Math functions
function abs(n):return call("Math.abs(abs_n)"):endfunction
function acos(n):return call("Math.acos(acos_n)"):endfunction
function acosh(n):return call("Math.acosh(acosh_n)"):endfunction
function asin(n):return call("Math.asin(asin_n)"):endfunction
function asinh(n):return call("Math.asinh(asinh_n)"):endfunction
function atan(n):return call("Math.atan(atan_n)"):endfunction
function atan2(n1, n2):return call("Math.atan2(atan2_n1,atan2_n2)"):endfunction
function atanh(n):return call("Math.atanh(atanh_n)"):endfunction
function cbrt(n):return call("Math.cbrt(cbrt_n)"):endfunction
function ceil(n):return call("Math.ceil(ceil_n)"):endfunction
function cos(n):return call("Math.cos(cos_n)"):endfunction
function cosh(n):return call("Math.cosh(cosh_n)"):endfunction
function euler():return call("Math.E"):endfunction
function exp(n):return call("Math.exp(exp_n)"):endfunction
function floor(n):return call("Math.floor(floor_n)"):endfunction
function log(n):return call("Math.log(log_n)"):endfunction
function log2(n):return call("Math.log2(log2_n)"):endfunction
function log10(n):return call("Math.log10(log10_n)"):endfunction
function pi(): return call("Math.PI"):endfunction
function pow(x,y):return call("Math.pow(pow_x,pow_y)"):endfunction
function random(max):return call("Math.random(random_max)"):endfunction
function round(n):return call("Math.round(round_n)"):endfunction
function sign(n):return call("Math.sign(sign_n)"):endfunction
function sin(n):return call("Math.sin(sin_n)"):endfunction
function sinh(n):return call("Math.sinh(sinh_n)"):endfunction
function sqrt(n):return call("Math.sqrt(sqrt_n)"):endfunction
function tan(n):return call("Math.tan(tan_n)"):endfunction
function tanh(n):return call("Math.tanh(tanh_n)"):endfunction
function trunc(n):return call("Math.trunc(trunc_n)"):endfunction
function val(s):return call("Number(val_s)"):endfunction
' End of Math functions
```

Note: fixes the typo `pw_x` → `pow_x` in the original `softMath.ts`.

- [ ] **Step 3: Create `string.bas`**

Create `src/lib/Basic4WebGL/defs/string.bas`:

```
' Start of string functions
function len(s):return call("len_s.length"):endfunction
function lcase(s):return call("lcase_s.toLowerCase()"):endfunction
function padstart(s, n, p): return call("padstart_s.padStart(padstart_n,padstart_p)"):endfunction
function padend(s, n, p): return call("padend_s.padEnd(padend_n,padend_p)"):endfunction
function split(s, c): return call("split_s.split(split_c)"):endfunction
function str(n):return call("str_n.toString()"):endfunction
function substr(s, start, end):return call("substr_s.substring(substr_start,substr_end)"):endfunction
function trim(s):return call("trim_s.trim()"):endfunction
function ucase(s):return call("ucase_s.toUpperCase()"):endfunction
' End of string functions
```

Note: fixes the typo `padend_p.padEnd` → `padend_s.padEnd` in the original `softString.ts`.

- [ ] **Step 4: Create `array.bas`**

Create `src/lib/Basic4WebGL/defs/array.bas`:

```
' Start of Array functions
function arrLength(a): return call("arrlength_a.length"):endfunction
function join(a, s): return call("join_a.join(join_s)"):endfunction
' End of Array functions
```

- [ ] **Step 5: Create `gfx.bas`**

Create `src/lib/Basic4WebGL/defs/gfx.bas`:

```
function boxCollide(a,b)
  return call("_sb.boxCollide(a,b);")
endfunction

' Start of PIXI keyboard functions
function getKeyDown(keycode)
  return call("_sb.getKeyDown(keycode)")
endfunction
' End of PIXI keyboard functions
```

- [ ] **Step 6: Create `drawing.bas`**

Create `src/lib/Basic4WebGL/defs/drawing.bas`:

```
' Start of PIXI drawing functions
function drawLine(x,y,x2,y2)
  return call("_sb.drawLine(x,y,x2,y2)")
endfunction

function drawRect(x,y,width,height)
  return call("_sb.drawRect(x,y,width,height);")
endfunction

function drawCircle(x,y,radius)
  return call("_sb.drawCircle(x, y, radius);")
endfunction
' End of PIXI drawing functions
```

- [ ] **Step 7: Create `stage.bas`**

Create `src/lib/Basic4WebGL/defs/stage.bas`:

```
' Start of node registration function
function registerNode(nodeName)
  call("_SoftBasicGfx.getInstance().registerNode(registernode_nodeName.toLowerCase())")
endfunction
' End of node registration function

' Start of PIXI clear function
function clear()
  call("_SoftBasicGfx.getInstance().clear()")
endfunction
' End of PIXI clear function
```

- [ ] **Step 8: Create `pen.bas`**

Create `src/lib/Basic4WebGL/defs/pen.bas`:

```
' Start of PIXI manipulation functions
function setFillColor(r,g,b)
  call("_sb.setFillColor(r,g,b);")
endfunction

function setLineColor(r,g,b)
  call("_sb.setLineColor(r,g,b);")
endfunction

function setAlpha(obj,a)
  call("_sb.setAlpha(obj, a);")
endfunction
' End of PIXI manipulation functions
```

- [ ] **Step 9: Create `text.bas`**

Create `src/lib/Basic4WebGL/defs/text.bas`:

```
' Start of PIXI text functions
function drawText(s, x, y)
  return call("_sb.text(drawtext_s,drawtext_x,drawtext_y);")
endfunction

function setText(obj, text)
  call("_sb.setText(settext_obj,settext_text)")
endfunction
' End of PIXI text functions
```

- [ ] **Step 10: Create `transform.bas`**

Create `src/lib/Basic4WebGL/defs/transform.bas`:

```
function setPosition(obj, x, y)
  call("_SoftBasicGfx.getInstance().setPosition(setposition_obj, setposition_x, setposition_y)")
endfunction

function getPositionX(obj)
  return call("_SoftBasicGfx.getInstance().getPosition(getpositionx_obj).x")
endfunction

function getPositionY(obj)
  return call("_SoftBasicGfx.getInstance().getPosition(getpositiony_obj).y")
endfunction

function setAngle(obj, angle)
  call("_SoftBasicGfx.getInstance().setAngle(setangle_obj, setangle_angle);")
endfunction
```

- [ ] **Step 11: Create `assetmanager.bas`**

Create `src/lib/Basic4WebGL/defs/assetmanager.bas`:

```
function loadImage(name)
  call("try {")
  return call("_SoftAssetManager.get(loadimage_name);")
  call(" } catch (e) { _throwError(e); }")
endfunction
```

- [ ] **Step 12: Create `spritemanager.bas`**

Create `src/lib/Basic4WebGL/defs/spritemanager.bas`:

```
function create(name, texture)
  call("const sprite = _SoftSpriteManager.create(create_name, create_texture);")
  return call("sprite;")
endfunction
```

- [ ] **Step 13: Create `packageModules.ts`**

Create `src/constants/packageModules.ts`:

```typescript
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
import array from '../lib/Basic4WebGL/defs/array.bas?raw';
import gfx from '../lib/Basic4WebGL/defs/gfx.bas?raw';
import drawing from '../lib/Basic4WebGL/defs/drawing.bas?raw';
import stage from '../lib/Basic4WebGL/defs/stage.bas?raw';
import pen from '../lib/Basic4WebGL/defs/pen.bas?raw';
import text from '../lib/Basic4WebGL/defs/text.bas?raw';
import transform from '../lib/Basic4WebGL/defs/transform.bas?raw';
import assetmanager from '../lib/Basic4WebGL/defs/assetmanager.bas?raw';
import spritemanager from '../lib/Basic4WebGL/defs/spritemanager.bas?raw';

export const packageModules: Record<string, string> = {
  math,
  string,
  array,
  gfx,
  drawing,
  stage,
  pen,
  text,
  transform,
  assetmanager,
  spritemanager,
};
```

- [ ] **Step 14: Run compiler tests to verify source content is intact**

Run: `npx vitest run tests/lib`
Expected: All pass. This confirms the `.bas` file contents are equivalent to the old string constants (the compiler tests exercise the actual source through full compilation).

- [ ] **Step 15: Delete old `.ts` string files**

```bash
rm src/lib/Basic4WebGL/defs/softMath.ts
rm src/lib/Basic4WebGL/defs/softString.ts
rm src/lib/Basic4WebGL/defs/softArray.ts
rm src/lib/Basic4WebGL/defs/softGFX.ts
rm src/lib/Basic4WebGL/defs/graphics/softDrawing.ts
rm src/lib/Basic4WebGL/defs/graphics/softStage.ts
rm src/lib/Basic4WebGL/defs/graphics/softPen.ts
rm src/lib/Basic4WebGL/defs/graphics/softText.ts
rm src/lib/Basic4WebGL/defs/graphics/softTransform.ts
rm src/lib/Basic4WebGL/defs/graphics/softAssetManager.ts
rm src/lib/Basic4WebGL/defs/graphics/softSpriteManager.ts
```

- [ ] **Step 16: Commit**

```bash
git add src/vite-env.d.ts src/lib/Basic4WebGL/defs/ src/constants/packageModules.ts
git commit -m "refactor: convert library .ts string constants to .bas source files"
```

---

## Task 2: `packagesSlice` + `firstPartyPackages`

Define the `IPackage` type, create the Redux slice, and define the two first-party packages.

**Files:**
- Create: `src/features/packages/packagesSlice.ts`
- Create: `src/constants/firstPartyPackages.ts`
- Test: `tests/ui/features/packages/packagesSlice.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/features/packages/packagesSlice.test.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import packagesReducer, {
  IPackage,
  IPackagesState,
  seedPackages,
} from '../../../../src/features/packages/packagesSlice';

const pkg1: IPackage = {
  id: 'softcore',
  name: 'softCore',
  version: '1.0.0',
  isCore: true,
  isFirstParty: true,
  moduleNames: ['math', 'string', 'array'],
};

const pkg1v2: IPackage = { ...pkg1, version: '2.0.0', moduleNames: ['math', 'string', 'array', 'extra'] };

const initial: IPackagesState = { byId: {} };

test('initial state is empty', () => {
  const state = packagesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {} });
});

test('seedPackages inserts a package not yet in the store', () => {
  const state = packagesReducer(initial, seedPackages([pkg1]));
  expect(state.byId['softcore']).toEqual(pkg1);
});

test('seedPackages is a no-op when package exists with the same version', () => {
  const withPkg = packagesReducer(initial, seedPackages([pkg1]));
  const again = packagesReducer(withPkg, seedPackages([pkg1]));
  expect(again.byId['softcore']).toEqual(pkg1);
});

test('seedPackages overwrites when version has changed', () => {
  const withPkg = packagesReducer(initial, seedPackages([pkg1]));
  const updated = packagesReducer(withPkg, seedPackages([pkg1v2]));
  expect(updated.byId['softcore'].moduleNames).toContain('extra');
  expect(updated.byId['softcore'].version).toBe('2.0.0');
});

test('seedPackages inserts multiple packages in one call', () => {
  const pkg2: IPackage = {
    id: 'softgfx',
    name: 'softGfx',
    version: '1.0.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx'],
  };
  const state = packagesReducer(initial, seedPackages([pkg1, pkg2]));
  expect(Object.keys(state.byId)).toHaveLength(2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/features/packages`
Expected: FAIL — `packagesSlice` module not found.

- [ ] **Step 3: Create `packagesSlice.ts`**

Create `src/features/packages/packagesSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IPackage {
  id: string;
  name: string;
  version: string;
  isCore: boolean;
  isFirstParty: boolean;
  moduleNames: string[];
}

export interface IPackagesState {
  byId: Record<string, IPackage>;
}

const initialState: IPackagesState = {
  byId: {},
};

const packagesSlice = createSlice({
  name: 'packages',
  initialState,
  reducers: {
    seedPackages: (state, action: PayloadAction<IPackage[]>) => {
      action.payload.forEach((pkg) => {
        const existing = state.byId[pkg.id];
        if (!existing || existing.version !== pkg.version) {
          state.byId[pkg.id] = pkg;
        }
      });
    },
  },
});

export const { seedPackages } = packagesSlice.actions;
export default packagesSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/features/packages`
Expected: PASS (5 tests).

- [ ] **Step 5: Create `firstPartyPackages.ts`**

Create `src/constants/firstPartyPackages.ts`:

```typescript
import { IPackage } from '../features/packages/packagesSlice';

export const firstPartyPackages: IPackage[] = [
  {
    id: 'softcore',
    name: 'softCore',
    version: '1.0.0',
    isCore: true,
    isFirstParty: true,
    moduleNames: ['math', 'string', 'array'],
  },
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '1.0.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'drawing', 'stage', 'pen', 'text', 'transform', 'assetmanager', 'spritemanager'],
  },
];
```

- [ ] **Step 6: Commit**

```bash
git add src/features/packages/packagesSlice.ts src/constants/firstPartyPackages.ts tests/ui/features/packages/packagesSlice.test.ts
git commit -m "feat: add packagesSlice and first-party package definitions"
```

---

## Task 3: Extend `projectsSlice` with package actions

Add `packageIds` to `Project` and add `addPackageToProject` / `removePackageFromProject` reducers. Update `createProjectWithMainFile` to default new projects to both packages.

**Files:**
- Modify: `src/features/projects/projectsSlice.ts`
- Modify: `src/features/projects/createProjectWithMainFile.ts`
- Test: extend existing `tests/ui/features/projects/projectsSlice.test.ts` (create it if it doesn't exist)

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/features/projects/projectsSlice.test.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer, {
  Project,
  ProjectsState,
  addProject,
  removeProject,
  addPackageToProject,
  removePackageFromProject,
} from '../../../../src/features/projects/projectsSlice';

const initial: ProjectsState = { items: [] };

const sampleProject: Project = {
  id: 'p1',
  name: 'My Project',
  packageIds: ['softcore', 'softgfx'],
};

test('addProject stores a project', () => {
  const state = projectsReducer(initial, addProject(sampleProject));
  expect(state.items).toHaveLength(1);
  expect(state.items[0].id).toBe('p1');
});

test('removeProject deletes by id', () => {
  const withProject = projectsReducer(initial, addProject(sampleProject));
  const removed = projectsReducer(withProject, removeProject('p1'));
  expect(removed.items).toHaveLength(0);
});

describe('addPackageToProject', () => {
  it('appends a package id to the project', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: ['softcore'] }] },
      addPackageToProject({ projectId: 'p1', packageId: 'softgfx' })
    );
    expect(state.items[0].packageIds).toContain('softgfx');
  });

  it('does not duplicate a package already in the project', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: ['softcore'] }] },
      addPackageToProject({ projectId: 'p1', packageId: 'softcore' })
    );
    expect(state.items[0].packageIds.filter(id => id === 'softcore')).toHaveLength(1);
  });

  it('initialises packageIds when project was created without it (migration)', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: undefined as unknown as string[] }] },
      addPackageToProject({ projectId: 'p1', packageId: 'softgfx' })
    );
    expect(state.items[0].packageIds).toContain('softcore');
    expect(state.items[0].packageIds).toContain('softgfx');
  });

  it('is a no-op for unknown project', () => {
    const state = projectsReducer(
      { items: [] },
      addPackageToProject({ projectId: 'no-such', packageId: 'softgfx' })
    );
    expect(state.items).toHaveLength(0);
  });
});

describe('removePackageFromProject', () => {
  it('removes a package id from the project', () => {
    const state = projectsReducer(
      { items: [{ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }] },
      removePackageFromProject({ projectId: 'p1', packageId: 'softgfx' })
    );
    expect(state.items[0].packageIds).not.toContain('softgfx');
    expect(state.items[0].packageIds).toContain('softcore');
  });

  it('is a no-op for unknown project', () => {
    const state = projectsReducer(
      { items: [] },
      removePackageFromProject({ projectId: 'no-such', packageId: 'softgfx' })
    );
    expect(state.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/features/projects`
Expected: FAIL — `addPackageToProject` not exported.

- [ ] **Step 3: Update `projectsSlice.ts`**

Replace `src/features/projects/projectsSlice.ts` entirely:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: string;
  name: string;
  packageIds: string[];
}

export interface ProjectsState {
  items: Project[];
}

const initialState: ProjectsState = {
  items: [],
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    addProject: (state, action: PayloadAction<Project>) => {
      state.items.push(action.payload);
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    addPackageToProject: (
      state,
      action: PayloadAction<{ projectId: string; packageId: string }>
    ) => {
      const project = state.items.find((p) => p.id === action.payload.projectId);
      if (!project) return;
      // Migration: projects persisted before this field was added
      if (!project.packageIds) {
        project.packageIds = ['softcore', 'softgfx'];
      }
      if (!project.packageIds.includes(action.payload.packageId)) {
        project.packageIds.push(action.payload.packageId);
      }
    },
    removePackageFromProject: (
      state,
      action: PayloadAction<{ projectId: string; packageId: string }>
    ) => {
      const project = state.items.find((p) => p.id === action.payload.projectId);
      if (!project) return;
      if (!project.packageIds) {
        project.packageIds = ['softcore', 'softgfx'];
      }
      project.packageIds = project.packageIds.filter(
        (id) => id !== action.payload.packageId
      );
    },
  },
});

export const {
  addProject,
  removeProject,
  addPackageToProject,
  removePackageFromProject,
} = projectsSlice.actions;
export default projectsSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/features/projects`
Expected: PASS.

- [ ] **Step 5: Update `createProjectWithMainFile.ts`**

Replace `src/features/projects/createProjectWithMainFile.ts`:

```typescript
import { AppDispatch } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { addProject } from './projectsSlice';
import { addFile } from '../files/filesSlice';

export const createProjectWithMainFile =
  (name: string) => (dispatch: AppDispatch) => {
    const projectId = uuidv4();
    const mainFileId = uuidv4();

    dispatch(
      addProject({
        id: projectId,
        name,
        packageIds: ['softcore', 'softgfx'],
      })
    );

    dispatch(
      addFile({
        id: mainFileId,
        name: 'Main.bas',
        source: '',
        projectId: projectId,
      })
    );
  };
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/projects/projectsSlice.ts src/features/projects/createProjectWithMainFile.ts tests/ui/features/projects/projectsSlice.test.ts
git commit -m "feat: add packageIds to Project and add/remove package actions"
```

---

## Task 4: Wire store + refactor `useProjectForBuild` + `useCompiler`

Add `packagesReducer` to the store. Update `useProjectForBuild` to read packages from state (no `lib` parameter). Update `useCompiler` to remove the `projectLib` import. Delete `projectLib.ts`.

**Files:**
- Modify: `src/store.ts`
- Modify: `src/hooks/useProjectForBuild.ts`
- Modify: `src/hooks/useCompiler.ts`
- Test: `tests/ui/hooks/useProjectForBuild.test.tsx`
- Delete: `src/constants/projectLib.ts`

- [ ] **Step 1: Write the failing tests for `useProjectForBuild`**

Create `tests/ui/hooks/useProjectForBuild.test.tsx`:

```typescript
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../src/features/packages/packagesSlice';
import filesReducer, { addFile } from '../../../src/features/files/filesSlice';
import { useProjectForBuild } from '../../../src/hooks/useProjectForBuild';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';

const makeStore = () => {
  const store = configureStore({
    reducer: {
      projects: projectsReducer,
      packages: packagesReducer,
      files: filesReducer,
    },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: 'print "hi"', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('returns lib modules for softcore package', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  const moduleNames = result.current.lib.map((m) => m.name);
  expect(moduleNames).toContain('math');
  expect(moduleNames).toContain('string');
  expect(moduleNames).toContain('array');
});

test('returns lib modules for softgfx package', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  const moduleNames = result.current.lib.map((m) => m.name);
  expect(moduleNames).toContain('gfx');
  expect(moduleNames).toContain('drawing');
});

test('returns project files', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  expect(result.current.files).toHaveLength(1);
  expect(result.current.files[0].name).toBe('Main.bas');
});

test('softcore modules appear before softgfx modules in lib', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  const names = result.current.lib.map((m) => m.name);
  const mathIdx = names.indexOf('math');
  const gfxIdx = names.indexOf('gfx');
  expect(mathIdx).toBeLessThan(gfxIdx);
});

test('falls back to softcore + softgfx when project has no packageIds (migration)', () => {
  const store = configureStore({
    reducer: { projects: projectsReducer, packages: packagesReducer, files: filesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(
    addProject({ id: 'p2', name: 'Old', packageIds: undefined as unknown as string[] })
  );
  const { result } = renderHook(() => useProjectForBuild('p2'), { wrapper: wrap(store) });
  const names = result.current.lib.map((m) => m.name);
  expect(names).toContain('math');
  expect(names).toContain('gfx');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/hooks/useProjectForBuild.test.tsx`
Expected: FAIL — hook still has the old signature.

- [ ] **Step 3: Add `packagesReducer` to the store**

Modify `src/store.ts`. Add the import and include in `rootReducer`:

```typescript
// Add this import alongside the others:
import packagesReducer from './features/packages/packagesSlice';

// Update rootReducer:
const rootReducer = combineReducers({
  projects: projectsReducer,
  files: filesReducer,
  assets: assetsReducer,
  ui: uiReducer,
  session: sessionReducer,
  packages: packagesReducer,
});
```

- [ ] **Step 4: Update `useProjectForBuild.ts`**

Replace `src/hooks/useProjectForBuild.ts` entirely:

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';
import { ProjectFile } from '../lib/CompilerLib/compiler/types';
import { packageModules } from '../constants/packageModules';
import { useFilesForProject } from './useFilesForProject';

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<IFile>;
};

export const useProjectForBuild = (projectId: string): BuildProject => {
  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? ['softcore', 'softgfx'];
  });

  const packagesById = useSelector((state: RootState) => state.packages.byId);

  const files = useFilesForProject(projectId);

  const lib: ProjectFile[] = packageIds.flatMap((pkgId) => {
    const pkg = packagesById[pkgId];
    if (!pkg) return [];
    return pkg.moduleNames
      .map((name) => ({ name, source: packageModules[name] ?? '' }))
      .filter((m) => m.source !== '');
  });

  return { lib, files };
};
```

- [ ] **Step 5: Update `useCompiler.ts`**

Remove the `projectLib` import and update the `useProjectForBuild` call in `src/hooks/useCompiler.ts`:

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
} from '../features/session/sessionSlice';
import { LogItemType } from '../Types/LogItem';
import Basic4WebGL from '../lib/Basic4WebGL';
import { useProjectForBuild } from './useProjectForBuild';

export const useCompiler = (projectId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const buildProject = useProjectForBuild(projectId);
  const isRunning = useSelector((state: RootState) => state.session.isRunning);

  const run = () => {
    dispatch(clearLogs());
    dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' }));

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr }));
      });
      dispatch(setIsRunning(false));
      dispatch(setTranspiled(''));
    } else {
      dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' }));
      dispatch(setTranspiled(result.code!));
      dispatch(setIsRunning(true));
    }
  };

  const stop = () => {
    dispatch(setIsRunning(false));
    dispatch(clearLogs());
    dispatch(setTranspiled(''));
  };

  return { run, stop, isRunning };
};
```

- [ ] **Step 6: Run the hook tests to verify they pass**

Run: `npx vitest run tests/ui/hooks/useProjectForBuild.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Delete `projectLib.ts`**

```bash
rm src/constants/projectLib.ts
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: All pass. If TypeScript reports `projectLib` not found anywhere, the deletion was correct.

- [ ] **Step 9: Commit**

```bash
git add src/store.ts src/hooks/useProjectForBuild.ts src/hooks/useCompiler.ts tests/ui/hooks/useProjectForBuild.test.tsx
git commit -m "feat: wire packagesSlice into store and refactor useProjectForBuild"
```

---

## Task 5: Seed packages on app init

Dispatch `seedPackages` once on mount in `App.tsx` so first-party packages are always in the store.

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `App.tsx`**

Replace `src/App.tsx`:

```tsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { seedPackages } from './features/packages/packagesSlice';
import { firstPartyPackages } from './constants/firstPartyPackages';
import Routes from './components/Routes';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(seedPackages(firstPartyPackages));
  }, [dispatch]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      <Routes />
    </div>
  );
}
```

`App` is rendered inside the Redux `Provider` (in `main.tsx`), so `useDispatch` works here. The `useEffect` runs once on mount. `seedPackages` is idempotent so repeated mounts (e.g. in tests) are safe.

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: seed first-party packages on app init"
```

---

## Task 6: `PackagesSection` component

A collapsible section that renders above the file list. Shows active package names with a remove button (absent for `isCore` packages). The `＋` button on the header is a placeholder here — it will trigger the modal added in Task 7.

**Files:**
- Create: `src/components/FileTree/PackagesSection.tsx`
- Test: `tests/ui/components/FileTree/PackagesSection.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/FileTree/PackagesSection.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import PackagesSection from '../../../../src/components/FileTree/PackagesSection';

const makeStore = () => {
  const store = configureStore({
    reducer: { projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('renders a collapsed section by default showing package count badge', () => {
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.queryByText('softCore')).not.toBeInTheDocument();
});

test('expands to show package names when header button is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  expect(screen.getByText('softCore')).toBeInTheDocument();
  expect(screen.getByText('softGfx')).toBeInTheDocument();
});

test('shows "core" label for isCore package and no remove button', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  expect(screen.getByText('core')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /remove softcore/i })).not.toBeInTheDocument();
});

test('shows remove button for non-core package', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  expect(screen.getByRole('button', { name: /remove softgfx/i })).toBeInTheDocument();
});

test('dispatches removePackageFromProject when remove button is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  await user.click(screen.getByRole('button', { name: /remove softgfx/i }));
  const project = store.getState().projects.items.find((p) => p.id === 'p1');
  expect(project?.packageIds).not.toContain('softgfx');
});

test('calls onAddClick when the + header button is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  const onAddClick = vi.fn();
  render(<PackagesSection projectId="p1" onAddClick={onAddClick} />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /add package/i }));
  expect(onAddClick).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/FileTree/PackagesSection.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Create `PackagesSection.tsx`**

Create `src/components/FileTree/PackagesSection.tsx`:

```tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removePackageFromProject } from '../../features/projects/projectsSlice';
import { IPackage } from '../../features/packages/packagesSlice';

type PackagesSectionProps = {
  projectId: string;
  onAddClick?: () => void;
};

const PackagesSection: React.FC<PackagesSectionProps> = ({ projectId, onAddClick = () => {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dispatch = useDispatch();

  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? ['softcore', 'softgfx'];
  });

  const packages = useSelector((state: RootState) =>
    packageIds
      .map((id) => state.packages.byId[id])
      .filter((pkg): pkg is IPackage => Boolean(pkg))
  );

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <button
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim hover:text-ds-text transition"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-label="Packages"
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span>Packages</span>
          {!isExpanded && (
            <span className="ml-1 bg-ds-surface-2 text-ds-accent text-[10px] px-1.5 rounded">
              {packages.length}
            </span>
          )}
        </button>
        <button
          onClick={onAddClick}
          aria-label="Add package"
          className="text-ds-text-muted hover:text-ds-text transition text-sm"
        >
          ＋
        </button>
      </div>

      {isExpanded && (
        <ul className="space-y-0.5 mb-1">
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex items-center gap-2 px-2 py-1 text-sm text-ds-text-dim rounded"
            >
              <span className="text-green-400 text-xs">●</span>
              <span>{pkg.name}</span>
              <span className="ml-auto">
                {pkg.isCore ? (
                  <span className="text-[10px] text-ds-text-dim">core</span>
                ) : (
                  <button
                    aria-label={`Remove ${pkg.name}`}
                    onClick={() =>
                      dispatch(removePackageFromProject({ projectId, packageId: pkg.id }))
                    }
                    className="text-ds-text-dim hover:text-ds-text transition text-xs"
                  >
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PackagesSection;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/FileTree/PackagesSection.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/FileTree/PackagesSection.tsx tests/ui/components/FileTree/PackagesSection.test.tsx
git commit -m "feat: add PackagesSection collapsible component to FileTree"
```

---

## Task 7: `AddPackageModal` component

A portal modal with a search input that lists packages not yet in the project. Triggered by the `＋` button on the `PackagesSection` header.

**Files:**
- Create: `src/components/AddPackageModal/index.tsx`
- Test: `tests/ui/components/AddPackageModal/AddPackageModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/AddPackageModal/AddPackageModal.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, {
  seedPackages,
  IPackage,
} from '../../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import AddPackageModal from '../../../../src/components/AddPackageModal';

const extraPackage: IPackage = {
  id: 'softphysics',
  name: 'softPhysics',
  version: '1.0.0',
  isCore: false,
  isFirstParty: false,
  moduleNames: [],
};

// Project has only softcore — softgfx and softphysics are available to add
const makeStore = () => {
  const store = configureStore({
    reducer: { projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages([...firstPartyPackages, extraPackage]));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore'] }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('modal is not visible initially', () => {
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={false} onClose={() => {}} />, { wrapper: wrap(store) });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('modal renders when isOpen is true', () => {
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  expect(screen.getByRole('dialog', { name: /add package/i })).toBeInTheDocument();
});

test('lists packages not yet in the project', () => {
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  expect(screen.getByText('softGfx')).toBeInTheDocument();
  expect(screen.getByText('softPhysics')).toBeInTheDocument();
  expect(screen.queryByText('softCore')).not.toBeInTheDocument();
});

test('filters packages by search input', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  await user.type(screen.getByPlaceholderText(/search/i), 'Physics');
  expect(screen.getByText('softPhysics')).toBeInTheDocument();
  expect(screen.queryByText('softGfx')).not.toBeInTheDocument();
});

test('shows empty message when no packages match search', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  await user.type(screen.getByPlaceholderText(/search/i), 'zzznomatch');
  expect(screen.getByText(/no packages available/i)).toBeInTheDocument();
});

test('dispatches addPackageToProject and calls onClose when Add is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  const onClose = vi.fn();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={onClose} />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /add softgfx/i }));
  expect(store.getState().projects.items[0].packageIds).toContain('softgfx');
  expect(onClose).toHaveBeenCalledOnce();
});

test('calls onClose when Escape is pressed', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  const onClose = vi.fn();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={onClose} />, { wrapper: wrap(store) });
  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/AddPackageModal`
Expected: FAIL — component not found.

- [ ] **Step 3: Create `AddPackageModal/index.tsx`**

Create `src/components/AddPackageModal/index.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addPackageToProject } from '../../features/projects/projectsSlice';
import { IPackage } from '../../features/packages/packagesSlice';

type AddPackageModalProps = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

const AddPackageModal: React.FC<AddPackageModalProps> = ({ projectId, isOpen, onClose }) => {
  const [search, setSearch] = React.useState('');
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const projectPackageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? [];
  });

  const availablePackages = useSelector((state: RootState) =>
    Object.values(state.packages.byId).filter(
      (pkg): pkg is IPackage => !projectPackageIds.includes(pkg.id)
    )
  );

  const filtered = availablePackages.filter((pkg) =>
    pkg.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (packageId: string) => {
    dispatch(addPackageToProject({ projectId, packageId }));
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add package"
        className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-ds-text text-lg font-semibold mb-4">Add package</h2>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages..."
          className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
        />
        {filtered.length === 0 ? (
          <p className="text-ds-text-dim text-sm">No packages available to add.</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((pkg) => (
              <li key={pkg.id} className="flex items-center justify-between py-1.5">
                <span className="text-ds-text text-sm">{pkg.name}</span>
                <button
                  onClick={() => handleAdd(pkg.id)}
                  aria-label={`Add ${pkg.name}`}
                  className="text-ds-accent text-sm hover:opacity-80 transition"
                >
                  + Add
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddPackageModal;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/AddPackageModal`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/AddPackageModal/index.tsx tests/ui/components/AddPackageModal/AddPackageModal.test.tsx
git commit -m "feat: add AddPackageModal with search and package list"
```

---

## Task 8: Wire `FileTree` + update existing tests

Add `PackagesSection` above the file list in `FileTree`. Update the three existing `FileTree` test files whose `makeStore` only included `files` + `ui` reducers — they now need `projects` and `packages` too since `FileTree` renders `PackagesSection`.

**Files:**
- Modify: `src/components/FileTree/index.tsx`
- Modify: `tests/ui/components/FileTree/FileTree.test.tsx`
- Modify: `tests/ui/components/FileTree/FileTreeReorder.test.tsx`
- Modify: `tests/ui/components/FileTree/FileTreeValidation.test.tsx`

- [ ] **Step 1: Update `FileTree/index.tsx`**

Replace `src/components/FileTree/index.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile, reorderFiles } from '../../features/files/filesSlice';
import { validateFileName, normaliseFileName } from '../../utils/fileNameValidation';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';
import SortableFileItem from './SortableFileItem';
import PackagesSection from './PackagesSection';
import AddPackageModal from '../AddPackageModal';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      dispatch(selectFile({ projectId, fileId: files[0].id }));
    }
  }, [selectedFileId, files, dispatch, projectId]);

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: normaliseFileName(filename),
      source: '',
      projectId,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    if (id === selectedFileId) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      } else {
        dispatch(clearProjectSelection(projectId));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = files.findIndex((f) => f.id === active.id);
    const toIndex = files.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderFiles({ projectId, fromIndex, toIndex }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, fileId: string) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = itemRefs.current[index + 1];
        if (next) next.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = itemRefs.current[index - 1];
        if (prev) prev.focus();
        break;
      }
      case 'Enter':
        e.preventDefault();
        handleFileSelected(fileId);
        break;
    }
  };

  const fileIds = files.map((f) => f.id);

  return (
    <div>
      <PackagesSection
        projectId={projectId}
        onAddClick={() => setIsAddPackageOpen(true)}
      />
      <AddPackageModal
        projectId={projectId}
        isOpen={isAddPackageOpen}
        onClose={() => setIsAddPackageOpen(false)}
      />
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
          Files
        </span>
        <ModalWithInput
          onSubmit={handleNewFile}
          openText="+"
          saveText="Save"
          closeText="Close"
          title="New file"
          placeholder="e.g. Main"
          validate={validateFileName}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
          <ul
            role="listbox"
            aria-label="Files"
            className="space-y-0.5"
          >
            {files.map((file, index) => (
              <SortableFileItem
                key={file.id}
                file={file}
                isSelected={file.id === selectedFileId}
                showDelete={files.length > 1}
                onSelect={handleFileSelected}
                onDelete={handleDeleteFile}
                onKeyDown={(e) => handleKeyDown(e, index, file.id)}
                itemRef={(el) => { itemRefs.current[index] = el; }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FileTree;
```

- [ ] **Step 2: Update `makeStore` in all three existing FileTree tests**

`FileTree.test.tsx`, `FileTreeReorder.test.tsx`, and `FileTreeValidation.test.tsx` all define a `makeStore` function that only includes `files` and `ui` reducers. Now that `FileTree` renders `PackagesSection` and `AddPackageModal`, those need `projects` and `packages` too.

Add the two new imports to each file and update `makeStore` to include `projects` and `packages` reducers. The `addFile` calls are **different in each file** — keep the existing ones exactly as they are, just add the project/package setup above them.

**`FileTree.test.tsx`** — currently adds `f1='main.bas'` and `f2='utils.bas'`:

```typescript
// Add these imports at the top alongside existing ones:
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';

// Replace makeStore:
const makeStore = () => {
  const store = configureStore({
    reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'utils.bas', source: '', projectId: 'p1' }));
  return store;
};
```

**`FileTreeReorder.test.tsx`** — currently adds `f1='Main.bas'` and `f2='Car.bas'`:

```typescript
// Same imports, same makeStore shape, different addFile calls:
const makeStore = () => {
  const store = configureStore({
    reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'Car.bas', source: '', projectId: 'p1' }));
  return store;
};
```

**`FileTreeValidation.test.tsx`** — currently adds only `f1='main.bas'`:

```typescript
// Same imports, only one addFile call:
const makeStore = () => {
  const store = configureStore({
    reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  return store;
};
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/FileTree/index.tsx tests/ui/components/FileTree/
git commit -m "feat: wire PackagesSection and AddPackageModal into FileTree"
```

---

## Final check

- [ ] **Run full test suite one last time**

Run: `npx vitest run`
Expected: All pass, no skipped tests.

- [ ] **Verify `projectLib.ts` is gone and nothing references it**

Run: `grep -r "projectLib" src/`
Expected: no output.
