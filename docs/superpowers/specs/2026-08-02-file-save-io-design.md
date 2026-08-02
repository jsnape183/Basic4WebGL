# File & Save I/O Design

## Goal

Give softBASIC games a way to persist state across a page reload — the gap identified as the actual blocker on "public beta readiness" (`docs/roadmap.md` Milestone 3), ahead of accounts/sharing/packages. Two new public modules:

- **`file`** — raw string-based file I/O (`write`/`read`/`exists`/`delete`), backed by `localStorage` today, deliberately shaped so a future real-filesystem backend (Electron/Tauri desktop export, Milestone 9/14) can swap in later without changing this API.
- **`save`** — an auto-serializing convenience layer on top of `file`, so a game author works with plain softBASIC values (numbers, strings, arrays, dictionaries) instead of hand-rolling JSON.

Agreed through brainstorming 2026-08-02.

---

## Scope decisions

- **Two independent public modules, not one.** `file` is the low-level primitive; `save` is sugar built on it. Both ship this milestone (not `file` now, `save` later) — confirmed with the user rather than assumed.
- **`save` has no storage logic of its own.** Every `save.*` function reduces to reading/writing a single conventional path (`"save.json"`) via `file`, plus a serialization step. This is an engine-level (JS) dependency between `save.js` and `file.js` — not a softBASIC-level cross-module call — keeping the two `.bas` modules independently simple while sharing one implementation of "how bytes actually get persisted."
- **`save` is a single blob per project, not per-key files.** `save.set`/`save.get` are a read-modify-write view over one JSON object; `save.setAll`/`save.getAll` operate on that same object directly. This is what makes `setAll`'s "replace entirely" semantics (below) simple and consistent — there's only ever one underlying object.
- **`setAll` replaces, it does not merge.** `save.setAll(dict)` overwrites the whole saved blob with exactly `dict`. A game should pick one style (granular `set`/`get`, or bulk `setAll`/`getAll`) and use it consistently, rather than mixing both against different mental models of what a "write" does.
- **Missing keys/paths return an empty default, not an error.** `file.read` on a path that was never written returns `""`; `save.get` on a key that was never set returns an empty value of the shape it's used as (empty dict/array/string). This matches the single most common pattern — checking for a save on startup — without forcing an `exists()` check before every read. Note this deliberately differs from the language's own dictionary-index behavior (`d["missing"]` throws, per `src/docs/language-guide/dictionaries.md`) — a considered inconsistency, not an oversight: dictionary indexing is a language-level operator with existing semantics we're not touching, while `file`/`save` are new library functions free to choose the more forgiving default that fits their specific "is there a save yet" use case.
- **Write failures (quota exceeded) surface as a runtime error.** A silently-failed save is worse than a visible one — same reasoning as the language's existing runtime error behavior elsewhere. No new error-handling plumbing needed: `localStorage.setItem` throwing `QuotaExceededError` propagates naturally through the existing `call("...")` → engine-exception → runtime-error-panel/Sentry pipeline that already exists for every other runtime error.
- **Own localStorage namespace, isolated from the IDE's own data.** The runtime iframe already has real `localStorage` access on the same origin as the editor (confirmed in `assets.js`'s `preloadFromLocalStorage`, which reads the IDE's own `persist:softBASIC` redux-persist key directly). `file`/`save` must use a **completely separate key prefix** — corrupting or colliding with `persist:softBASIC` would corrupt the user's actual projects, not just their in-game save data.
- **No directory listing.** `file` doesn't get a `list(directory)` function this milestone — not blocking, and harder to design well (what does "directory" even mean against a flat key-value backend) than to defer.
- **Paths are forward-slash-delimited strings**, e.g. `"saves/slot1.txt"` — meaningless to today's flat backend beyond being part of the key, but exactly the shape a future real-filesystem backend needs. Costs nothing now, avoids an API change later.

---

## Architecture

### 1. `file` module — raw storage primitive

**Engine (`src/components/Runner/engine/file.js`, new):**

```js
const _sbFile = (() => {
  const STORAGE_PREFIX = 'sb_files:';

  function readAll(projectId) {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + projectId);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function writeAll(projectId, files) {
    window.localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(files));
  }

  return {
    fileWrite(path, content) {
      const files = readAll(_sbProjectId);
      files[path] = content;
      writeAll(_sbProjectId, files); // QuotaExceededError propagates naturally — no catch here
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

One `localStorage` key per project (`sb_files:<projectId>`), holding a flat `{ path: content }` map — not one `localStorage` key per file. Keeps the per-project footprint to a single key (easy to reason about, easy to wipe entirely later if a "reset game data" feature is ever wanted) while still giving `file` real path-keyed semantics. `_sbProjectId` is already a global in the bootstrapper (confirmed — `assets.js` and `bootstrapper.html` both already use it), so no new plumbing needed to know which project's storage to touch.

**`.bas` def, authored as a descriptor** (`src/lib/Basic4WebGL/library/descriptors/file.descriptor.ts`, following the existing `assetmanager.descriptor.ts` pattern — a `ModuleDescriptor`, not hand-written `.bas`):

```ts
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

Registered in `scripts/generateLibrary.ts`'s `moduleDescriptors` array; running `npm run generate:library` produces `src/lib/Basic4WebGL/defs/file.bas`.

### 2. `save` module — auto-serializing convenience layer

**Engine (`src/components/Runner/engine/save.js`, new — depends on `file.js` at the JS level, not a softBASIC cross-module call):**

