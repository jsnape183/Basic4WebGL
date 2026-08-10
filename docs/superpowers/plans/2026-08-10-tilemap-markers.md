# Tilemap Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tagged position markers to `TileMapSet` — paint them in the visual Tilemap Editor as a new layer kind, persist them in the `.stm` format, and query them by tag at runtime (`tileMapSet.markersByTag(tag)`).

**Architecture:** A marker layer is a new, additive `.stm` layer shape (`{ type: "markers", markers: [{row, col, tag}] }`) that never renders and lives alongside ordinary bare-array tile layers with zero format changes to the latter. The editor's `EditorLayer` type becomes a discriminated union (`kind: 'tile' | 'marker'`), reusing the existing Layers panel, and gets two new small components (`MarkerCanvas`, `TagPicker`) that swap in for `Canvas`/`Palette` when a marker layer is active, sharing a new `usePaintDrag` hook with the existing tile canvas so the drag-paint interaction isn't duplicated. The engine (`createTileMapSet`) skips marker layers in its sprite-render loop and exposes them via a new `markersByTag` query; a new lightweight `Marker` softBASIC class (mirroring the existing `rayhit` pattern) carries the result.

**Tech Stack:** React + TypeScript (Redux-backed editor UI), Vitest + React Testing Library, softBASIC transpiler, PIXI.js-backed JS engine runtime.

---

## Before you start

Read `docs/superpowers/specs/2026-08-10-tilemap-markers-design.md` in full — it has the approved scope decisions (one marker per cell per marker layer, tag is a free-text string with no reserved vocabulary, `markersByTag` searches across every marker layer in the set, no runtime marker mutation) this plan implements without re-deriving.

---

### Task 1: Shared types + `.stm` codec marker support

**Files:**
- Create: `src/components/TileMapEditor/types.ts`
- Test: `tests/ui/components/TileMapEditor/stmCodec.test.ts`
- Modify: `src/components/TileMapEditor/index.tsx`
- Modify: `src/components/TileMapEditor/LayersPanel.tsx`

This is the foundation task: it introduces the discriminated `EditorLayer` type and teaches `decodeStmContent`/`encodeStmContent` to round-trip the new marker-layer shape, without yet adding any UI to create one. Every existing tile-layer behavior is unchanged — this task is verified both by new tests (the codec functions, now exported for direct testing) and by confirming the existing test suite for this component tree stays green.

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/TileMapEditor/stmCodec.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { decodeStmContent, encodeStmContent } from '../../../../src/components/TileMapEditor';

function toDataUrl(json: unknown): string {
  return 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(json))));
}

describe('decodeStmContent', () => {
  test('decodes a bare-array layer as a tile layer', () => {
    const content = toDataUrl({ tileWidth: 16, tileHeight: 16, tileImage: 'a.png', layers: { background: [[1, 0], [0, 1]] } });
    const doc = decodeStmContent(content);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0]).toMatchObject({ name: 'background', kind: 'tile', data: [[1, 0], [0, 1]] });
  });

  test('decodes a { type: "markers" } layer as a marker layer', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { spawns: { type: 'markers', markers: [{ row: 1, col: 2, tag: 'spawn' }] } },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0]).toMatchObject({ name: 'spawns', kind: 'marker', markers: [{ row: 1, col: 2, tag: 'spawn' }] });
  });

  test('decodes a file mixing tile and marker layers, preserving order', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: {
        background: [[1, 0]],
        spawns: { type: 'markers', markers: [] },
      },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers.map((l) => l.kind)).toEqual(['tile', 'marker']);
  });
});

describe('encodeStmContent', () => {
  test('round-trips a tile layer as a bare array', () => {
    const content = toDataUrl({ tileWidth: 16, tileHeight: 16, tileImage: 'a.png', layers: { background: [[1, 0]] } });
    const doc = decodeStmContent(content);
    const reEncoded = encodeStmContent(doc, content);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(reEncoded.split(',')[1]))));
    expect(decoded.layers.background).toEqual([[1, 0]]);
  });

  test('round-trips a marker layer as { type: "markers" }', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { spawns: { type: 'markers', markers: [{ row: 1, col: 2, tag: 'spawn' }] } },
    });
    const doc = decodeStmContent(content);
    const reEncoded = encodeStmContent(doc, content);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(reEncoded.split(',')[1]))));
    expect(decoded.layers.spawns).toEqual({ type: 'markers', markers: [{ row: 1, col: 2, tag: 'spawn' }] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmCodec.test.ts`
Expected: FAIL — `decodeStmContent`/`encodeStmContent` are not exported from `src/components/TileMapEditor/index.tsx` yet (module has no such named exports).

- [ ] **Step 3: Create the shared types file**

Create `src/components/TileMapEditor/types.ts`:

```ts
export type MarkerEntry = { row: number; col: number; tag: string };

export type EditorLayer =
  | { key: string; name: string; kind: 'tile'; data: number[][] }
  | { key: string; name: string; kind: 'marker'; markers: MarkerEntry[] };

export type StmDoc = {
  tileWidth: number;
  tileHeight: number;
  tileImage: string;
  layers: EditorLayer[];
};
```

- [ ] **Step 4: Update `index.tsx`'s codec functions and layer-creation sites**

In `src/components/TileMapEditor/index.tsx`:

Replace the existing `StmDoc` type definition and import line for `EditorLayer`:

```tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch, RootState } from '../../store';
import { useTilesetSlices } from './useTilesetSlices';
import Palette from './Palette';
import TileMapCanvas from './Canvas';
import LayersPanel from './LayersPanel';
import { StmDoc, EditorLayer, MarkerEntry } from './types';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

type StmLayerValue = number[][] | { type: 'markers'; markers: MarkerEntry[] };
```

Replace `decodeStmContent` and `encodeStmContent` (add `export`, handle both layer shapes):

```tsx
export function decodeStmContent(content: string): StmDoc {
  const comma = content.indexOf(',');
  const raw = comma === -1 ? '{}' : decodeURIComponent(escape(atob(content.slice(comma + 1))));
  let parsed: { tileWidth?: number; tileHeight?: number; tileImage?: string; layers?: Record<string, StmLayerValue> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const layerEntries = Object.entries(parsed.layers ?? {});
  return {
    tileWidth: parsed.tileWidth ?? 16,
    tileHeight: parsed.tileHeight ?? 16,
    tileImage: parsed.tileImage ?? '',
    layers: layerEntries.map(([name, value]): EditorLayer =>
      Array.isArray(value)
        ? { key: crypto.randomUUID(), name, kind: 'tile', data: value }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers }
    ),
  };
}

export function encodeStmContent(doc: StmDoc, originalContent: string): string {
  const mime = originalContent.startsWith('data:')
    ? originalContent.slice(5, originalContent.indexOf(';'))
    : 'application/json';
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    layers[l.name] = l.kind === 'tile' ? l.data : { type: 'markers', markers: l.markers };
  });
  const json = JSON.stringify({
    tileWidth: doc.tileWidth,
    tileHeight: doc.tileHeight,
    tileImage: doc.tileImage,
    layers,
  });
  return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(json)));
}
```

Update `handleAddLayer` to add `kind: 'tile'` to the layer it creates (its signature/behavior will change further in Task 9 — for now, just make it produce a valid `EditorLayer`):

```tsx
  const handleAddLayer = (name: string) => {
    const rows = activeLayer?.kind === 'tile' ? activeLayer.data.length : 1;
    const cols = activeLayer?.kind === 'tile' ? activeLayer.data[0]?.length ?? 1 : 1;
    const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, { key: crypto.randomUUID(), name, kind: 'tile', data }] }));
  };
