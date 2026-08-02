# File & Save I/O Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two new softBASIC library modules — `file` (raw string-based storage, `localStorage`-backed) and `save` (auto-serializing convenience layer on top) — closing out `docs/roadmap.md` Milestone 3's last deliverable.

**Architecture:** Two engine JS modules (`file.js`, `save.js` — the latter depends on the former at the JS level), each with a matching `.bas` API authored as a `ModuleDescriptor` and generated via the existing `scripts/generateLibrary.ts` pipeline, wired into `softBasicEngine.js`/`Runner/index.tsx`, registered in the `softcore` first-party package, documented, and proven end-to-end with a new Cypress spec (this codebase has no direct unit tests for engine `.js` modules — runtime behavior is verified through Cypress instead).

**Tech Stack:** TypeScript (descriptors/generator), plain JS (engine modules, run inside the sandboxed game iframe), softBASIC (generated `.bas` defs), Vitest (transpiler-output tests), Cypress (runtime/persistence tests).

**Spec:** `docs/superpowers/specs/2026-08-02-file-save-io-design.md`

---

### Task 1: `file` engine module

**Files:**
- Create: `src/components/Runner/engine/file.js`

- [ ] **Step 1: Write the engine module**

```js
const _sbFile = (() => {
  const STORAGE_PREFIX = 'sb_files:';

  function readAll(projectId) {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + projectId);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  function writeAll(projectId, files) {
    // Lets QuotaExceededError (or any other localStorage.setItem failure)
    // propagate — the caller's call("...") site is inside the game's own
    // try/catch-wrapped update loop, so it surfaces as a normal runtime error.
    window.localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(files));
  }

  return {
    fileWrite(path, content) {
      const files = readAll(_sbProjectId);
      files[path] = content;
      writeAll(_sbProjectId, files);
    },
    fileRead(path) {
      const files = readAll(_sbProjectId);
      return files[path] ?? '';
    },
    fileExists(path) {
      const files = readAll(_sbProjectId);
      return Object.prototype.hasOwnProperty.call(files, path);
    },
    fileDelete(path) {
      const files = readAll(_sbProjectId);
      delete files[path];
      writeAll(_sbProjectId, files);
    },
  };
})();
```

One `localStorage` key per project (`sb_files:<projectId>`), holding a flat `{ path: content }` map. `_sbProjectId` is an existing global set by `Runner/index.tsx` (`.replace('//${projectId}', ...)` in `bootstrapper.html`) — same one `assets.js` already relies on.

- [ ] **Step 2: Commit**

```bash
git add src/components/Runner/engine/file.js
git commit -m "feat: add file engine module (localStorage-backed path->content store)"
```

---

### Task 2: `save` engine module

**Files:**
- Create: `src/components/Runner/engine/save.js`

- [ ] **Step 1: Write the engine module**

```js
const _sbSave = (() => {
  const SAVE_PATH = 'save.json';

  // Dictionaries are Map-backed at runtime (see _createDict in bootstrapper.html)
  // — bare JSON.stringify/parse would silently turn one into "{}". This walks
  // arrays/Maps recursively so a dict-in-array-in-dict round-trips correctly.
  function encode(value) {
    if (value instanceof Map) {
      return { __sbType: 'dict', entries: Array.from(value.entries()).map(([k, v]) => [k, encode(v)]) };
    }
    if (Array.isArray(value)) return value.map(encode);
    return value;
  }

  function decode(value) {
    if (value && typeof value === 'object' && value.__sbType === 'dict') {
      return new Map(value.entries.map(([k, v]) => [k, decode(v)]));
    }
    if (Array.isArray(value)) return value.map(decode);
    return value;
  }

  function readBlob() {
    const raw = _sbFile.fileRead(SAVE_PATH);
    if (!raw) return new Map();
    try {
      return decode(JSON.parse(raw));
    } catch (_) {
      return new Map();
    }
  }

  function writeBlob(blob) {
    _sbFile.fileWrite(SAVE_PATH, JSON.stringify(encode(blob)));
  }

  return {
    saveSet(key, value) {
      const blob = readBlob();
      blob.set(key, value);
      writeBlob(blob);
    },
    saveGet(key) {
      return readBlob().get(key) ?? '';
    },
    saveExists(key) {
      return readBlob().has(key);
    },
    saveDelete(key) {
      const blob = readBlob();
      blob.delete(key);
      writeBlob(blob);
    },
    saveSetAll(dict) {
      writeBlob(dict instanceof Map ? dict : new Map());
    },
    saveGetAll() {
      return readBlob();
    },
  };
})();
```

