# Demo Authoring Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the project a repeatable, verified workflow for shipping softBASIC demo games — a guide doc, a script that packages hand-written `.bas` files + assets into the app's project-export format, and a Cypress e2e spec proving the existing Raycaster demo (and every future one) actually runs.

**Architecture:** A pure, unit-tested packaging function (`scripts/demoBuilder/packageDemo.ts`) does the actual `.bas`+assets → `ProjectExportJson` conversion; a thin CLI script (`scripts/buildDemo.ts`) reads a folder from disk and calls it — same split already used for `scripts/generateLibrary.ts` / `registry.ts`. A new `cypress/e2e/demos.cy.ts` reuses the exact seed-into-`localStorage`-then-click-Run pattern from `tutorials.cy.ts`, but sources its project data from the demo's real `.b4wgl.json` (via `cy.readFile`) instead of hardcoded snippets, since demos already have real exported JSON to seed from. The guide document ties it all together with a mandatory checklist.

**Tech Stack:** TypeScript, `vite-node` (script runtime, matching `generateLibrary.ts`), Vitest, Cypress, `uuid` (already a dependency).

**Spec:** `docs/superpowers/specs/2026-08-03-demo-authoring-guide-design.md`

---

### Task 1: `packageDemo` core packaging function (TDD)

**Files:**
- Create: `scripts/demoBuilder/packageDemo.ts`
- Test: `tests/scripts/demoBuilder/packageDemo.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/demoBuilder/packageDemo.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { packageDemo } from '../../../scripts/demoBuilder/packageDemo';

describe('packageDemo', () => {
  test('sorts .bas files alphabetically regardless of input order', () => {
    const result = packageDemo(
      'Test Demo',
      [
        { name: 'Zebra.bas', source: 'dummy' },
        { name: 'Main.bas', source: 'dummy' },
      ],
      []
    );
    expect(result.files.map((f) => f.name)).toEqual(['Main.bas', 'Zebra.bas']);
  });

  test('sorts assets alphabetically regardless of input order', () => {
    const result = packageDemo(
      'Test Demo',
      [{ name: 'Main.bas', source: 'x' }],
      [
        { name: 'zzz.png', bytes: Buffer.from([1, 2, 3]) },
        { name: 'aaa.png', bytes: Buffer.from([4, 5, 6]) },
      ]
    );
    expect(result.assets.map((a) => a.name)).toEqual(['aaa.png', 'zzz.png']);
  });

  test('assigns each file and asset a unique id', () => {
    const result = packageDemo(
      'Test Demo',
      [
        { name: 'Main.bas', source: 'x' },
        { name: 'Player.bas', source: 'y' },
      ],
      [
        { name: 'a.png', bytes: Buffer.from([1]) },
        { name: 'b.png', bytes: Buffer.from([2]) },
      ]
    );
    const ids = [...result.files.map((f) => f.id), ...result.assets.map((a) => a.id)];
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f-]{36}$/));
  });

  test('encodes a .png asset as a base64 image/png data URI', () => {
    const bytes = Buffer.from([137, 80, 78, 71]);
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
      { name: 'wall.png', bytes },
    ]);
    expect(result.assets[0].content).toBe(`data:image/png;base64,${bytes.toString('base64')}`);
  });

  test('encodes a .wav asset as a base64 audio/wav data URI', () => {
    const bytes = Buffer.from([82, 73, 70, 70]);
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
      { name: 'jump.wav', bytes },
    ]);
    expect(result.assets[0].content).toBe(`data:audio/wav;base64,${bytes.toString('base64')}`);
  });

  test('throws on an unsupported asset extension', () => {
    expect(() =>
      packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], [
        { name: 'notes.txt', bytes: Buffer.from([1]) },
      ])
    ).toThrow(/Unsupported asset extension/);
  });

  test('fileOrder and assetOrder list ids in the same sorted order as files/assets', () => {
    const result = packageDemo(
      'Test Demo',
      [
        { name: 'Zebra.bas', source: 'x' },
        { name: 'Main.bas', source: 'y' },
      ],
      [
        { name: 'zzz.png', bytes: Buffer.from([1]) },
        { name: 'aaa.png', bytes: Buffer.from([2]) },
      ]
    );
    expect(result.fileOrder[':root']).toEqual(result.files.map((f) => f.id));
    expect(result.assetOrder[':root']).toEqual(result.assets.map((a) => a.id));
  });

  test('supports zero assets', () => {
    const result = packageDemo('Test Demo', [{ name: 'Main.bas', source: 'x' }], []);
    expect(result.assets).toEqual([]);
    expect(result.assetOrder[':root']).toEqual([]);
  });

  test('sets version, project name, and empty folders', () => {
    const result = packageDemo('My Demo', [{ name: 'Main.bas', source: 'x' }], []);
    expect(result.version).toBe(1);
    expect(result.project).toEqual({ name: 'My Demo' });
    expect(result.folders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/scripts/demoBuilder/packageDemo.test.ts`