```

Update `handlePaintCell` to guard on `kind` (behavior for tile layers is otherwise unchanged; marker painting is not implemented until Task 9):

```tsx
  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer || activeLayer.kind !== 'tile') return;
    const tileId = selectedTile ?? 0;
    setDraftDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => {
        if (i !== activeIndex || l.kind !== 'tile') return l;
        const newData = l.data.map((r) => r.slice());
        newData[row][col] = tileId;
        return { ...l, data: newData };
      }),
    }));
    setIsDirty(true);
  };
```

Update the canvas render to only pass tile data when the active layer is a tile layer (guards against passing `undefined` where `number[][]` is expected):

```tsx
          <TileMapCanvas layerData={activeLayer?.kind === 'tile' ? activeLayer.data : []} slices={slices} onPaintCell={handlePaintCell} />
```

- [ ] **Step 5: Update `LayersPanel.tsx` to import `EditorLayer` from the new shared file**

In `src/components/TileMapEditor/LayersPanel.tsx`, remove the local type definition and export:

```tsx
// DELETE this line:
// export type EditorLayer = { key: string; name: string; data: number[][] };
```

Add the import at the top instead:

```tsx
import { EditorLayer } from './types';
```

- [ ] **Step 6: Update `LayersPanel.test.tsx`'s helper for the new required `kind` field**

In `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`, update the import and `makeLayers` helper:

```tsx
import LayersPanel from '../../../../src/components/TileMapEditor/LayersPanel';
import { EditorLayer } from '../../../../src/components/TileMapEditor/types';