The whole saved blob is itself a `Map` (same runtime shape as a softBASIC `dim d[]` dictionary), so `saveGetAll()` returns exactly what a dictionary already is on the softBASIC side — no special-casing needed at the `.bas`/transpiled layer. Depends on `_sbFile` existing as a global — enforced by load order in Task 5, not by anything in this file.

- [ ] **Step 2: Commit**

```bash
git add src/components/Runner/engine/save.js
git commit -m "feat: add save engine module (Map-aware JSON encode/decode over file)"
```

---

### Task 3: `file` descriptor + generated `.bas` def + transpiler test

**Files:**
- Create: `src/lib/Basic4WebGL/library/descriptors/file.descriptor.ts`
- Modify: `scripts/generateLibrary.ts`
- Generated: `src/lib/Basic4WebGL/defs/file.bas` (produced by the generator — do not hand-edit)
- Test: `tests/lib/Basic4WebGL/unit/transpiler/file.test.ts`

- [ ] **Step 1: Write the descriptor**

```ts
// src/lib/Basic4WebGL/library/descriptors/file.descriptor.ts
import { ModuleDescriptor } from '../generator/types';

export const fileDescriptor: ModuleDescriptor = {
  name: 'file',
  functions: [
    { name: 'write', params: ['path', 'content'], body: (p) => `_sb.fileWrite(${p.path}, ${p.content})` },
    { name: 'read', params: ['path'], returns: (p) => `_sb.fileRead(${p.path})` },
    { name: 'exists', params: ['path'], returns: (p) => `_sb.fileExists(${p.path})` },
    { name: 'delete', params: ['path'], body: (p) => `_sb.fileDelete(${p.path})` },
  ],
};
```

- [ ] **Step 2: Register it in the generator script**

In `scripts/generateLibrary.ts`, add the import near the other descriptor imports:

```ts
import { fileDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/file.descriptor';
```

And add it to the `moduleDescriptors` array:

```ts
const moduleDescriptors: ModuleDescriptor[] = [
  stageDescriptor,
  gfxDescriptor,
  drawingDescriptor,
  penDescriptor,
  assetmanagerDescriptor,
  fileDescriptor,
];
```

- [ ] **Step 3: Run the generator**

```bash
npm run generate:library
```

Expected output includes `Generated file.bas`. Confirm the generated file:

```bash
cat src/lib/Basic4WebGL/defs/file.bas
```

Expected content:

```bas
function write(path, content)
    call("_sb.fileWrite(write_path, write_content)")
endfunction

function read(path)
    return call("_sb.fileRead(read_path)")
endfunction

function exists(path)
    return call("_sb.fileExists(exists_path)")
endfunction

function delete(path)
    call("_sb.fileDelete(delete_path)")
endfunction
```

- [ ] **Step 4: Write the transpiler test**