Expected: FAIL — `Cannot find module '../../../scripts/demoBuilder/packageDemo'`

- [ ] **Step 3: Implement `packageDemo`**

Create `scripts/demoBuilder/packageDemo.ts`:

```ts
import { v4 as uuidv4 } from 'uuid';

export interface ProjectExportJson {
  version: 1;
  project: { name: string };
  folders: Array<{ id: string; name: string; parentId: string | null; section: 'files' | 'assets' }>;
  files: Array<{ id: string; name: string; source: string; folderId: string | null; fullName: string }>;
  assets: Array<{ id: string; name: string; content: string; folderId: string | null; fullName: string }>;
  fileOrder: Record<string, string[]>;
  assetOrder: Record<string, string[]>;
}

export interface RawBasFile {
  name: string;
  source: string;
}

export interface RawAsset {
  name: string;
  bytes: Buffer;
}

// Matches src/components/AssetPreview/getAssetType.ts's supported extensions.
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function mimeTypeFor(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot === -1 ? '' : fileName.slice(dot).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) {
    throw new Error(
      `Unsupported asset extension "${ext}" for file "${fileName}" — supported: ${Object.keys(MIME_TYPES).join(', ')}`
    );
  }
  return mime;
}

export function packageDemo(
  projectName: string,
  basFiles: RawBasFile[],
  assets: RawAsset[]
): ProjectExportJson {
  const sortedFiles = [...basFiles].sort((a, b) => a.name.localeCompare(b.name));
  const files = sortedFiles.map((f) => ({
    id: uuidv4(),
    name: f.name,
    source: f.source,
    folderId: null,
    fullName: f.name,
  }));

  const sortedAssets = [...assets].sort((a, b) => a.name.localeCompare(b.name));
  const assetEntries = sortedAssets.map((a) => ({
    id: uuidv4(),
    name: a.name,
    content: `data:${mimeTypeFor(a.name)};base64,${a.bytes.toString('base64')}`,
    folderId: null,
    fullName: a.name,
  }));

  return {
    version: 1,
    project: { name: projectName },
    folders: [],
    files,
    assets: assetEntries,
    fileOrder: { ':root': files.map((f) => f.id) },
    assetOrder: { ':root': assetEntries.map((a) => a.id) },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/scripts/demoBuilder/packageDemo.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  9 passed (9)`

- [ ] **Step 5: Commit**

```bash
git add scripts/demoBuilder/packageDemo.ts tests/scripts/demoBuilder/packageDemo.test.ts
git commit -m "feat: add packageDemo — packages .bas files + assets into a ProjectExportJson"
```

---

### Task 2: `buildDemo.ts` CLI + npm script

**Files:**
- Create: `scripts/buildDemo.ts`
- Modify: `package.json`