```js
const _sbSave = (() => {
  const SAVE_PATH = 'save.json';

  // Dictionaries are Map-backed at runtime (see _createDict in bootstrapper.html) —
  // bare JSON.stringify/parse would silently produce "{}" for one. This walks
  // arrays/Maps recursively so nested dicts-in-arrays-in-dicts round-trip too.
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
    try { return decode(JSON.parse(raw)); } catch { return new Map(); }
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

The "whole blob" is itself represented internally as a `Map` (consistent with how softBASIC dictionaries already work at runtime) so `saveGetAll()` returns exactly the same kind of value a `dim d[]` dictionary is — no special-casing needed on the `.bas`/transpiled side.

**`.bas` def, authored as a descriptor** (`src/lib/Basic4WebGL/library/descriptors/save.descriptor.ts`):

```ts
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

### 3. Bootstrapper wiring

`src/components/Runner/softBasicEngine.js` gains two more spreads, alphabetically/logically near the other data-adjacent modules:

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbFile,
  ..._sbSave,
  ..._sbAudio,
  // ...unchanged
};
```

`file.js` must be included in the engine bundle **before** `save.js` (script concatenation order — `save.js`'s IIFE references `_sbFile` at definition time), matching how `softBasicEngine.js` itself is assembled from the individual engine files.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/Runner/engine/file.js` | CREATE | `_sbFile` — per-project path→content map in one `localStorage` key |
| `src/components/Runner/engine/save.js` | CREATE | `_sbSave` — Map-aware JSON encode/decode + single-blob read-modify-write, built on `_sbFile` |
| `src/components/Runner/softBasicEngine.js` | MODIFY | Spread `_sbFile`/`_sbSave` into `_sb` |
| `src/lib/Basic4WebGL/library/descriptors/file.descriptor.ts` | CREATE | `ModuleDescriptor` for `file` |
| `src/lib/Basic4WebGL/library/descriptors/save.descriptor.ts` | CREATE | `ModuleDescriptor` for `save` |
| `scripts/generateLibrary.ts` | MODIFY | Register both descriptors in `moduleDescriptors`, regenerate `.bas` defs |
| `src/lib/Basic4WebGL/defs/file.bas`, `save.bas` | GENERATED | Produced by `npm run generate:library` — not hand-edited |
| `src/constants/firstPartyPackages.ts` | MODIFY | Add `file`, `save` to `softgfx`'s `moduleNames` (alongside `assetmanager` and the other engine-bridged modules) — not `softcore`, which is reserved for pure computational modules with no `_sb` bridging (`math`, `string`, `array`) |
| `tests/lib/Basic4WebGL/unit/transpiler/file.test.ts`, `save.test.ts` | CREATE | Transpiler-output tests (per `CLAUDE.md`: verify transpiled output, not runtime behaviour) — matching the existing descriptor-generated-module test pattern |
| `cypress/e2e/save-load.cy.ts` | CREATE | The engine modules (`assets.js` and siblings) have no direct unit tests in this codebase — runtime behavior is verified through Cypress instead (per `CLAUDE.md`'s Cypress section). This is the layer that actually proves: per-project isolation, missing-key defaults, `setAll` replace semantics, a dict-in-array-in-dict round-tripping through the Map-aware encoder, and — the one thing no other test layer can prove — that a value written before a real page reload is still there after one |
| `src/docs/api-reference/file.md`, `save.md` | CREATE | Beginner-style API reference pages, per existing doc conventions |
| `src/docs/manifest.ts` | MODIFY | Add the two new API Reference pages |
| `docs/roadmap.md` | MODIFY | Mark Milestone 3's "Game state save/load" deliverable done once shipped — closes the milestone (only remaining item), so this is the trigger for the next minor version bump |

---

## Tests

- **Transpiler output** (`file.test.ts`, `save.test.ts` under `unit/transpiler/`) — each function call transpiles to the expected `_sb.*` call with correctly-prefixed parameters, matching the existing descriptor-generated-module test pattern (e.g. how `assetmanager`/`stage` are tested today).
- **Runtime behavior, via Cypress** (`cypress/e2e/save-load.cy.ts`) — per-project isolation (two different projects never see each other's data), `file.read`/`save.get` default-empty on a never-written path/key, `save.setAll` genuinely replaces (a previously-`set` key disappears after an unrelated `setAll`), `save.getAll` round-trips a dict containing a nested array containing a nested dict (the actual reason the custom encoder exists — this is the case bare `JSON.stringify` would silently corrupt), and — the case that matters most and no unit test can prove — a value written before a real page reload (`cy.reload()`) is still there after one.
- **Docs cross-reference** — per `CLAUDE.md`'s API cross-reference rule, every code sample in the two new doc pages must be checked against the actual generated `.bas` output, not written from memory.

---

## Docs

Two new API Reference pages (`file.md`, `save.md`), beginner-style per the existing convention (one-sentence description → parameter table → `**Returns:**` line → game-like `.bas` example — e.g. a high-score save, not an abstract `foo`/`bar`). Added to `src/docs/manifest.ts`'s API Reference group.

## Roadmap

`docs/roadmap.md` Milestone 3 — mark "Game state save/load" done once shipped. This is the only remaining deliverable in that milestone (production error tracking turned out to already be shipped — see the milestone's "Already done" note), so completing this closes Milestone 3 entirely: a minor version bump per the versioning model, whenever this next gets pushed.