```ts
// tests/lib/Basic4WebGL/unit/transpiler/file.test.ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const fileSource = readFileSync('src/lib/Basic4WebGL/defs/file.bas', 'utf-8');

const transpileWithFile = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'file.bas', source: fileSource },
      { name: 'Main.bas', source },
    ],
  });

describe('file — write/read/exists/delete', () => {
  test('compiles without error', () => {
    const result = transpileWithFile([
      'function test()',
      '  file.write("save.json", "hello")',
      '  dim c',
      '  c = file.read("save.json")',
      '  dim e',
      '  e = file.exists("save.json")',
      '  file.delete("save.json")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.fileWrite(', () => {
    const result = transpileWithFile(
      'function test()\n  file.write("a", "b")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileWrite(');
  });

  test('emits _sb.fileRead(', () => {
    const result = transpileWithFile(
      'function test()\n  dim c\n  c = file.read("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileRead(');
  });

  test('emits _sb.fileExists(', () => {
    const result = transpileWithFile(
      'function test()\n  dim e\n  e = file.exists("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileExists(');
  });

  test('emits _sb.fileDelete(', () => {
    const result = transpileWithFile(
      'function test()\n  file.delete("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.fileDelete(');
  });
});
```

- [ ] **Step 5: Run the test**

```bash
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/file.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/file.descriptor.ts scripts/generateLibrary.ts src/lib/Basic4WebGL/defs/file.bas tests/lib/Basic4WebGL/unit/transpiler/file.test.ts
git commit -m "feat: add file .bas module (write/read/exists/delete)"
```

---

### Task 4: `save` descriptor + generated `.bas` def + transpiler test

**Files:**
- Create: `src/lib/Basic4WebGL/library/descriptors/save.descriptor.ts`
- Modify: `scripts/generateLibrary.ts`
- Generated: `src/lib/Basic4WebGL/defs/save.bas`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/save.test.ts`

- [ ] **Step 1: Write the descriptor**

```ts
// src/lib/Basic4WebGL/library/descriptors/save.descriptor.ts
import { ModuleDescriptor } from '../generator/types';

export const saveDescriptor: ModuleDescriptor = {
  name: 'save',
  functions: [
    { name: 'set', params: ['key', 'value'], body: (p) => `_sb.saveSet(${p.key}, ${p.value})` },
    { name: 'get', params: ['key'], returns: (p) => `_sb.saveGet(${p.key})` },
    { name: 'exists', params: ['key'], returns: (p) => `_sb.saveExists(${p.key})` },
    { name: 'delete', params: ['key'], body: (p) => `_sb.saveDelete(${p.key})` },
    { name: 'setAll', params: ['data'], body: (p) => `_sb.saveSetAll(${p.data})` },
    { name: 'getAll', params: [], returns: () => `_sb.saveGetAll()` },
  ],
};
```

- [ ] **Step 2: Register it in the generator script**

Add the import:

```ts
import { saveDescriptor } from '../src/lib/Basic4WebGL/library/descriptors/save.descriptor';
```

Add to `moduleDescriptors` (after `fileDescriptor`):

```ts
const moduleDescriptors: ModuleDescriptor[] = [
  stageDescriptor,
  gfxDescriptor,
  drawingDescriptor,
  penDescriptor,
  assetmanagerDescriptor,
  fileDescriptor,
  saveDescriptor,
];
```

- [ ] **Step 3: Run the generator**

```bash
npm run generate:library
```

Expected output includes `Generated save.bas`. Confirm:

```bash
cat src/lib/Basic4WebGL/defs/save.bas
```

Expected content:

```bas
function set(key, value)
    call("_sb.saveSet(set_key, set_value)")
endfunction

function get(key)
    return call("_sb.saveGet(get_key)")
endfunction

function exists(key)
    return call("_sb.saveExists(exists_key)")
endfunction

function delete(key)
    call("_sb.saveDelete(delete_key)")
endfunction

function setAll(data)
    call("_sb.saveSetAll(setall_data)")
endfunction

function getAll()
    return call("_sb.saveGetAll()")
endfunction
```

- [ ] **Step 4: Write the transpiler test**

```ts
// tests/lib/Basic4WebGL/unit/transpiler/save.test.ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const saveSource = readFileSync('src/lib/Basic4WebGL/defs/save.bas', 'utf-8');

const transpileWithSave = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'save.bas', source: saveSource },
      { name: 'Main.bas', source },
    ],
  });