const makeLayers = (): EditorLayer[] => [
  { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
  { key: 'k2', name: 'foreground', kind: 'tile', data: [[0]] },
];
```

- [ ] **Step 7: Run tests to verify everything passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/`
Expected: PASS — all existing `TileMapEditor` component tests (`Canvas`, `LayersPanel`, `NewTilemapDialog`, `Palette`, `TileMapEditor`, `TilemapChooserModal`, `useTilesetSlices`) plus the new `stmCodec.test.ts` (6 new tests) all pass with zero behavior change to existing functionality.

- [ ] **Step 8: Commit**

```bash
git add src/components/TileMapEditor/types.ts src/components/TileMapEditor/index.tsx src/components/TileMapEditor/LayersPanel.tsx tests/ui/components/TileMapEditor/stmCodec.test.ts tests/ui/components/TileMapEditor/LayersPanel.test.tsx
git commit -m "feat: tilemap marker layer data model and .stm codec support"
```

---

### Task 2: Engine — marker-layer parsing and `markersByTag`

**Files:**
- Modify: `src/components/Runner/engine/tilemap.js`
- Modify: `tests/components/Runner/tilemap.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/tilemap.test.ts`:

```ts
describe('createTileMapSet — marker layers (no rendering, accumulated into handle._markers)', () => {
  test('a marker layer produces no layer container and no rendered sprites', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        background: [[1, 1]],
        spawns: { type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background']);
    expect(set._markers).toEqual([{ row: 0, col: 1, tag: 'spawn' }]);
  });

  test('an old-format file with only bare-array tile layers is completely unaffected', async () => {
    const stm = { tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png', layers: { background: [[1, 0]] } };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background']);
    expect(set._markers).toEqual([]);
  });

  test('a file with multiple marker layers accumulates markers from all of them', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'spawn' }] },
        pickups: { type: 'markers', markers: [{ row: 1, col: 1, tag: 'pickup' }] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(set._markers).toEqual([
      { row: 0, col: 0, tag: 'spawn' },
      { row: 1, col: 1, tag: 'pickup' },
    ]);
  });
});

describe('markersByTag', () => {
  test('returns world-space cell-center positions for every marker matching the tag', () => {
    const { tileAt, markersByTag } = loadTilemap();
    const handle = {
      x: 0, y: 0, parent: null,
      _tileW: 10, _tileH: 10,
      _markers: [
        { row: 0, col: 1, tag: 'spawn' },
        { row: 2, col: 0, tag: 'spawn' },
        { row: 1, col: 1, tag: 'pickup' },
      ],
    };
    void tileAt; // unused in this describe block, imported for symmetry with other tests in this file

    const results = markersByTag(handle, 'spawn');

    expect(results).toEqual([
      { x: 15, y: 5 },  // col 1, row 0 -> local center (15, 5)
      { x: 5, y: 25 },  // col 0, row 2 -> local center (5, 25)
    ]);
  });

  test('returns an empty array when no marker matches the tag', () => {
    const { markersByTag } = loadTilemap();
    const handle = { x: 0, y: 0, parent: null, _tileW: 10, _tileH: 10, _markers: [{ row: 0, col: 0, tag: 'spawn' }] };

    expect(markersByTag(handle, 'nope')).toEqual([]);
  });

  test('accounts for the TileMapSet handle\'s own offset, same as tileAt', () => {
    const worldContainer = {};
    const { markersByTag } = loadTilemap(worldContainer);
    const handle = { x: 20, y: 0, parent: worldContainer, _tileW: 10, _tileH: 10, _markers: [{ row: 0, col: 0, tag: 'spawn' }] };

    // local center (5, 5) + offset (20, 0) = world (25, 5)
    expect(markersByTag(handle, 'spawn')).toEqual([{ x: 25, y: 5 }]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts`
Expected: FAIL — `set._markers` is `undefined` (not `[]`), and `markersByTag is not a function`.

- [ ] **Step 3: Write the minimal implementation**

In `src/components/Runner/engine/tilemap.js`, replace `createTileMapSet` with:

```js
  createTileMapSet(stmPath) {
    // PIXI's asset loader recognizes `.json` and auto-parses it, but has no
    // parser registered for the custom `.stm` extension, so it loads as a raw
    // string instead of a parsed object — parse it ourselves.
    const raw = _sbAssets.get(stmPath);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const tileW = Number(data.tileWidth);
    const tileH = Number(data.tileHeight);
    const frames = _sbAssets.getSlices(data.tileImage, tileW, tileH);

    // One wrapping container holds every tile layer as a child, in file
    // order — this is the object handed back as TileMapSet's own `_handle`,
    // so it plugs into `world.add`/`world.remove` exactly like Sprite/TileMap
    // do (no auto-render at construction; the softBASIC caller decides when
    // and whether to add it, same as every other renderable).
    const handle = new PIXI.Container();
    const layerContainers = {};
    const markers = [];
    for (const name of Object.keys(data.layers)) {
      const layerValue = data.layers[name];
      if (!Array.isArray(layerValue)) {
        // Marker layer: never rendered, no PIXI.Container child — just
        // accumulate its entries into the set-level marker list, which
        // markersByTag searches across every marker layer at once (not
        // scoped to one named layer).
        for (const m of layerValue.markers) {
          markers.push({ row: m.row, col: m.col, tag: m.tag });
        }
        continue;
      }
      const layerData = layerValue;
      const container = new PIXI.Container();
      container._tileW = tileW;
      container._tileH = tileH;
      container._frames = frames;
      container._map = layerData;
      for (let row = 0; row < layerData.length; row++) {
        for (let col = 0; col < layerData[row].length; col++) {
          const id = layerData[row][col];
          if (!id) continue;
          if (id < 1 || id > frames.length) continue;
          const sprite = new PIXI.Sprite(frames[id - 1]);
          sprite.x = col * tileW;
          sprite.y = row * tileH;
          container.addChild(sprite);
        }
      }
      layerContainers[name] = container;
      handle.addChild(container);
    }
    handle._layerContainers = layerContainers;
    handle._markers = markers;
    handle._tileW = tileW;
    handle._tileH = tileH;

    return handle;
  },
```

Add a new `markersByTag` function to `_sbTilemaps`, after `tileAtInSet`:

```js
  // Searches every marker layer in the set at once (markers aren't
  // partitioned by which named layer they came from — that's a level-
  // authoring organization detail, not a query dimension). Reuses the exact
  // same ancestor-offset-walking technique tileAt already uses, so if the
  // TileMapSet's own .transform moves the whole map, returned positions move
  // with it, matching tileAt's existing offset contract.
  markersByTag(setHandle, tag) {
    let offsetX = 0;
    let offsetY = 0;
    let node = setHandle;
    while (node && node !== worldContainer && node !== hudContainer) {
      offsetX += node.x;
      offsetY += node.y;
      node = node.parent;
    }
    const results = [];
    for (const m of setHandle._markers) {
      if (m.tag !== tag) continue;
      results.push({
        x: offsetX + m.col * setHandle._tileW + setHandle._tileW / 2,
        y: offsetY + m.row * setHandle._tileH + setHandle._tileH / 2,
      });
    }
    return results;
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts`
Expected: PASS (all existing tests plus the new marker/markersByTag tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/tilemap.js tests/components/Runner/tilemap.test.ts
git commit -m "feat: engine support for tilemap marker layers and markersByTag query"
```

---

### Task 3: softBASIC — `Marker` class and `TileMapSet.markersByTag`

**Files:**
- Create: `src/lib/Basic4WebGL/defs/marker.bas`
- Modify: `src/lib/Basic4WebGL/defs/tilemapset.bas`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts` (this file already sets up `lib`/`files` via a `transpileWithTilemapset`-style helper reading `tilemapset.bas`/`tilemaplayer.bas`/`world.bas`/`transform.bas` — add `marker.bas` to that same `lib` array in this file's existing helper function, then add these tests):

```ts
// ─── markersByTag ───────────────────────────────────────────────────────────

describe('TileMapSet — markersByTag', () => {
  test('compiles without error', () => {
    const result = transpileWithTilemapset([
      'function test()',
      '  dim tm as TileMapSet',
      '  dim spawnPoints',
      '  spawnPoints = tm.markersByTag("spawn")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.markersByTag(', () => {
    const result = transpileWithTilemapset([
      'function test()',
      '  dim tm as TileMapSet',
      '  dim spawnPoints',
      '  spawnPoints = tm.markersByTag("spawn")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.markersByTag(');
  });
});

describe('Marker — field access', () => {
  test('m.x and m.y property access compiles without error', () => {
    const result = transpileWithTilemapset([
      'function test()',
      '  dim m as Marker',
      '  dim px',
      '  dim py',
      '  px = m.x',
      '  py = m.y',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

(If this test file's existing helper is named something other than `transpileWithTilemapset`, use the actual name already defined at the top of the file — the exact helper name doesn't matter, only that `marker.bas` is added to its `lib` array alongside the other already-included `.bas` sources, the same way `rayhit.bas` is added to `collision.test.ts`'s helper for `collision — RayHit property access`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`
Expected: FAIL — `markersByTag` is not a recognized method on `TileMapSet` (diagnostic), and `Marker` is not a recognized type (diagnostic).

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/Basic4WebGL/defs/marker.bas`:

```bas
Class
dim x
dim y
EndClass
```

Add a new method to `src/lib/Basic4WebGL/defs/tilemapset.bas`, after `tileAt`:

```bas
function markersByTag(tag)
    return call("_sb.markersByTag(this._handle, markersbytag_tag)")
endfunction
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`
Expected: PASS (all existing tests plus the 3 new ones)

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/marker.bas src/lib/Basic4WebGL/defs/tilemapset.bas tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts
git commit -m "feat: Marker class and TileMapSet.markersByTag softBASIC API"
```

---

### Task 4: Shared `usePaintDrag` hook, `Canvas.tsx` refactor

**Files:**
- Create: `src/components/TileMapEditor/usePaintDrag.ts`
- Test: `tests/ui/components/TileMapEditor/usePaintDrag.test.ts`
- Modify: `src/components/TileMapEditor/Canvas.tsx`

Extracts the drag-paint interaction (mouse-down starts painting, mouse-enter continues while painting, a window `mouseup` stops it) out of `Canvas.tsx` into a reusable hook, so the upcoming `MarkerCanvas.tsx` (Task 6) doesn't duplicate this state machine. `Canvas.tsx`'s external props and rendered output are unchanged — this is a pure internal refactor, verified by the existing `Canvas.test.tsx` passing unmodified.

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/TileMapEditor/usePaintDrag.test.ts`:

```ts
// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { usePaintDrag } from '../../../../src/components/TileMapEditor/usePaintDrag';

describe('usePaintDrag', () => {
  test('startPaint calls onPaintCell immediately', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.startPaint(0, 1));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
  });

  test('continuePaint does nothing before startPaint has been called', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.continuePaint(0, 1));
    expect(onPaintCell).not.toHaveBeenCalled();
  });

  test('continuePaint paints after startPaint has been called', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.startPaint(0, 0));
    act(() => result.current.continuePaint(0, 1));
    expect(onPaintCell).toHaveBeenCalledWith(0, 0);
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });

  test('a window mouseup event stops continuePaint from painting', () => {
    const onPaintCell = vi.fn();
    const { result } = renderHook(() => usePaintDrag(onPaintCell));
    act(() => result.current.startPaint(0, 0));
    act(() => { window.dispatchEvent(new Event('mouseup')); });
    act(() => result.current.continuePaint(0, 1));
    expect(onPaintCell).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/usePaintDrag.test.ts`
Expected: FAIL — `Cannot find module '../../../../src/components/TileMapEditor/usePaintDrag'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/TileMapEditor/usePaintDrag.ts`:

```ts
import { useEffect, useState } from 'react';

/** Shared drag-paint interaction for a grid of clickable cells: mouse-down
 * starts painting (and paints the cell under the cursor immediately),
 * mouse-enter continues painting while the button is held, and a window
 * `mouseup` stops it — even if the cursor has left the grid entirely. Used
 * by both the tile Canvas and the marker Canvas so this state machine isn't
 * duplicated between them. */
export function usePaintDrag(onPaintCell: (row: number, col: number) => void) {
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const stop = () => setIsPainting(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const startPaint = (row: number, col: number) => {
    setIsPainting(true);
    onPaintCell(row, col);
  };

  const continuePaint = (row: number, col: number) => {
    if (isPainting) onPaintCell(row, col);
  };

  return { startPaint, continuePaint };
}
```

Replace `src/components/TileMapEditor/Canvas.tsx` with:

```tsx
import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';

type Props = {
  layerData: number[][];
  /** slices[i] is the thumbnail for tile id (i + 1) */
  slices: string[];
  onPaintCell: (row: number, col: number) => void;
};

const TileMapCanvas: React.FC<Props> = ({ layerData, slices, onPaintCell }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);
  const cols = layerData[0]?.length ?? 0;

  return (
    <div className="h-full overflow-auto p-2">
      <div
        role="grid"
        aria-label="Tilemap canvas"
        style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
      >
        {layerData.map((rowData, row) =>
          rowData.map((tileId, col) => (
            <div
              key={`${row}-${col}`}
              role="gridcell"
              aria-label={`Row ${row}, Column ${col}`}
              onMouseDown={() => startPaint(row, col)}
              onMouseEnter={() => continuePaint(row, col)}
              className="border border-ds-border hover:ring-2 hover:ring-inset hover:ring-ds-accent"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundImage: tileId > 0 && slices[tileId - 1] ? `url(${slices[tileId - 1]})` : undefined,
                backgroundSize: 'cover',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TileMapCanvas;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/usePaintDrag.test.ts tests/ui/components/TileMapEditor/Canvas.test.tsx`
Expected: PASS — the 4 new `usePaintDrag` tests, and all 6 pre-existing `Canvas.test.tsx` tests unmodified and still passing (confirming the refactor is behavior-preserving).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/usePaintDrag.ts src/components/TileMapEditor/Canvas.tsx tests/ui/components/TileMapEditor/usePaintDrag.test.ts
git commit -m "refactor: extract shared drag-paint interaction into usePaintDrag hook"
```

---

### Task 5: `tagColor` utility

**Files:**
- Create: `src/components/TileMapEditor/tagColor.ts`
- Test: `tests/ui/components/TileMapEditor/tagColor.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/TileMapEditor/tagColor.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { tagColor } from '../../../../src/components/TileMapEditor/tagColor';

describe('tagColor', () => {
  test('returns the same color for the same tag every time', () => {
    expect(tagColor('spawn')).toBe(tagColor('spawn'));
  });

  test('returns different colors for two different tags', () => {
    expect(tagColor('spawn')).not.toBe(tagColor('pickup'));
  });

  test('returns a valid hsl() string', () => {
    expect(tagColor('spawn')).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
  });

  test('handles an empty string without throwing', () => {
    expect(() => tagColor('')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/tagColor.test.ts`
Expected: FAIL — `Cannot find module '../../../../src/components/TileMapEditor/tagColor'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/TileMapEditor/tagColor.ts`:

```ts
/** Deterministic tag -> CSS color, so the same tag always renders the same
 * color across the tag picker chips and the marker canvas. */
export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/tagColor.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/tagColor.ts tests/ui/components/TileMapEditor/tagColor.test.ts
git commit -m "feat: deterministic tag-to-color utility for marker rendering"
```

---

### Task 6: `MarkerCanvas` component

**Files:**
- Create: `src/components/TileMapEditor/MarkerCanvas.tsx`
- Test: `tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`

Renders and paints a marker layer's grid: a full-cell color tint (per-tag, via `tagColor`) with the tag's first letter centered, per the approved design. Takes explicit `rows`/`cols` (a marker layer has no dense array of its own to derive dimensions from — the caller, `index.tsx` in Task 9, derives these from the document's tile layers).

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import MarkerCanvas from '../../../../src/components/TileMapEditor/MarkerCanvas';

describe('MarkerCanvas', () => {
  test('renders a grid of the given rows/cols', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1, Column 1')).toBeInTheDocument();
  });

  test('a marked cell shows the tag\'s first letter, uppercased', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveTextContent('S');
  });

  test('an unmarked cell shows no letter', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toHaveTextContent('');
  });

  test('a marked cell carries its tag as the title attribute (hover tooltip)', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveAttribute('title', 'spawn');
  });

  test('mouse down paints a cell', () => {
    const onPaintCell = vi.fn();
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
  });

  test('drag (mouse down then enter another cell) paints both cells', () => {
    const onPaintCell = vi.fn();
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`
Expected: FAIL — `Cannot find module '../../../../src/components/TileMapEditor/MarkerCanvas'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/TileMapEditor/MarkerCanvas.tsx`:

```tsx
import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';
import { tagColor } from './tagColor';
import { MarkerEntry } from './types';

type Props = {
  rows: number;
  cols: number;
  markers: MarkerEntry[];
  onPaintCell: (row: number, col: number) => void;
};

const MarkerCanvas: React.FC<Props> = ({ rows, cols, markers, onPaintCell }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  const markerAt = (row: number, col: number) => markers.find((m) => m.row === row && m.col === col);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const marker = markerAt(row, col);
      cells.push(
        <div
          key={`${row}-${col}`}
          role="gridcell"
          aria-label={`Row ${row}, Column ${col}`}
          title={marker?.tag}
          onMouseDown={() => startPaint(row, col)}
          onMouseEnter={() => continuePaint(row, col)}
          className="border border-ds-border hover:ring-2 hover:ring-inset hover:ring-ds-accent flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: marker ? tagColor(marker.tag) : undefined,
          }}
        >
          {marker ? marker.tag.charAt(0).toUpperCase() : ''}
        </div>
      );
    }
  }

  return (
    <div className="h-full overflow-auto p-2">
      <div role="grid" aria-label="Marker canvas" style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}>
        {cells}
      </div>
    </div>
  );
};

export default MarkerCanvas;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/MarkerCanvas.tsx tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx
git commit -m "feat: MarkerCanvas component for painting tilemap markers"
```

---

### Task 7: `TagPicker` component

**Files:**
- Create: `src/components/TileMapEditor/TagPicker.tsx`
- Test: `tests/ui/components/TileMapEditor/TagPicker.test.tsx`

The marker-layer equivalent of `Palette.tsx`: an Eraser button, a chip per tag already in use, and a text input to type a brand-new tag (which becomes the "loaded" paint tool immediately — it doesn't need to be separately "registered," since a tag only persists in the file once a marker actually uses it).

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/TileMapEditor/TagPicker.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import TagPicker from '../../../../src/components/TileMapEditor/TagPicker';

describe('TagPicker', () => {
  test('renders a chip per tag', () => {
    render(<TagPicker tags={['spawn', 'pickup']} selectedTag={null} onSelectTag={vi.fn()} />);
    expect(screen.getByLabelText('Tag spawn')).toBeInTheDocument();
    expect(screen.getByLabelText('Tag pickup')).toBeInTheDocument();
  });

  test('clicking a chip selects that tag', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={['spawn']} selectedTag={null} onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByLabelText('Tag spawn'));
    expect(onSelectTag).toHaveBeenCalledWith('spawn');
  });

  test('clicking Eraser selects null', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={['spawn']} selectedTag="spawn" onSelectTag={onSelectTag} />);
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(onSelectTag).toHaveBeenCalledWith(null);
  });

  test('typing a new tag name and pressing Enter selects it', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={[]} selectedTag={null} onSelectTag={onSelectTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), 'boss_spawn{Enter}');
    expect(onSelectTag).toHaveBeenCalledWith('boss_spawn');
  });

  test('pressing Enter with an empty input does not select anything', async () => {
    const onSelectTag = vi.fn();
    render(<TagPicker tags={[]} selectedTag={null} onSelectTag={onSelectTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), '{Enter}');
    expect(onSelectTag).not.toHaveBeenCalled();
  });

  test('the selected tag chip is visually indicated via aria-pressed', () => {
    render(<TagPicker tags={['spawn']} selectedTag="spawn" onSelectTag={vi.fn()} />);
    expect(screen.getByLabelText('Tag spawn')).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: FAIL — `Cannot find module '../../../../src/components/TileMapEditor/TagPicker'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/TileMapEditor/TagPicker.tsx`:

```tsx
import React, { useState } from 'react';

type Props = {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
};

const TagPicker: React.FC<Props> = ({ tags, selectedTag, onSelectTag }) => {
  const [draftTag, setDraftTag] = useState('');

  const commitNewTag = () => {
    const trimmed = draftTag.trim();
    if (!trimmed) return;
    onSelectTag(trimmed);
    setDraftTag('');
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2 overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelectTag(null)}
        aria-label="Eraser"
        aria-pressed={selectedTag === null}
        className={`text-xs px-2 py-1 rounded border ${
          selectedTag === null
            ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
            : 'border-ds-border text-ds-text-muted hover:text-ds-text'
        }`}
      >
        Eraser
      </button>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(tag)}
            aria-label={`Tag ${tag}`}
            aria-pressed={selectedTag === tag}
            className={`px-2 py-1 rounded-full text-xs border ${
              selectedTag === tag
                ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                : 'border-ds-border text-ds-text-muted hover:text-ds-text'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={draftTag}
        onChange={(e) => setDraftTag(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commitNewTag(); }}
        placeholder="+ new tag name..."
        aria-label="New tag name"
        className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
      />
    </div>
  );
};

export default TagPicker;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/TagPicker.tsx tests/ui/components/TileMapEditor/TagPicker.test.tsx
git commit -m "feat: TagPicker component for selecting a marker tag to paint with"
```

---

### Task 8: `LayersPanel` — kind-aware layer creation and marker badge

**Files:**
- Modify: `src/components/TileMapEditor/LayersPanel.tsx`
- Modify: `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`

Adds two "add layer" buttons (tile vs. marker) in place of the single one, and a small badge on marker-layer list items so they're visually distinguishable from tile layers in the panel.

- [ ] **Step 1: Write the failing tests**

Append to `tests/ui/components/TileMapEditor/LayersPanel.test.tsx` (inside the existing `describe('LayersPanel', ...)` block, alongside the existing tests):

```tsx
  test('clicking "Add tile layer" calls onAdd with a unique default name and kind "tile"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add tile layer'));
    expect(onAdd).toHaveBeenCalledWith('layer3', 'tile');
  });

  test('clicking "Add marker layer" calls onAdd with a unique default name and kind "marker"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    expect(onAdd).toHaveBeenCalledWith('markers3', 'marker');
  });

  test('a marker layer shows a distinguishing badge in the list', () => {
    const layers: EditorLayer[] = [
      { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
      { key: 'k2', name: 'spawns', kind: 'marker', markers: [] },
    ];
    render(<LayersPanel layers={layers} activeIndex={0} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    expect(screen.getByText('tag')).toBeInTheDocument();
  });
```

Also update the existing (now-broken) test that referenced the old single button — find this test:

```tsx
  test('clicking + calls onAdd with a unique default name', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add layer'));
    expect(onAdd).toHaveBeenCalledWith('layer3');
  });
```

and delete it — it's superseded by the two new "Add tile layer"/"Add marker layer" tests above (the old single-button/single-arg `onAdd` behavior no longer exists).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: FAIL — `screen.getByLabelText('Add tile layer')` / `'Add marker layer'` not found (only the old `'Add layer'` button exists yet), and no `'tag'` badge text exists yet.

- [ ] **Step 3: Write the minimal implementation**

Replace `src/components/TileMapEditor/LayersPanel.tsx` with:

```tsx
// src/components/TileMapEditor/LayersPanel.tsx
import React, { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditorLayer } from './types';

type Props = {
  layers: EditorLayer[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: (name: string, kind: 'tile' | 'marker') => void;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

type ItemProps = {
  layer: EditorLayer;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
};

const SortableLayerItem: React.FC<ItemProps> = ({ layer, isActive, onSelect, onRename, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.key });
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(layer.name);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== layer.name) onRename(trimmed);
    setRenaming(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer ${
        isActive ? 'bg-ds-accent-subtle text-ds-accent' : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
      }`}
      onClick={onSelect}
    >
      <button
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
        tabIndex={-1}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0 mr-1"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      {layer.kind === 'marker' && (
        <span className="text-[9px] px-1 rounded bg-ds-surface-2 text-ds-text-dim uppercase tracking-wide mr-1 flex-shrink-0">
          tag
        </span>
      )}
      {renaming ? (
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') { setDraftName(layer.name); setRenaming(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-ds-bg border border-ds-border rounded px-1 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
        />
      ) : (
        <span
          className="truncate flex-1"
          onDoubleClick={(e) => { e.stopPropagation(); setDraftName(layer.name); setRenaming(true); }}
        >
          {layer.name}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
        aria-label={`Remove layer ${layer.name}`}
      >
        ×
      </button>
    </li>
  );
};

const LayersPanel: React.FC<Props> = ({ layers, activeIndex, onSelect, onAdd, onRename, onRemove, onReorder }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = layers.findIndex((l) => l.key === active.id);
    const toIndex = layers.findIndex((l) => l.key === over.id);
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex);
  };

  const handleAdd = (kind: 'tile' | 'marker') => {
    const prefix = kind === 'tile' ? 'layer' : 'markers';
    let n = 1;
    let name = `${prefix}${layers.length + n}`;
    while (layers.some((l) => l.name === name)) { n += 1; name = `${prefix}${layers.length + n}`; }
    onAdd(name, kind);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Layers</span>
        <div className="flex gap-1">
          <button
            onClick={() => handleAdd('tile')}
            aria-label="Add tile layer"
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none px-1"
          >
            +
          </button>
          <button
            onClick={() => handleAdd('marker')}
            aria-label="Add marker layer"
            className="text-ds-text-muted hover:text-ds-text transition text-[10px] leading-none px-1 border border-ds-border rounded"
          >
            +tag
          </button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map((l) => l.key)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5">
            {layers.map((layer, index) => (
              <SortableLayerItem
                key={layer.key}
                layer={layer}
                isActive={index === activeIndex}
                onSelect={() => onSelect(index)}
                onRename={(name) => onRename(index, name)}
                onRemove={() => onRemove(index)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LayersPanel;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: PASS — all pre-existing tests (minus the deleted one) plus the 3 new tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/LayersPanel.tsx tests/ui/components/TileMapEditor/LayersPanel.test.tsx
git commit -m "feat: kind-aware layer creation and marker badge in LayersPanel"
```

---

### Task 9: `index.tsx` — wire markers end-to-end

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx`
- Modify: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

The integration task: paints of marker layers actually work, the sidebar and canvas swap between tile/marker views based on the active layer's kind, and saving round-trips correctly through `encodeStmContent`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`, after the existing `describe('TileMapEditor', ...)` block:

```tsx
describe('TileMapEditor — marker layers', () => {
  test('adding a marker layer and painting a tag saves it in the new format', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] });
  });

  test('adding a marker layer does not disturb existing tile layer data on save', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });

  test('switching to a marker layer shows the tag picker instead of the tile palette', async () => {
    renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    expect(screen.getByLabelText('New tag name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tile 1')).not.toBeInTheDocument();
  });

  test('switching back to a tile layer shows the tile palette again', async () => {
    renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.click(screen.getByText('background'));
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.queryByLabelText('New tag name')).not.toBeInTheDocument();
  });

  test('placing an eraser click on an already-marked cell removes the marker', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByLabelText('Eraser'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [] });
  });

  test('placing a second marker on an already-marked cell replaces the tag', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'pickup{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [{ row: 0, col: 1, tag: 'pickup' }] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: FAIL — `screen.getByLabelText('Add marker layer')` not found (the panel exists from Task 8, but `index.tsx` doesn't pass a kind-aware `onAdd` yet, and there's no `TagPicker`/`MarkerCanvas` swap wired in yet).

- [ ] **Step 3: Write the minimal implementation**

Replace `src/components/TileMapEditor/index.tsx` with:

```tsx
// src/components/TileMapEditor/index.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch, RootState } from '../../store';
import { useTilesetSlices } from './useTilesetSlices';
import Palette from './Palette';
import TileMapCanvas from './Canvas';
import MarkerCanvas from './MarkerCanvas';
import TagPicker from './TagPicker';
import LayersPanel from './LayersPanel';
import { StmDoc, EditorLayer, MarkerEntry } from './types';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

type StmLayerValue = number[][] | { type: 'markers'; markers: MarkerEntry[] };

export function decodeStmContent(content: string): StmDoc {
  const comma = content.indexOf(',');
  const raw = comma === -1 ? '{}' : decodeURIComponent(escape(atob(content.slice(comma + 1))));
  let parsed: { tileWidth?: number; tileHeight?: number; tileImage?: string; layers?: Record<string, StmLayerValue> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const layerEntries = Object.entries(parsed.layers ?? {});
  return {
    tileWidth: parsed.tileWidth ?? 16,
    tileHeight: parsed.tileHeight ?? 16,
    tileImage: parsed.tileImage ?? '',
    layers: layerEntries.map(([name, value]): EditorLayer =>
      Array.isArray(value)
        ? { key: crypto.randomUUID(), name, kind: 'tile', data: value }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers }
    ),
  };
}

export function encodeStmContent(doc: StmDoc, originalContent: string): string {
  const mime = originalContent.startsWith('data:')
    ? originalContent.slice(5, originalContent.indexOf(';'))
    : 'application/json';
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    layers[l.name] = l.kind === 'tile' ? l.data : { type: 'markers', markers: l.markers };
  });
  const json = JSON.stringify({
    tileWidth: doc.tileWidth,
    tileHeight: doc.tileHeight,
    tileImage: doc.tileImage,
    layers,
  });
  return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(json)));
}

const TileMapEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [draftDoc, setDraftDoc] = useState<StmDoc>(() => decodeStmContent(asset.content));
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<number | null>(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setDraftDoc(decodeStmContent(asset.content));
    setActiveIndex(0);
    setIsDirty(false);
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tilesetAsset = useSelector((state: RootState) =>
    Object.values(state.assets.byId).find(
      (a) => a.projectId === asset.projectId && a.name === draftDoc.tileImage
    )
  );

  const { slices } = useTilesetSlices(tilesetAsset?.content, draftDoc.tileWidth, draftDoc.tileHeight);

  useEffect(() => {
    onDirtyChange?.(asset.id, isDirty);
  }, [isDirty, asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLayer = draftDoc.layers[activeIndex];

  // A marker layer has no dense array of its own to derive grid dimensions
  // from — every layer in a document is assumed to share one grid size, so
  // fall back to the first tile layer present (the same assumption
  // handleAddLayer already relied on implicitly before this feature).
  const firstTileLayer = draftDoc.layers.find(
    (l): l is Extract<EditorLayer, { kind: 'tile' }> => l.kind === 'tile'
  );
  const gridRows = firstTileLayer?.data.length ?? 1;
  const gridCols = firstTileLayer?.data[0]?.length ?? 1;

  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer) return;
    if (activeLayer.kind === 'tile') {
      const tileId = selectedTile ?? 0;
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'tile') return l;
          const newData = l.data.map((r) => r.slice());
          newData[row][col] = tileId;
          return { ...l, data: newData };
        }),
      }));
    } else {
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'marker') return l;
          const withoutCell = l.markers.filter((m) => !(m.row === row && m.col === col));
          const newMarkers = selectedTag ? [...withoutCell, { row, col, tag: selectedTag }] : withoutCell;
          return { ...l, markers: newMarkers };
        }),
      }));
    }
    setIsDirty(true);
  };

  const handleAddLayer = (name: string, kind: 'tile' | 'marker') => {
    const newLayer: EditorLayer =
      kind === 'tile'
        ? {
            key: crypto.randomUUID(),
            name,
            kind: 'tile',
            data: Array.from({ length: gridRows }, () => Array.from({ length: gridCols }, () => 0)),
          }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: [] };
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
  };

  const handleRenameLayer = (index: number, name: string) => {
    setDraftDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => (i === index ? { ...l, name } : l)),
    }));
  };

  const handleRemoveLayer = (index: number) => {
    setDraftDoc((prev) => ({ ...prev, layers: prev.layers.filter((_, i) => i !== index) }));
    setActiveIndex((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  const handleReorderLayers = (fromIndex: number, toIndex: number) => {
    setDraftDoc((prev) => {
      const layers = prev.layers.slice();
      const [moved] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, moved);
      return { ...prev, layers };
    });
    setActiveIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  };

  const handleSave = () => {
    dispatch(updateAsset({ ...asset, content: encodeStmContent(draftDoc, asset.content) }));
    setIsDirty(false);
  };

  // The currently-selected tag is always shown as a chip even before any
  // marker uses it yet, so picking/typing a tag gives immediate visual
  // confirmation of what's "loaded" to paint with.
  const markerTags =
    activeLayer?.kind === 'marker'
      ? Array.from(new Set([...activeLayer.markers.map((m) => m.tag), ...(selectedTag ? [selectedTag] : [])]))
      : [];

  return (
    <div className="flex h-full">
      <div className="w-40 flex-shrink-0 border-r border-ds-border">
        {activeLayer?.kind === 'marker' ? (
          <TagPicker tags={markerTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        ) : (
          <Palette slices={slices} selectedTile={selectedTile} onSelectTile={setSelectedTile} />
        )}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-end p-2 border-b border-ds-border">
          <button
            type="button"
            disabled={!isDirty}
            onClick={handleSave}
            className="bg-accent-gradient text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {activeLayer?.kind === 'marker' ? (
            <MarkerCanvas rows={gridRows} cols={gridCols} markers={activeLayer.markers} onPaintCell={handlePaintCell} />
          ) : (
            <TileMapCanvas layerData={activeLayer?.kind === 'tile' ? activeLayer.data : []} slices={slices} onPaintCell={handlePaintCell} />
          )}
        </div>
      </div>
      <div className="w-48 flex-shrink-0 border-l border-ds-border">
        <LayersPanel
          layers={draftDoc.layers}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={handleAddLayer}
          onRename={handleRenameLayer}
          onRemove={handleRemoveLayer}
          onReorder={handleReorderLayers}
        />
      </div>
    </div>
  );
};

