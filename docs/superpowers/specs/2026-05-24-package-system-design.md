# Package System Design Spec

**Goal:** Replace the hardcoded `projectLib` constant with a proper package registry. Split the current built-in library into `softCore` and `softGfx` packages. Give projects first-class package management with a collapsible UI in the file tree.

**Architecture:** Single Redux registry (`packagesSlice`) seeded on app init. Projects reference packages by ID. First-party library sources move from TypeScript string constants to real `.bas` files loaded via Vite `?raw` imports. Compiler integration is unchanged — `useProjectForBuild` builds the same `ProjectFile[]` it always has, now from the registry instead of a hardcoded array.

**Tech Stack:** TypeScript, React, Redux Toolkit, Vite (`?raw` imports), Vitest + Testing Library.

---

## Background

All library modules are currently defined as softBASIC source strings inside TypeScript files (`src/lib/Basic4WebGL/defs/*.ts`) and registered as a hardcoded `projectLib` array in `src/constants/projectLib.ts`. Every project gets every module, always. There is no concept of packages, no per-project control, and no path to user-contributed libraries.

The vision is a package ecosystem where first-party packages (`softCore`, `softGfx`) and eventually user-built packages are treated identically — collections of ordered softBASIC source files stored in a shared registry, included per-project. This spec delivers the foundation.

---

## Data Model

### `IPackage`

```typescript
interface IPackage {
  id: string;
  name: string;           // e.g. 'softCore'
  version: string;        // semver string e.g. '1.0.0'
  isCore: boolean;        // cannot be removed from any project
  isFirstParty: boolean;  // seeded by the app, not created by the user
  moduleNames: string[];  // ordered list of module names e.g. ['math', 'string', 'array']
}
```

`version` is used by the seeding mechanism to detect when a first-party package has been updated and needs to be re-seeded. It is not exposed in the UI in this iteration.

### `IPackagesState`

```typescript
interface IPackagesState {
  byId: Record<string, IPackage>;
}
```

### `IProject` extension

Add `packageIds: string[]` to the existing project type — an ordered list of package IDs included in the project. Package modules compile in `packageIds` order, each package's `moduleNames` in order, before user files.

### Module source map

`src/constants/packageModules.ts` replaces `src/constants/projectLib.ts`. A plain `Record<string, string>` mapping module name to softBASIC source string, populated via Vite `?raw` imports:

```typescript
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
// ...

export const packageModules: Record<string, string> = {
  math,
  string,
  // ...
};
```

`projectLib.ts` is deleted once this is in place.

---

## First-Party Package Definitions

`src/constants/firstPartyPackages.ts` — plain `IPackage[]` array defining the two seeded packages:

**softCore** (`id: 'softcore'`, `isCore: true`)
```
moduleNames: ['math', 'string', 'array']
```

**softGfx** (`id: 'softgfx'`, `isCore: false`)
```
moduleNames: ['gfx', 'drawing', 'stage', 'pen', 'text', 'transform', 'assetmanager', 'spritemanager']
```

---

## Library Source Files

All TypeScript string constants in `src/lib/Basic4WebGL/defs/` are replaced with real `.bas` files:

```
src/lib/Basic4WebGL/defs/
  math.bas
  string.bas
  array.bas
  gfx.bas
  drawing.bas
  stage.bas
  pen.bas
  text.bas
  transform.bas
  assetmanager.bas
  spritemanager.bas
```

The content of each file is identical to the current string constant. The `defs/graphics/` subdirectory is flattened — all modules sit at the same level, matching the flat `moduleNames` key space.

---

## Redux — `packagesSlice`

### Actions

**`seedPackages(packages: IPackage[])`** — idempotent seed called on app init.

For each package in the array:
- If absent from `byId`: insert it.
- If present and `version` has changed: overwrite with the new definition.
- If present and `version` is unchanged: no-op.

This ensures first-party package updates ship with new app versions without requiring users to clear their state.

**`addPackageToProject({ projectId, packageId })`** — on the projects slice; appends `packageId` to `project.packageIds` if not already present.