describe('save — set/get/exists/delete/setAll/getAll', () => {
  test('compiles without error', () => {
    const result = transpileWithSave([
      'function test()',
      '  save.set("score", 10)',
      '  dim s',
      '  s = save.get("score")',
      '  dim e',
      '  e = save.exists("score")',
      '  save.delete("score")',
      '  dim d[]',
      '  save.setAll(d)',
      '  dim all',
      '  all = save.getAll()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.saveSet(', () => {
    const result = transpileWithSave(
      'function test()\n  save.set("a", 1)\nendfunction'
    );
    expect(result.code).toContain('_sb.saveSet(');
  });

  test('emits _sb.saveGet(', () => {
    const result = transpileWithSave(
      'function test()\n  dim s\n  s = save.get("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.saveGet(');
  });

  test('emits _sb.saveExists(', () => {
    const result = transpileWithSave(
      'function test()\n  dim e\n  e = save.exists("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.saveExists(');
  });

  test('emits _sb.saveDelete(', () => {
    const result = transpileWithSave(
      'function test()\n  save.delete("a")\nendfunction'
    );
    expect(result.code).toContain('_sb.saveDelete(');
  });

  test('emits _sb.saveSetAll(', () => {
    const result = transpileWithSave(
      'function test()\n  dim d[]\n  save.setAll(d)\nendfunction'
    );
    expect(result.code).toContain('_sb.saveSetAll(');
  });

  test('emits _sb.saveGetAll(', () => {
    const result = transpileWithSave(
      'function test()\n  dim all\n  all = save.getAll()\nendfunction'
    );
    expect(result.code).toContain('_sb.saveGetAll(');
  });
});
```

- [ ] **Step 5: Run the test**

```bash
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/save.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/save.descriptor.ts scripts/generateLibrary.ts src/lib/Basic4WebGL/defs/save.bas tests/lib/Basic4WebGL/unit/transpiler/save.test.ts
git commit -m "feat: add save .bas module (set/get/exists/delete/setAll/getAll)"
```

---

### Task 5: Wire both modules into the runtime bundle

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/index.tsx`

- [ ] **Step 1: Add both engine modules to `_sb` in `softBasicEngine.js`**

Current content:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbCamera,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
};
```

Change to:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbFile,
  ..._sbSave,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbCamera,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
};
```

- [ ] **Step 2: Import and concatenate both files in `src/components/Runner/index.tsx`**

Add two imports after the existing `sbAssets` import (`src/components/Runner/index.tsx:4`):

```ts
import sbFile from './engine/file.js?raw';
import sbSave from './engine/save.js?raw';
```

Update the join call (`src/components/Runner/index.tsx:42`) — current:

```ts
[sbLifecycle, sbInput, sbAssets, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbScene, sbCamera, softBasicEngine].join('\n')
```

Change to (inserting `sbFile, sbSave` right after `sbAssets` — `file` must precede `save` since `save.js`'s methods call `_sbFile.*`, and `softBasicEngine.js` must remain last since it references every `_sb*` global):

```ts
[sbLifecycle, sbInput, sbAssets, sbFile, sbSave, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbScene, sbCamera, softBasicEngine].join('\n')
```

- [ ] **Step 3: Verify the full test suite still passes**

```bash
npx vitest run
```

Expected: all tests pass, no regressions (this task only touches JS string concatenation/object spread — nothing else should be affected).

- [ ] **Step 4: Commit**

```bash
git add src/components/Runner/softBasicEngine.js src/components/Runner/index.tsx
git commit -m "feat: wire file/save engine modules into the runtime bundle"
```

---

### Task 6: Register `file`/`save` in the `softcore` package

**Files:**
- Modify: `src/constants/firstPartyPackages.ts`

- [ ] **Step 1: Add both module names to `softcore`**

Current:

```ts
{
  id: 'softcore',
  name: 'softCore',
  version: '1.0.0',
  isCore: true,
  isFirstParty: true,
  moduleNames: ['math', 'string', 'array'],
},
```

Change `moduleNames` to:

```ts
  moduleNames: ['math', 'string', 'array', 'file', 'save'],
```

(Not `softgfx` — `file`/`save` have no conceptual tie to graphics/game-runtime, unlike everything else in that package; see the spec's note on why "needs `_sb` bridging" isn't the right criterion.)

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/constants/firstPartyPackages.ts
git commit -m "feat: register file/save in the softcore package"
```

---

### Task 7: Docs — API reference pages + manifest

**Files:**
- Create: `src/docs/api-reference/file.md`
- Create: `src/docs/api-reference/save.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Write `src/docs/api-reference/file.md`**

```md
# file

The `file` module lets your game save and load its own text data — a high score, a player's progress, or anything else that should still be there the next time someone plays. Data is stored in the player's browser and stays there between visits.

If you're saving structured data like scores and inventory together, the [save](save) module is usually easier — it handles the conversion to and from text for you.

## write(path, content)

Saves text under a name you choose. If something is already saved under that name, it's replaced.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | A name for this piece of data, e.g. `"progress.txt"` |
| content   | string | The text to save |

```bas
file.write("progress.txt", "level 3")
```

## read(path)

Loads text previously saved under a name.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | The name passed to `write` earlier |

**Returns:** string — the saved text, or an empty string `""` if nothing has been saved under that name yet.

```bas
dim progress
progress = file.read("progress.txt")
print progress
```

## exists(path)

Checks whether anything has been saved under a name yet.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | The name to check |

**Returns:** true or false

```bas
if file.exists("progress.txt") == true
  print "Welcome back!"
endif
```

## delete(path)

Removes whatever was saved under a name. Does nothing if there was nothing saved there.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | The name to remove |

```bas
file.delete("progress.txt")
```
```

- [ ] **Step 2: Write `src/docs/api-reference/save.md`**

```md
# save

The `save` module stores your game's own values — scores, inventory, progress — without you having to convert them to text yourself. It's built on top of [file](file), and keeps everything for a project as one saved bundle.

## set(key, value)

Saves a single value under a name. `value` can be a number, a string, an array, or a dictionary.

| Parameter | Type                          | Description |
|-----------|-------------------------------|-------------|
| key       | string                        | A name for this value, e.g. `"highscore"` |
| value     | number, string, array, or object | The value to save |

```bas
save.set("highscore", 4200)
```

## get(key)

Loads a value previously saved under a name.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | string | The name passed to `set` earlier |

**Returns:** whatever was saved — number, string, array, or object — or an empty string `""` if nothing has been saved under that name yet.

```bas
dim highscore
highscore = save.get("highscore")
print highscore
```

## exists(key)

Checks whether a value has been saved under a name yet.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | string | The name to check |

**Returns:** true or false

## delete(key)

Removes a single saved value. Does nothing if there was nothing saved under that name.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | string | The name to remove |

## setAll(data)

Saves an entire dictionary of values at once, **replacing everything previously saved** — including any values saved individually with `set`. Use this when your game keeps all of its save data in one dictionary and saves it all together.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| data      | object | A dictionary of everything to save |

```bas
dim state[]
state["level"] = 3
state["score"] = 4200
save.setAll(state)
```

## getAll()

Loads everything previously saved, as a single dictionary.

**Returns:** object — a dictionary of everything saved. Empty if nothing has been saved yet.

```bas
dim state
state = save.getAll()
print state["level"]
```
```

- [ ] **Step 3: Add both pages to `src/docs/manifest.ts`**

In the `'softCore'` group (`src/docs/manifest.ts` — the group containing `math`/`string`/`array`/`dict`), current:

```ts
{
  label: 'softCore',
  topics: [
    { slug: 'math',   title: 'math',   file: 'api-reference/math.md' },
    { slug: 'string', title: 'string', file: 'api-reference/string.md' },
    { slug: 'array',  title: 'array',  file: 'api-reference/array.md' },
    { slug: 'dict',   title: 'dict',   file: 'api-reference/dict.md' },
  ],
},
```

Change to:

```ts
{
  label: 'softCore',
  topics: [
    { slug: 'math',   title: 'math',   file: 'api-reference/math.md' },
    { slug: 'string', title: 'string', file: 'api-reference/string.md' },
    { slug: 'array',  title: 'array',  file: 'api-reference/array.md' },
    { slug: 'dict',   title: 'dict',   file: 'api-reference/dict.md' },
    { slug: 'file',   title: 'file',   file: 'api-reference/file.md' },
    { slug: 'save',   title: 'save',   file: 'api-reference/save.md' },
  ],
},
```

- [ ] **Step 4: Verify the docs build**

```bash
npx vite build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/docs/api-reference/file.md src/docs/api-reference/save.md src/docs/manifest.ts
git commit -m "docs: add file and save API reference pages"
```

---

### Task 8: Cypress e2e — real persistence across a page reload

**Files:**
- Create: `cypress/e2e/save-load.cy.ts`

This is the layer that actually proves the feature works — no unit test touches `localStorage` or a real page reload. Follows the existing `cypress/e2e/tutorials.cy.ts` pattern (seed a project into `localStorage` via `onBeforeLoad`, visit, click Run, assert on the console panel), but reuses the *same* seeded project across a `cy.reload()` to prove state survives it, and adds a second, differently-seeded project to prove isolation.

**Scope note — quota-exceeded is not covered by an automated test.** The spec calls for verifying that a `QuotaExceededError` from `localStorage.setItem` propagates as a runtime error rather than being swallowed. Automating that reliably would mean either stubbing `localStorage` inside the sandboxed game iframe (Cypress has no clean way to reach into a nested `iframe`'s `window` for this) or actually filling several MB of real storage before every run (slow, and the exact quota varies by browser). `file.js`'s `writeAll` has no `try`/`catch` around `localStorage.setItem` (Task 1) — that absence *is* the fix, and is visible on inspection. If this needs to be verified manually once: open the built app, run `for (let i = 0; i < 10000; i++) localStorage.setItem('x'+i, 'x'.repeat(9000))` in the browser console to fill storage, then trigger a `file.write` from a running game and confirm the error surfaces in the console panel instead of silently vanishing.

- [ ] **Step 1: Write the spec**

```ts
// cypress/e2e/save-load.cy.ts
/// <reference types="cypress" />

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(projectId: string, projectName: string, files: FileSpec[]): string {
  const filesById: Record<string, object> = {};
  const fileOrder: string[] = [];
  files.forEach((f) => {
    const id = `file-${f.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    filesById[id] = {
      id,
      name: f.name,
      source: f.source,
      projectId,
      folderId: null,
      fullName: f.name,
    };
    fileOrder.push(id);
  });

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({
      byId: filesById,
      dirtyFileIds: [],
      fileOrder: { [`${projectId}:root`]: fileOrder },
    }),
    assets: JSON.stringify({ byId: {}, assetOrder: {} }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function visitAndRun(projectId: string, projectName: string, source: string) {
  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', buildPersistedState(projectId, projectName, [
        { name: 'Main', source },
      ]));
    },
  });
  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(1500);
}