export default TileMapEditor;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — all pre-existing tests plus the 6 new marker-layer integration tests.

Also run the full `TileMapEditor` directory once, since this task's changes touch the component every other file in the tree depends on:

Run: `npx vitest run tests/ui/components/TileMapEditor/`
Expected: PASS (no regressions in `Canvas`, `LayersPanel`, `MarkerCanvas`, `NewTilemapDialog`, `Palette`, `TagPicker`, `tagColor`, `stmCodec`, `usePaintDrag`, `useTilesetSlices`, `TilemapChooserModal`)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "feat: wire marker layers end-to-end in the Tilemap Editor"
```

---

### Task 10: API reference docs

**Files:**
- Modify: `src/docs/api-reference/tilemapset.md`

- [ ] **Step 1: Add the `markersByTag` section**

In `src/docs/api-reference/tilemapset.md`, add a new `##` section after the existing `tileAt(name, x, y)` section (matching the file's established per-function structure: description, parameter table, `**Returns:**` line, `.bas` example using a game-like scenario):

```markdown
## markersByTag(tag)

Finds every marker with the given tag, painted anywhere in this tilemap using the Tilemap Editor's marker tool. Useful for placing things like enemy spawn points or item pickups visually while designing a level, instead of hardcoding their positions in code.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| tag       | string | The tag to search for |

**Returns:** Array of `Marker` objects. Returns an empty array (length 0) if no marker has that tag.

Each `Marker` has two properties:

| Property | Type   | Description |
|----------|--------|-------------|
| x        | number | World x position of the marker |
| y        | number | World y position of the marker |

```bas
dim spawnPoints = tileMapSet.markersByTag("spawn")
dim i
for i = 0 to array.arrLength(spawnPoints) - 1
  dim point as Marker
  point = spawnPoints(i)
  dim enemy = new Enemy(point.x, point.y)
  world.add(enemy)