- [ ] **Step 1: Create the CLI script**

Create `scripts/buildDemo.ts`:

```ts
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { packageDemo, RawAsset, RawBasFile } from './demoBuilder/packageDemo';

const [, , sourceDir, slug] = process.argv;

if (!sourceDir || !slug) {
  console.error('Usage: npm run build:demo -- <source-dir> <SlugName>');
  process.exit(1);
}

const basFiles: RawBasFile[] = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(join(sourceDir, entry.name), 'utf-8'),
  }));

if (basFiles.length === 0) {
  console.error(`No .bas files found directly in ${sourceDir}`);
  process.exit(1);
}

const assetsDir = join(sourceDir, 'assets');
const assets: RawAsset[] = existsSync(assetsDir)
  ? readdirSync(assetsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        name: entry.name,
        bytes: readFileSync(join(assetsDir, entry.name)),
      }))
  : [];

const json = packageDemo(slug, basFiles, assets);

const OUT_DIR = 'src/docs/demos';
const outPath = join(OUT_DIR, `${slug}.b4wgl.json`);
writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf-8');
console.log(`Wrote ${outPath} (${basFiles.length} file(s), ${assets.length} asset(s))`);
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"` (alphabetical position doesn't matter — match the existing list's grouping, next to `generate:library`):

```json
    "generate:library": "vite-node scripts/generateLibrary.ts",
    "build:demo": "vite-node scripts/buildDemo.ts",
```

- [ ] **Step 3: Smoke-test it manually against a throwaway folder**

```bash
mkdir -p /tmp/demo-smoke-test/assets
printf 'function onenter()\n  print "hi"\nendfunction\n' > /tmp/demo-smoke-test/Main.bas
printf '\x89PNG\r\n\x1a\n' > /tmp/demo-smoke-test/assets/dot.png
npx vite-node scripts/buildDemo.ts /tmp/demo-smoke-test SmokeTest
cat src/docs/demos/SmokeTest.b4wgl.json
```

Expected: prints `Wrote src/docs/demos/SmokeTest.b4wgl.json (1 file(s), 1 asset(s))`, and the file contains one file entry named `Main.bas` and one asset entry named `dot.png` with a `data:image/png;base64,...` content string.