const VISIT_COUNTER_SOURCE = `
function onenter()
  dim visits
  visits = save.get("visits")
  if visits == ""
    visits = 0
  endif
  visits = visits + 1
  save.set("visits", visits)
  print "visits: " + string.str(visits)
endfunction
`.trim();

describe('save/load: persists across a real page reload', () => {
  it('increments a saved counter each time the same project runs, surviving reload', () => {
    visitAndRun('save01', 'Save Test', VISIT_COUNTER_SOURCE);
    cy.get('span').contains('visits: 1').should('exist');

    cy.reload();
    cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
    cy.wait(1500);
    cy.get('span').contains('visits: 2').should('exist');
  });
});

describe('save/load: setAll/getAll round-trips a nested dict+array, and setAll replaces', () => {
  const SOURCE = `
function onenter()
  save.set("leftover", "should be gone after setAll")

  dim state[]
  state["level"] = 3
  dim items(1)
  items(0) = "sword"
  state["items"] = items
  save.setAll(state)

  dim loaded
  loaded = save.getAll()

  dim loadedItems
  loadedItems = loaded["items"]

  print "level: " + string.str(loaded["level"])
  print "item0: " + loadedItems(0)
  print "leftover exists: " + string.str(save.exists("leftover"))
endfunction
`.trim();

  it('round-trips a dict containing an array, and setAll wipes prior individually-set keys', () => {
    visitAndRun('save02', 'Save Test 2', SOURCE);
    cy.get('span').contains('level: 3').should('exist');
    cy.get('span').contains('item0: sword').should('exist');
    cy.get('span').contains('leftover exists: false').should('exist');
  });
});