next i
```
```

- [ ] **Step 2: Verify the docs build**

Run: `npx vite build`
Expected: build succeeds (catches a markdown-loading mistake, the same way it would for any other docs page)

- [ ] **Step 3: Commit**

```bash
git add src/docs/api-reference/tilemapset.md
git commit -m "docs: add markersByTag API reference section"
```

**Note on the design spec's "placing markers" end-user section:** the design spec called for "a short 'placing markers' section added wherever the Tilemap Editor is documented for end users." Confirmed during planning (and re-confirmed here): no such page exists — there is no language-guide or tutorial page documenting the Tilemap Editor UI at all today, for tile painting or anything else. Adding one from scratch is a separate, much larger documentation project (the whole editor UI, not just markers) and out of scope for this plan. Skipped deliberately, not silently — if an editor-usage guide is written later, it should cover markers alongside tile painting/layers at that point.

---

### Task 11: Roadmap sync

**Files:**
- Modify: `docs/language/library-roadmap.md`
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Update the module table row**

In `docs/language/library-roadmap.md`'s "Existing modules" table, replace the `TileMapSet` row:

```markdown
| `TileMapSet` *(class)* | `constructor(stmPath)` — loads a multi-layer `.stm` file (does not render on its own — call `world.add(tm)`, same as `Sprite`/`TileMap`); `layer(name)` returns the named layer as a `TileMapLayer`; `tileAt(name,x,y)` looks up a layer and queries it in one call; `markersByTag(tag)` returns every `Marker` painted with that tag anywhere in the set, as an array of `{x,y}` positions; `transform` moves every layer together as one unit and is correctly accounted for by `tileAt`/`markersByTag` on either the set or an individual layer |
```