- [ ] **Step 4: Remove the smoke-test output (it's not a real demo)**

```bash
rm src/docs/demos/SmokeTest.b4wgl.json
rm -rf /tmp/demo-smoke-test
git status
```

Expected: `git status` shows no changes from the smoke test (the throwaway output file is gone; only Steps 1–2's real changes remain staged/unstaged).

- [ ] **Step 5: Commit**

```bash
git add scripts/buildDemo.ts package.json
git commit -m "feat: add buildDemo CLI — assembles a demo-src folder into a .b4wgl.json"
```

---

### Task 3: Retrofit Raycaster with a Cypress e2e spec

**Files:**
- Create: `cypress/e2e/demos.cy.ts`

- [ ] **Step 1: Write the spec**

Create `cypress/e2e/demos.cy.ts`:

```ts
/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Seeds a demo's real .b4wgl.json export (read straight from src/docs/demos/,
// including its real assets) into localStorage, the same way tutorials.cy.ts
// seeds hardcoded snippets — but sourced from the actual shipped export
// instead of duplicating the source in this file.
// ---------------------------------------------------------------------------

interface ExportedFile {
  id: string;
  name: string;
  source: string;
  folderId: string | null;
  fullName: string;
}

interface ExportedAsset {
  id: string;
  name: string;
  content: string;
  folderId: string | null;
  fullName: string;
}

interface ProjectExportJson {
  version: 1;
  project: { name: string };
  files: ExportedFile[];
  assets: ExportedAsset[];
  fileOrder: Record<string, string[]>;
  assetOrder: Record<string, string[]>;
}

function buildPersistedStateFromExport(projectId: string, json: ProjectExportJson): string {
  const filesById: Record<string, object> = {};
  json.files.forEach((f) => {
    filesById[f.id] = { ...f, projectId };
  });
  const fileOrder = json.fileOrder[':root'] ?? json.files.map((f) => f.id);

  const assetsById: Record<string, object> = {};
  json.assets.forEach((a) => {
    assetsById[a.id] = { ...a, projectId };
  });
  const assetOrder = json.assetOrder[':root'] ?? json.assets.map((a) => a.id);

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: json.project.name, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({
      byId: filesById,
      dirtyFileIds: [],
      fileOrder: { [`${projectId}:root`]: fileOrder },
    }),
    assets: JSON.stringify({
      byId: assetsById,
      assetOrder: { [`${projectId}:root`]: assetOrder },
    }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function runDemo(projectId: string, jsonPath: string, waitMs: number) {
  cy.readFile(jsonPath).then((json: ProjectExportJson) => {
    const persistedState = buildPersistedStateFromExport(projectId, json);
    cy.visit(`/projects/${projectId}/edit`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('persist:softBASIC', persistedState);
      },
    });
  });

  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
  cy.get('span').contains('ERR').should('not.exist');
}

describe('Demo: Wolfenstein-Style Raycaster', () => {
  it('runs without runtime errors', () => {
    runDemo('demo-raycaster', 'src/docs/demos/Raycaster.b4wgl.json', 4000);
  });
});
```

- [ ] **Step 2: Run it against the real dev server**

```bash
npm run dev &
sleep 3
npx cypress run --spec cypress/e2e/demos.cy.ts
```

Expected: `1 passing` — the Raycaster demo runs with zero `ERR` console entries. Stop the dev server afterward (`kill %1` or close the terminal running it).

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/demos.cy.ts
git commit -m "test: add Cypress e2e spec for the Raycaster demo (was previously untested)"
```

---

### Task 4: Write the guide — `docs/demo-authoring-guide.md`

**Files:**
- Create: `docs/demo-authoring-guide.md`

- [ ] **Step 1: Write the guide**

Create `docs/demo-authoring-guide.md`:

```markdown
# Demo Authoring Guide

Internal guide for creating a new softBASIC demo game (`src/docs/demos/`) — a hand-picked, ready-to-run project that shows off what softBASIC can build. This is for whoever is *building* the demo (human or agent), not the player — it's not part of the in-app `/docs` site.

## What a demo actually is

Four pieces, all required:

1. `src/docs/demos/<Slug>.b4wgl.json` — the project export (files, assets, folders — see `ProjectExportJson` in `src/features/projects/exportProject.ts`).
2. `src/docs/demos/<slug>.md` — the "how it works" write-up: required-assets table, controls, explanation, full source. See `raycaster.md` for the template.
3. `src/features/demos/demoRegistry.ts` — one `DemoEntry`: `slug`, `name`, `tags`, `description`, `docsSlug`, `json`.
4. `src/docs/manifest.ts` — a nav entry in the `Demos` group: `{ slug, title, file: 'demos/<slug>.md' }`.

## Step 1: Pre-production brief

Before writing any code, work through these questions with whoever requested the demo — live in chat, no written artifact needed (a demo is lighter-weight than a full feature spec):

1. **Concept** — one or two sentences on the mechanic/feature being showcased.
2. **Assets required** — for each visual asset: name/purpose, and either
   - *static*: pixel dimensions, or
   - *animated*: frame dimensions, frame count, suggested fps, animation names (idle/walk/etc.)
   - plus any art-style/colour notes worth flagging.
3. **Audio required** (if any) — sound effect vs. loop, rough description.
4. **Controls** — keys/mouse actions.
5. **New engine features** — does this need any function that doesn't exist yet? If yes, that's a full "Adding a new language feature or library module" job (see `CLAUDE.md`) *before* this demo can be finished — flag it now, not mid-build.

## Step 2: Syntax correctness

Follow the API cross-reference rule (`CLAUDE.md`'s "Docs section"): check every softBASIC snippet against the actual `.bas` def file in `src/lib/Basic4WebGL/defs/` or the API reference markdown in `src/docs/api-reference/` before writing it. Never from memory.

## Step 3: Build it

Two paths — pick based on complexity.

**Path A — build live in the app.** Default choice: use this for anything with more than one file, class-based game objects, or real interactivity.

1. Create a new project in the running app; add the assets from the brief.
2. Write `.bas` files in Monaco. Run frequently — use inline error underlining, autocomplete, and hover as you go, rather than writing blind and debugging after the fact.
3. Once it runs cleanly with zero console `ERR` entries, use the app's own **Export** feature to produce the `.b4wgl.json`. This guarantees the shipped file is exactly what was tested — no hand-crafted JSON that might not match what actually ran.

**Path B — hand-write `.bas` + assets, then run the assembler script.** Use this for small, single-file demos simple enough to hold entirely in your head.

1. Create `demo-src/<slug>/` with your `.bas` file(s) at its root and an `assets/` subfolder for any images or audio.
2. Run `npm run build:demo -- demo-src/<slug> <SlugName>` — produces `src/docs/demos/<SlugName>.b4wgl.json`.
3. **Still required, exactly like Path A's last step:** load the result into the running app (Demos page → Try Demo, or import the JSON directly) and click Run to verify zero console `ERR` entries. The script only assembles the file — it doesn't prove the code is correct.

## Step 4: Production checklist (mandatory, no exceptions)

- [ ] `.b4wgl.json` verified to run with zero `ERR` console entries.
- [ ] `src/docs/demos/<slug>.md` write-up — required-assets table, controls, how-it-works explanation, full source. See `raycaster.md` for the template.
- [ ] `demoRegistry.ts` entry.
- [ ] `docs/manifest.ts` nav entry under `Demos`.
- [ ] `cypress/e2e/demos.cy.ts` — add a `describe` block for the new demo (copy the Raycaster block: read the real `.b4wgl.json` via `cy.readFile`, seed it into `localStorage`, click Run, assert no `ERR`). **Mandatory — a demo isn't done without this.**
- [ ] If the demo needed new engine functions: they went through the full six-step "Adding a new language feature or library module" process from `CLAUDE.md`, including the descriptor+generator pipeline if the module is descriptor-driven (see `CLAUDE.md`'s "Descriptor-generated `.bas` files" section) — never a hand-edited `.bas` file.

## The assembler script: `scripts/buildDemo.ts`

Packages a `demo-src/<slug>/` folder into a `.b4wgl.json`. Input layout:

\```
demo-src/<slug>/
  Main.bas
  Player.bas        # optional — any number of .bas files, flat, no subfolders
  assets/
    wall.png
    jump.wav
\```

- Every `.bas` file directly in the source folder becomes one project file, sorted alphabetically.
- Every file in `assets/` becomes one project asset, sorted alphabetically, base64-encoded with its MIME type inferred from its extension — images (`.png .jpg .jpeg .gif .webp .svg .bmp`) and audio (`.mp3 .wav .ogg`), the same set `src/components/AssetPreview/getAssetType.ts` recognises. An unrecognised extension is a hard error, not a silent guess.
- No folder nesting in v1 — every demo so far is flat. Extend `packageDemo` in `scripts/demoBuilder/packageDemo.ts` if a future demo genuinely needs subfolders.

Run: `npm run build:demo -- demo-src/<slug> <SlugName>`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/demo-authoring-guide.md
git commit -m "docs: add demo authoring guide"
```

---

### Task 5: Wire the guide into CLAUDE.md, final verification

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Extend the E2E tests section**

In `CLAUDE.md`, find this line (in the "E2E tests (Cypress)" section):

```markdown
`cypress/e2e/tutorials.cy.ts` is the **only** layer that verifies real runtime behaviour in an actual browser (WebGL/PIXI execution) — the Vitest suite (see step 4 below) deliberately checks transpiler *output*, not what the compiled game does when it runs. Scope and limits, so you don't over- or under-trust it:
```

Replace it with:

```markdown
`cypress/e2e/tutorials.cy.ts` and `cypress/e2e/demos.cy.ts` are the **only** layers that verify real runtime behaviour in an actual browser (WebGL/PIXI execution) — the Vitest suite (see step 4 below) deliberately checks transpiler *output*, not what the compiled game does when it runs. Scope and limits, so you don't over- or under-trust it:
```

Then find this bullet:

```markdown
- If you change tutorial source code, the engine runtime, or anything a published tutorial exercises, run this suite manually (it won't run for you) and update the matching `describe` block in `tutorials.cy.ts` if the tutorial's code sample changed.
```

Add a new bullet directly after it:

```markdown
- `demos.cy.ts` covers shipped demos the same way, but seeds each demo's real `.b4wgl.json` export (read via `cy.readFile`, including its real assets) rather than a hardcoded snippet, since demos already have a real export to test against. Adding a new demo requires adding its own `describe` block here — see `docs/demo-authoring-guide.md`.
```

- [ ] **Step 2: Add a "Creating demos" section**

In `CLAUDE.md`, find this text (end of the "Adding a new language feature or library module" section, right before "## Docs section"):

```markdown
Not every `.bas` file is descriptor-generated — `math`, `string`, `array`, `dict`, `input`, `audio`, `collision`, `scene`, `scenemanager`, `camera`, `world`, `hud`, `animatedsprite`, `tilemap` etc. are hand-written and edited directly as normal. Check `registry.ts` if unsure whether a given module is generated.

---

## Docs section
```

Replace it with:

```markdown
Not every `.bas` file is descriptor-generated — `math`, `string`, `array`, `dict`, `input`, `audio`, `collision`, `scene`, `scenemanager`, `camera`, `world`, `hud`, `animatedsprite`, `tilemap` etc. are hand-written and edited directly as normal. Check `registry.ts` if unsure whether a given module is generated.

---

## Creating demos

See `docs/demo-authoring-guide.md` for the full workflow: the pre-production questions to ask before writing any code (concept, required assets with dimensions/animation details, controls, whether new engine features are needed), the two ways to build a demo (live in the app vs. hand-write + `scripts/buildDemo.ts`), and the mandatory production checklist — including a `cypress/e2e/demos.cy.ts` spec, which is not optional.

---

## Docs section
```

- [ ] **Step 3: Run the full verification suite**

```bash
npx vitest run
npx vite build
```

Expected: all Vitest suites pass (should be 1000+ tests, same count as before this plan plus the 9 new `packageDemo` tests), and the build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: link demo authoring guide from CLAUDE.md"
```

---

## Self-review notes

- **Spec coverage:** guide content (Task 4/5), pre-production brief (Task 4, Step 1), two authoring paths (Task 4), assembler script (Tasks 1–2), Raycaster retrofit (Task 3), CLAUDE.md link (Task 5) — all five spec sections have a task. Nothing in the spec is unaddressed.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code or an exact command with expected output.
- **Type consistency:** `RawBasFile`/`RawAsset`/`ProjectExportJson` names and shapes are identical between Task 1's `packageDemo.ts`, Task 1's test file, and Task 2's `buildDemo.ts` import. `demos.cy.ts`'s local `ProjectExportJson`/`ExportedFile`/`ExportedAsset` interfaces are intentionally separate (self-contained per-file convention, matching `tutorials.cy.ts`'s own local `FileSpec`), not imported from `packageDemo.ts` or the app's real type — Cypress specs compile under their own `cypress/tsconfig.json`, and duplicating a 5-field shape here is simpler than crossing that boundary.