**`removePackageFromProject({ projectId, packageId })`** — on the projects slice; filters `packageId` from `project.packageIds`. Guard: no-op if the package `isCore`.

### Migration

Existing persisted projects will not have `packageIds`. On hydration, any project where `packageIds` is absent or undefined defaults to `['softcore', 'softgfx']`. This preserves the current behaviour exactly for all existing users.

---

## Compiler Integration

`useProjectForBuild(projectId)` — the `projectLib` parameter is removed. The hook now:

1. Reads `project.packageIds` from the projects slice.
2. For each package ID, looks up the `IPackage` in `packagesSlice.byId`.
3. For each `moduleName` in `package.moduleNames` (in order), looks up the source string in `packageModules`.
4. Builds and returns the `ProjectFile[]` array the compiler already expects.

The compiler itself (`src/lib/Basic4WebGL/index.ts`) is unchanged — it still receives a `ProjectFile[]` and knows nothing about packages.

---

## UI

### File tree — packages section

A collapsible `PACKAGES` section sits above the file list in the `FileTree` panel.

**Collapsed state (default):**
```
▶  PACKAGES   [2]   ＋
─────────────────────────
▼  FILES              + New
   Main.bas
   Car.bas
```

The badge shows the count of active packages. The `＋` button on the header opens the add-package modal.

**Expanded state:**
```
▼  PACKAGES           ＋
   ● softCore        core
   ● softGfx          ✕
─────────────────────────
▼  FILES              + New
   Main.bas
   Car.bas
```

- `●` green dot indicates the package is active.
- `core` label replaces the remove button for `isCore` packages.
- `✕` removes non-core packages (dispatches `removePackageFromProject`).
- Section collapse state is local UI state (not persisted).

### Add-package modal

Opens when the `＋` header button is clicked. A small centred modal:

- Title: "Add package"
- Search input (filters by package name)
- List of packages not yet in the project, each with a `+ Add` button
- Clicking `+ Add` dispatches `addPackageToProject` and closes the modal
- If all available packages are already added, shows "No packages available to add"
- Dismissed by clicking outside or pressing Escape

### Component breakdown

| Component | File | Notes |
|---|---|---|
| `PackagesSection` | `src/components/FileTree/PackagesSection.tsx` | Collapsible section, package rows |
| `AddPackageModal` | `src/components/AddPackageModal/index.tsx` | Search + list modal |
| Updated `FileTree` | `src/components/FileTree/index.tsx` | Renders `PackagesSection` above file list |

---

## Test Coverage

### Unit — `packagesSlice`
- `seedPackages` inserts a package that isn't in the store
- `seedPackages` is a no-op when package exists with the same version
- `seedPackages` overwrites when version has changed
- `removePackageFromProject` is a no-op for `isCore` packages
- `addPackageToProject` does not duplicate an already-added package

### Unit — `useProjectForBuild`
- Returns correct `ProjectFile[]` for a project with `softCore` only
- Returns correct `ProjectFile[]` for a project with both packages
- Migration: project without `packageIds` defaults to both packages

### UI — `PackagesSection`
- Renders package names for active packages
- `core` label shown for `isCore` package; remove button absent
- Remove button dispatches `removePackageFromProject`
- `＋` header button opens the add-package modal

---

## Out of Scope

- **User-created packages** — future subproject. When scoped, revisit: (A) a package is a project flagged as a package type, vs (B) packages are a separate top-level entity with their own management UI. Both approaches have merit and the trade-offs should be documented at that time.
- **Package versioning UX** — the `version` field supports re-seeding first-party updates but the full versioning story (version pinning per project, upgrade prompts, compatibility checking, publishing) is a natural companion to user-created packages and should be scoped in that subproject.
- **Package file visibility** — packages are opaque in the UI; source files are not browsable in the editor.
- **Runtime JS bundling** — packages are pure softBASIC; no runtime JS injection per package.
- **Package dependencies** — packages cannot declare dependencies on other packages.