- [ ] **Step 2: Add a Priorities write-up entry**

Under `## Priorities`, after the `~~P13 — Pathfinding~~` entry, add:

```markdown
### ~~P14 — Tilemap markers~~ **[DONE]**
Shipped as a new `.stm` layer kind (`{ type: "markers", markers: [{row, col, tag}] }`, additive and fully backward-compatible with every existing bare-array tile layer) plus a new `TileMapSet.markersByTag(tag)` query and `Marker` class (`marker.bas`, mirroring `rayhit`'s existing bare-data-class pattern). Built to unblock the upcoming bullet-hell shooter demo's mob-spawn-point and weapon-pickup-point level authoring — the whole point is that a level designer places these visually in the Tilemap Editor rather than scanning tile IDs by convention or hardcoding coordinates in `.bas` files.

A marker layer never renders (`createTileMapSet` skips it entirely in the sprite-placement loop) and isn't wrapped in a `TileMapLayer`-style class, since markers aren't tile-lookup-shaped — `markersByTag` searches across every marker layer in the set at once, not scoped to one named layer, keeping the softBASIC-facing API to a single new method. Marker positions correctly account for the `TileMapSet`'s own `.transform` offset, reusing the same ancestor-walk `tileAt` already uses.

The Tilemap Editor's `EditorLayer` type became a discriminated union (`kind: 'tile' | 'marker'`) so marker layers show up in the existing Layers panel — same add/rename/remove/reorder UI, no new panel built from scratch. A new `MarkerCanvas`/`TagPicker` component pair swaps in for the tile `Canvas`/`Palette` when a marker layer is active (full-cell colour tint per tag, chip-list tag picker with a free-text new-tag input); both canvases now share a `usePaintDrag` hook rather than duplicating the drag-paint interaction.

This is a deliberate, scoped re-opening of the tile-metadata non-goal recorded when `TileMapSet` and the Tilemap Editor originally shipped (Milestone 12) — "`.stm` stores tile IDs only" / "no tile-property metadata" — not a silent scope change.

**Not built:** per-marker structured data beyond the tag string (no key/value payloads); marker-layer-scoped queries (`markersByTag` always searches the whole set); runtime marker mutation (markers are level-authoring-time data baked into the `.stm` file, not a live game-state concept — a game tracking "this spawn point is destroyed" does so in its own game logic).

Design spec: `docs/superpowers/specs/2026-08-10-tilemap-markers-design.md`. Tests: `tests/components/Runner/tilemap.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`, `tests/ui/components/TileMapEditor/` (`stmCodec`, `usePaintDrag`, `tagColor`, `MarkerCanvas`, `TagPicker`, `LayersPanel`, `TileMapEditor`). Docs: `src/docs/api-reference/tilemapset.md`.
```