describe('save/load: two different projects never see each other\'s data', () => {
  it('a fresh project has no saved visits even though save01 does', () => {
    visitAndRun('save03', 'Save Test 3', VISIT_COUNTER_SOURCE);
    // A brand-new project id has never saved "visits" — should start at 1, not
    // pick up save01's count from the earlier test in this same describe block.
    cy.get('span').contains('visits: 1').should('exist');
  });
});
```

- [ ] **Step 2: Run the spec headlessly**

Ensure the dev server is running first (separate terminal):

```bash
npm run dev
```

Then, in another terminal:

```bash
npx cypress run --spec cypress/e2e/save-load.cy.ts
```

Expected: 3 passing tests.

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/save-load.cy.ts
git commit -m "test: add Cypress e2e coverage for file/save persistence"
```

---

### Task 9: Close out the roadmap milestone

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Mark the deliverable and milestone done**

In `docs/roadmap.md`, Milestone 3's `### Deliverables` section — current:

```md
### Deliverables
- **Game state save/load** — a new library module (working name `storage`) exposing something like `storage.save(key, data)` / `storage.load(key)` / `storage.exists(key)` / `storage.delete(key)`, backed by browser `localStorage` and scoped per-project so games don't collide with each other. Promoted here from `library-roadmap.md`'s backlog, where it had sat as "Not started" with no milestone attached despite being the actual gate on shippable games. Follows the standard six-step library feature process (`.bas` def, engine module, bootstrapper wiring, tests, docs, roadmap update).
```