- [ ] **Step 3: Add a "Current state" bullet**

In `docs/roadmap.md`, append this bullet immediately after the existing `pathfinding` module bullet (and immediately before the blank line + `Known deferred issues (low risk, not currently scheduled):` heading):

```markdown
- Tilemap markers — tagged position markers paintable in the Tilemap Editor (a new marker layer kind, alongside ordinary tile layers) and queryable at runtime via `tileMapSet.markersByTag(tag)`. A deliberate, scoped re-opening of the "no tile-property metadata" non-goal recorded when the Tilemap Editor originally shipped (Milestone 12), driven by the upcoming bullet-hell shooter demo's need to place mob-spawn/weapon-pickup points visually rather than hardcoding coordinates (shipped 2026-08-10, see `docs/language/library-roadmap.md` P14). Design: `docs/superpowers/specs/2026-08-10-tilemap-markers-design.md`.
```

- [ ] **Step 4: Check the public-facing roadmap for anything needing an update**

Read `src/docs/roadmap.md` (distinct from the internal `docs/roadmap.md` just edited above). This is milestone-level narrative aimed at end users, not a changelog of individual library additions — confirmed during design that comparable recent library-level additions (`oninit`, `setPixelPerfect`, `camera.setZoom`, `pathfinding`) never warranted an entry there, only whole new in-app tools did (e.g. "a visual tilemap editor landed" for Milestone 12 itself). Tilemap markers is an enhancement to that existing editor, not a new tool of its own, so it follows the same pattern. Confirm no bullet under "What just shipped" makes a claim that's now inaccurate (e.g. nothing there currently describes the Tilemap Editor's capabilities in enough detail to be contradicted by adding markers), and leave the file unchanged. No commit needed for this step — it's a verification, not a change.