Change to:

```md
### Deliverables
- ~~**Game state save/load**~~ **[DONE]** — shipped as two modules: `file` (raw string I/O, `localStorage`-backed) and `save` (auto-serializing convenience layer on top, single-blob-per-project). See `docs/superpowers/specs/2026-08-02-file-save-io-design.md` for the full design.
```

Update the milestone heading from:

```md
## Milestone 3 — Public beta readiness (minor bump)

**Now the current focus.**
```

to:

```md
## ~~Milestone 3 — Public beta readiness~~ **[DONE]**
```

Don't add a version number to this heading now — the other completed milestones in this doc (`Milestone 1`, `Milestone 2`) only got their `shipped as vX.Y.Z` tag added *after* the actual version bump happened at push time, not during the implementation commit. Doing the same here means: leave the heading as `**[DONE]**` in this task's commit, and whoever runs the push (bumping `package.json` per `CLAUDE.md`'s convention) adds `— shipped as vX.Y.Z, <date>` to this exact heading in that same push commit, once the real number is known.

Also update Milestone 4's now-outdated forward-reference — current:

```md
## Milestone 4 — User accounts (minor bump)

**Goal:**
```

Change to:

```md
## Milestone 4 — User accounts (minor bump)

**Now the current focus.**

**Goal:**
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: close out Milestone 3 — file/save shipped"
```

---

## Notes for whoever pushes this

Per `CLAUDE.md`'s push convention: update `src/docs/release-notes.md` and bump `package.json`'s `version` in the same commit as a `chore: bump version to x.y.z` message — but **only when explicitly asked to push**, and only after confirming with the user whether this closes Milestone 3 (minor bump, e.g. `0.5.0`) as intended, since that's a bigger version jump than the patch bumps used for the individual commits in this plan.