- [ ] **Step 5: Commit**

```bash
git add docs/language/library-roadmap.md docs/roadmap.md
git commit -m "docs: roadmap sync for tilemap markers"
```

---

### Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — every test file in the repo, including all new/modified files from this plan, with zero failures.

- [ ] **Step 2: Run the build**

Run: `npx vite build`
Expected: build succeeds with no errors (per `CLAUDE.md`, this is the project's standard verification command).

- [ ] **Step 3: Manual smoke check (optional but recommended before considering this done)**

There's no automated end-to-end (Cypress) coverage for the Tilemap Editor's UI at all today (confirmed — only `.bas`-compiling-and-running demos get Cypress coverage, not editor-only features), so this is the only way to see the whole feature actually working together in the app. Open the app, open or create a `.stm` tilemap asset, and confirm:

1. Clicking "+tag" adds a new marker layer, shown in the Layers panel with a "tag" badge.
2. Selecting the marker layer swaps the sidebar to the tag picker and the canvas to the marker grid.
3. Typing a new tag name and pressing Enter, then clicking a cell, paints that cell with the tag's colour and first letter.
4. Switching back to a tile layer restores the tile palette and tile canvas, with the tile art unchanged.
5. Saving and reopening the asset preserves the painted markers.

No commit for this task — it's a checkpoint, not a change.
