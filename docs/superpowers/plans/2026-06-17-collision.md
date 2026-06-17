# Collision Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `collision` module to softGfx with six functions (spriteCollide, boxCollide, circleCollide, pointInBox, raycast, raycastAll) plus a `RayHit` class for raycast results, and keep `gfx.boxCollide` as a permanent backward-compatible alias.

**Architecture:** The module follows the same IIFE pattern as all other engine modules — `collision.js` exports `_sbCollision` which is spread into `_sb` in `softBasicEngine.js`. The softBASIC API surface is defined in `collision.bas` (module functions) and `rayhit.bas` (class shape for RayHit). Raycast uses slab intersection against each sprite's PIXI bounding box. The existing `boxCollide` function in `sprites.js` is removed; `gfx.bas` is updated to delegate to `_sb.spriteCollide` instead.

**Tech Stack:** TypeScript/Vitest (tests), vanilla JS (engine IIFE), softBASIC .bas defs, Markdown (docs)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts` | Transpiler tests for all 6 functions + backward compat |
| Create | `src/lib/Basic4WebGL/defs/collision.bas` | softBASIC module def — 6 functions |
| Create | `src/lib/Basic4WebGL/defs/rayhit.bas` | softBASIC class def — declares `sprite` and `distance` fields |
| Create | `src/components/Runner/engine/collision.js` | `_sbCollision` IIFE — all collision logic |
| Modify | `src/components/Runner/softBasicEngine.js` | Spread `..._sbCollision` into `_sb` |
| Modify | `src/components/Runner/index.tsx` | Import `collision.js?raw`, add to srcDoc concat |
| Modify | `src/constants/packageModules.ts` | Import and register `collision` and `RayHit` defs |
| Modify | `src/lib/Basic4WebGL/defs/gfx.bas` | Update `boxCollide` to call `_sb.spriteCollide` |
| Modify | `src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts` | Update `boxCollide` returns to `_sb.spriteCollide` |
| Modify | `src/components/Runner/engine/sprites.js` | Remove `boxCollide` (now dead code) |
| Create | `src/docs/api-reference/collision.md` | API reference page |
| Modify | `src/docs/manifest.ts` | Add collision page to softGfx group |

---

### Task 1: Failing transpiler tests

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`

- [ ] **Step 1: Write the failing test file**

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const collisionSource = readFileSync('src/lib/Basic4WebGL/defs/collision.bas', 'utf-8');
const gfxSource = readFileSync('src/lib/Basic4WebGL/defs/gfx.bas', 'utf-8');

const transpileWithCollision = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'collision', source: collisionSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithGfx = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'gfx', source: gfxSource }],
    files: [{ name: 'Main.bas', source }],
  });

// ─── spriteCollide ────────────────────────────────────────────────────────────

describe('collision — spriteCollide', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = collision.spriteCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.spriteCollide(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = collision.spriteCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.spriteCollide(');
  });
});

// ─── boxCollide ───────────────────────────────────────────────────────────────

describe('collision — boxCollide', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim hit',
      '  hit = collision.boxCollide(10, 20, 32, 48, 50, 60, 40, 40)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.boxCollide(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim hit',
      '  hit = collision.boxCollide(10, 20, 32, 48, 50, 60, 40, 40)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.boxCollide(');
  });
});

// ─── circleCollide ────────────────────────────────────────────────────────────

describe('collision — circleCollide', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim coin',
      '  dim player',
      '  dim hit',
      '  hit = collision.circleCollide(coin, 12, player, 20)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.circleCollide(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim coin',
      '  dim player',
      '  dim hit',
      '  hit = collision.circleCollide(coin, 12, player, 20)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.circleCollide(');
  });
});

// ─── pointInBox ───────────────────────────────────────────────────────────────

describe('collision — pointInBox', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim btn',
      '  dim hit',
      '  hit = collision.pointInBox(100, 200, btn)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.pointInBox(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim btn',
      '  dim hit',
      '  hit = collision.pointInBox(100, 200, btn)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.pointInBox(');
  });
});

// ─── raycast ─────────────────────────────────────────────────────────────────

describe('collision — raycast', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hit',
      '  hit = collision.raycast(100, 200, 90, 300, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.raycast(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hit',
      '  hit = collision.raycast(100, 200, 90, 300, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.raycast(');
  });
});

// ─── raycastAll ───────────────────────────────────────────────────────────────

describe('collision — raycastAll', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hits',
      '  hits = collision.raycastAll(100, 200, 45, 400, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.raycastAll(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim enemies',
      '  dim hits',
      '  hits = collision.raycastAll(100, 200, 45, 400, enemies)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.raycastAll(');
  });
});

// ─── RayHit property access ───────────────────────────────────────────────────

describe('collision — RayHit property access', () => {
  test('h.distance property access compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim hits',
      '  dim h',
      '  h = hits(0)',
      '  dim d',
      '  d = h.distance',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('h.sprite property access compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim hits',
      '  dim h',
      '  h = hits(0)',
      '  dim s',
      '  s = h.sprite',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── gfx.boxCollide backward compat ──────────────────────────────────────────

describe('gfx — boxCollide backward compat', () => {
  test('compiles without error', () => {
    const result = transpileWithGfx([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = gfx.boxCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.spriteCollide( (not _sb.boxCollide)', () => {
    const result = transpileWithGfx([
      'function test()',
      '  dim a',
      '  dim b',
      '  dim hit',
      '  hit = gfx.boxCollide(a, b)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.spriteCollide(');
    expect(result.code).not.toContain('_sb.boxCollide(');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts
```

Expected: FAIL — `collision.bas` does not exist yet. Tests for backward compat will also fail once gfx.bas is updated.

- [ ] **Step 3: Commit the failing tests**

```
git add tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts
git commit -m "test: add failing transpiler tests for collision module"
```

---

### Task 2: collision.bas — module definition

**Files:**
- Create: `src/lib/Basic4WebGL/defs/collision.bas`

- [ ] **Step 1: Write collision.bas**

Parameter mangling follows the rule: `lowercasefunctionname_paramname`.

```bas
function spriteCollide(a, b)
    return call("_sb.spriteCollide(spritecollide_a, spritecollide_b)")
endfunction

function boxCollide(x1, y1, w1, h1, x2, y2, w2, h2)
    return call("_sb.boxCollide(boxcollide_x1, boxcollide_y1, boxcollide_w1, boxcollide_h1, boxcollide_x2, boxcollide_y2, boxcollide_w2, boxcollide_h2)")
endfunction

function circleCollide(a, radiusA, b, radiusB)
    return call("_sb.circleCollide(circlecollide_a, circlecollide_radiusA, circlecollide_b, circlecollide_radiusB)")
endfunction

function pointInBox(x, y, sprite)
    return call("_sb.pointInBox(pointinbox_x, pointinbox_y, pointinbox_sprite)")
endfunction

function raycast(x, y, angle, distance, sprites)
    return call("_sb.raycast(raycast_x, raycast_y, raycast_angle, raycast_distance, raycast_sprites)")
endfunction

function raycastAll(x, y, angle, distance, sprites)
    return call("_sb.raycastAll(raycastall_x, raycastall_y, raycastall_angle, raycastall_distance, raycastall_sprites)")
endfunction
```

- [ ] **Step 2: Run the collision.test.ts — verify spriteCollide, boxCollide, circleCollide, pointInBox, raycast, raycastAll tests now pass (RayHit property access and gfx backward compat tests may still fail)**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts
```

Expected: spriteCollide, boxCollide, circleCollide, pointInBox, raycast, raycastAll test groups pass. gfx backward compat tests still fail (gfx.bas not updated yet).

- [ ] **Step 3: Commit**

```
git add src/lib/Basic4WebGL/defs/collision.bas
git commit -m "feat: add collision.bas module definition"
```

---

### Task 3: rayhit.bas — class definition

**Files:**
- Create: `src/lib/Basic4WebGL/defs/rayhit.bas`

The `RayHit` class is never instantiated by users — the engine fabricates plain JS objects `{ sprite, distance }`. The class def declares the field shapes so the compiler recognises property access.

- [ ] **Step 1: Write rayhit.bas**

```bas
Class
dim sprite
dim distance
EndClass
```

- [ ] **Step 2: Run the full test suite to make sure nothing is broken**

```
npx vitest run
```

Expected: All tests that were passing before still pass. No new failures.

- [ ] **Step 3: Commit**

```
git add src/lib/Basic4WebGL/defs/rayhit.bas
git commit -m "feat: add rayhit.bas class definition for RayHit result type"
```

---

### Task 4: collision.js — engine module

**Files:**
- Create: `src/components/Runner/engine/collision.js`

- [ ] **Step 1: Write collision.js**

Uses the same IIFE pattern as all other engine modules. PIXI bounds objects use `.x`, `.y`, `.width`, `.height` (matching the existing `boxCollide` implementation in sprites.js).

```js
const _sbCollision = (() => {
  function _slabTest(ox, oy, dx, dy, b, maxDist) {
    const left = b.x;
    const right = b.x + b.width;
    const top = b.y;
    const bottom = b.y + b.height;

    let tMin = 0;
    let tMax = maxDist;

    if (Math.abs(dx) < 1e-10) {
      if (ox < left || ox > right) return null;
    } else {
      const tx1 = (left - ox) / dx;
      const tx2 = (right - ox) / dx;
      tMin = Math.max(tMin, Math.min(tx1, tx2));
      tMax = Math.min(tMax, Math.max(tx1, tx2));
    }

    if (Math.abs(dy) < 1e-10) {
      if (oy < top || oy > bottom) return null;
    } else {
      const ty1 = (top - oy) / dy;
      const ty2 = (bottom - oy) / dy;
      tMin = Math.max(tMin, Math.min(ty1, ty2));
      tMax = Math.min(tMax, Math.max(ty1, ty2));
    }

    return tMin <= tMax ? tMin : null;
  }

  return {
    spriteCollide(a, b) {
      const ab = a._handle.getBounds();
      const bb = b._handle.getBounds();
      return (
        ab.x + ab.width > bb.x &&
        ab.x < bb.x + bb.width &&
        ab.y + ab.height > bb.y &&
        ab.y < bb.y + bb.height
      );
    },

    boxCollide(x1, y1, w1, h1, x2, y2, w2, h2) {
      const l1 = Number(x1) - Number(w1) / 2;
      const r1 = Number(x1) + Number(w1) / 2;
      const t1 = Number(y1) - Number(h1) / 2;
      const b1 = Number(y1) + Number(h1) / 2;
      const l2 = Number(x2) - Number(w2) / 2;
      const r2 = Number(x2) + Number(w2) / 2;
      const t2 = Number(y2) - Number(h2) / 2;
      const b2 = Number(y2) + Number(h2) / 2;
      return !(r1 < l2 || l1 > r2 || b1 < t2 || t1 > b2);
    },

    circleCollide(a, rA, b, rB) {
      const ax = a._handle.position.x;
      const ay = a._handle.position.y;
      const bx = b._handle.position.x;
      const by = b._handle.position.y;
      const dx = ax - bx;
      const dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy) < (Number(rA) + Number(rB));
    },

    pointInBox(x, y, sprite) {
      const b = sprite._handle.getBounds();
      return (
        Number(x) >= b.x &&
        Number(x) <= b.x + b.width &&
        Number(y) >= b.y &&
        Number(y) <= b.y + b.height
      );
    },

    raycast(x, y, angle, dist, sprites) {
      const ox = Number(x);
      const oy = Number(y);
      const rad = Number(angle) * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const maxDist = Number(dist);

      let nearest = null;
      let nearestT = Infinity;

      for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        if (!sprite || !sprite._handle) continue;
        const b = sprite._handle.getBounds();
        const t = _slabTest(ox, oy, dx, dy, b, maxDist);
        if (t !== null && t < nearestT) {
          nearestT = t;
          nearest = sprite;
        }
      }

      return nearest !== null ? nearest : false;
    },

    raycastAll(x, y, angle, dist, sprites) {
      const ox = Number(x);
      const oy = Number(y);
      const rad = Number(angle) * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const maxDist = Number(dist);

      const hits = [];

      for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        if (!sprite || !sprite._handle) continue;
        const b = sprite._handle.getBounds();
        const t = _slabTest(ox, oy, dx, dy, b, maxDist);
        if (t !== null) {
          hits.push({ sprite, distance: t });
        }
      }

      hits.sort((a, b) => a.distance - b.distance);
      return hits;
    },
  };
})();
```

- [ ] **Step 2: Run full tests to make sure no regressions**

```
npx vitest run
```

Expected: All currently passing tests still pass. collision.test.ts still fails for backward compat.

- [ ] **Step 3: Commit**

```
git add src/components/Runner/engine/collision.js
git commit -m "feat: add collision.js engine module"
```

---

### Task 5: Wire collision engine into runner

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/index.tsx`
- Modify: `src/constants/packageModules.ts`

- [ ] **Step 1: Update softBasicEngine.js — add `..._sbCollision`**

Current content of `src/components/Runner/softBasicEngine.js` (first 11 lines):
```js
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
};
```

Replace with:
```js
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
};
```

- [ ] **Step 2: Update index.tsx — import sbCollision and add to concat array**

Current imports section (lines 1–12 of `src/components/Runner/index.tsx`):
```tsx
import React from 'react';
import sbLifecycle from './engine/lifecycle.js?raw';
import sbInput from './engine/input.js?raw';
import sbAssets from './engine/assets.js?raw';
import sbAudio from './engine/audio.js?raw';
import sbDrawing from './engine/drawing.js?raw';
import sbStage from './engine/stage.js?raw';
import sbSprites from './engine/sprites.js?raw';
import sbAnimatedSprites from './engine/animatedSprite.js?raw';
import sbTilemaps from './engine/tilemap.js?raw';
import softBasicEngine from './softBasicEngine.js?raw';
import bootstrapper from './bootstrapper.html?raw';
```

Add `import sbCollision from './engine/collision.js?raw';` after the `sbTilemaps` import.

Current srcDoc concat array (line 36):
```tsx
[sbLifecycle, sbInput, sbAssets, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, softBasicEngine].join('\n')
```

Replace with:
```tsx
[sbLifecycle, sbInput, sbAssets, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, softBasicEngine].join('\n')
```

- [ ] **Step 3: Update packageModules.ts — import and register collision and RayHit**

Add after the `audio` import:
```ts
import collision from '../lib/Basic4WebGL/defs/collision.bas?raw';
import RayHit from '../lib/Basic4WebGL/defs/rayhit.bas?raw';
```

Add `collision` and `RayHit` to the `packageModules` object after `audio`:
```ts
export const packageModules: Record<string, string> = {
  math,
  string,
  array,
  gfx,
  input,
  drawing,
  stage,
  pen,
  text,
  assetmanager,
  ObjectTransform,
  sprite,
  animatedsprite,
  tilemap,
  audio,
  collision,
  RayHit,
};
```

- [ ] **Step 4: Run full tests**

```
npx vitest run
```

Expected: All tests still passing.

- [ ] **Step 5: Commit**

```
git add src/components/Runner/softBasicEngine.js src/components/Runner/index.tsx src/constants/packageModules.ts
git commit -m "feat: wire collision engine module into runner and package registry"
```

---

### Task 6: Backward compat — update gfx and remove dead code

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/gfx.bas`
- Modify: `src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts`
- Modify: `src/components/Runner/engine/sprites.js`

- [ ] **Step 1: Update gfx.bas — delegate to _sb.spriteCollide**

Current `src/lib/Basic4WebGL/defs/gfx.bas`:
```bas
function boxCollide(a, b)
    return call("_sb.boxCollide(boxcollide_a, boxcollide_b)")
endfunction
```

Replace with:
```bas
function boxCollide(a, b)
    return call("_sb.spriteCollide(boxcollide_a, boxcollide_b)")
endfunction
```

- [ ] **Step 2: Update gfx.descriptor.ts — returns now calls _sb.spriteCollide**

Current `src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts`:
```ts
{
  name: 'boxCollide',
  params: ['a', 'b'],
  returns: (p, _self) => `_sb.boxCollide(${p.a}, ${p.b})`,
},
```

Replace `_sb.boxCollide` with `_sb.spriteCollide`:
```ts
{
  name: 'boxCollide',
  params: ['a', 'b'],
  returns: (p, _self) => `_sb.spriteCollide(${p.a}, ${p.b})`,
},
```

- [ ] **Step 3: Remove boxCollide from sprites.js**

In `src/components/Runner/engine/sprites.js`, locate and remove lines 66–75:
```js
  boxCollide(a, b) {
    const ab = a._handle.getBounds();
    const bb = b._handle.getBounds();
    return (
      ab.x + ab.width > bb.x &&
      ab.x < bb.x + bb.width &&
      ab.y + ab.height > bb.y &&
      ab.y < bb.y + bb.height
    );
  },
```

This function is now dead code — `_sb.spriteCollide` in `_sbCollision` has the same logic.

- [ ] **Step 4: Run the full test suite — all collision.test.ts tests should now pass**

```
npx vitest run
```

Expected: All tests pass. The `gfx — boxCollide backward compat` group now passes because `gfx.bas` emits `_sb.spriteCollide`.

- [ ] **Step 5: Commit**

```
git add src/lib/Basic4WebGL/defs/gfx.bas src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts src/components/Runner/engine/sprites.js
git commit -m "feat: update gfx.boxCollide to delegate to _sb.spriteCollide, remove dead boxCollide from sprites.js"
```

---

### Task 7: Documentation

**Files:**
- Create: `src/docs/api-reference/collision.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Write collision.md**

Create `src/docs/api-reference/collision.md` with the following content:

```markdown
# collision

The `collision` module provides six functions for detecting overlaps, proximity, and line-of-sight between sprites. Include the **softGfx** package to use it.

## spriteCollide(a, b)

Tests whether two sprites overlap using their bounding boxes. The simplest way to detect two sprites touching.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite |
| b         | object | Second sprite |

**Returns:** `true` if the sprites overlap, `false` if not.

```bas
if collision.spriteCollide(player, enemy) then
  gameOver()
endif
```

## boxCollide(x1, y1, w1, h1, x2, y2, w2, h2)

Tests whether two axis-aligned rectangles overlap. Use this when you want to specify the exact collision size instead of relying on the sprite bounds.

`x` and `y` are the **centre** of each rectangle (consistent with `drawing.drawRect`).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x1        | number | Centre x of the first box |
| y1        | number | Centre y of the first box |
| w1        | number | Width of the first box |
| h1        | number | Height of the first box |
| x2        | number | Centre x of the second box |
| y2        | number | Centre y of the second box |
| w2        | number | Width of the second box |
| h2        | number | Height of the second box |

**Returns:** `true` if the boxes overlap, `false` if not.

```bas
dim px = player.transform.x()
dim py = player.transform.y()
if collision.boxCollide(px, py, 32, 48, ex, ey, 40, 40) then
  gameOver()
endif
```

## circleCollide(a, radiusA, b, radiusB)

Tests whether two circles overlap. Uses the distance between sprite centres and the sum of their radii. Good for round sprites or when you want smooth corner behaviour.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite |
| radiusA   | number | Radius of the first circle in pixels |
| b         | object | Second sprite |
| radiusB   | number | Radius of the second circle in pixels |

**Returns:** `true` if the circles overlap, `false` if not.

```bas
if collision.circleCollide(coin, 12, player, 20) then
  collectCoin()
endif
```

## pointInBox(x, y, sprite)

Tests whether a point falls inside a sprite's bounding box. Most useful for detecting mouse clicks on sprite buttons.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | x coordinate of the point |
| y         | number | y coordinate of the point |
| sprite    | object | Sprite whose bounding box to test |

**Returns:** `true` if the point is inside the sprite, `false` if not.

```bas
if collision.pointInBox(input.mouseX(), input.mouseY(), btn) then
  onClick()
endif
```

## raycast(x, y, angle, distance, sprites)

Casts a ray from a point in a given direction and returns the **first** sprite it hits, or `false` if nothing is hit within range.

Angle is in degrees: 0 = right, 90 = down, 180 = left, 270 = up.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Ray origin x |
| y         | number | Ray origin y |
| angle     | number | Direction in degrees |
| distance  | number | Maximum ray length in pixels |
| sprites   | array  | Array of sprites to test against |

**Returns:** The first sprite hit (nearest to origin), or `false` if nothing is hit.

```bas
dim hit = collision.raycast(player.transform.x(), player.transform.y(), 270, 300, enemies)
if hit <> false then
  hit.destroy()
endif
```

## raycastAll(x, y, angle, distance, sprites)

Same as `raycast` but returns **all** sprites hit, as an array of `RayHit` objects sorted nearest first. Returns an empty array (length 0) if nothing is hit.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Ray origin x |
| y         | number | Ray origin y |
| angle     | number | Direction in degrees |
| distance  | number | Maximum ray length in pixels |
| sprites   | array  | Array of sprites to test against |

**Returns:** Array of `RayHit` objects sorted nearest first.

Each `RayHit` has two properties:

| Property | Type   | Description |
|----------|--------|-------------|
| sprite   | object | The sprite that was hit |
| distance | number | Distance in pixels from the ray origin to the hit point |

```bas
dim hits = collision.raycastAll(player.transform.x(), player.transform.y(), 45, 400, enemies)
dim i
for i = 0 to array.arrLength(hits) - 1
  dim h = hits(i)
  if h.distance < 150 then
    h.sprite.destroy()
  endif
next i
```

## Note: gfx.boxCollide

`gfx.boxCollide(a, b)` is a permanent alias for `collision.spriteCollide(a, b)`. Existing code that uses `gfx.boxCollide` continues to work without changes.
```

- [ ] **Step 2: Add collision page to manifest.ts**

In `src/docs/manifest.ts`, in the `softGfx` group topics array, add after the `audio` entry:

```ts
{ slug: 'collision', title: 'collision', file: 'api-reference/collision.md' },
```

The softGfx topics array after the change:
```ts
topics: [
  { slug: 'gfx',             title: 'gfx',             file: 'api-reference/gfx.md' },
  { slug: 'input',           title: 'input',            file: 'api-reference/input.md' },
  { slug: 'drawing',         title: 'drawing',          file: 'api-reference/drawing.md' },
  { slug: 'stage',           title: 'stage',            file: 'api-reference/stage.md' },
  { slug: 'pen',             title: 'pen',              file: 'api-reference/pen.md' },
  { slug: 'assetmanager',    title: 'assetmanager',     file: 'api-reference/assetmanager.md' },
  { slug: 'objecttransform', title: 'ObjectTransform',  file: 'api-reference/objecttransform.md' },
  { slug: 'sprite',          title: 'sprite',           file: 'api-reference/sprite.md' },
  { slug: 'animatedsprite',  title: 'animatedsprite',   file: 'api-reference/animatedsprite.md' },
  { slug: 'text',            title: 'text',             file: 'api-reference/text.md' },
  { slug: 'tilemap',         title: 'tilemap',          file: 'api-reference/tilemap.md' },
  { slug: 'audio',           title: 'audio',            file: 'api-reference/audio.md' },
  { slug: 'collision',       title: 'collision',        file: 'api-reference/collision.md' },
],
```

- [ ] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Verify the build succeeds**

```
npx vite build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```
git add src/docs/api-reference/collision.md src/docs/manifest.ts
git commit -m "docs: add collision module API reference"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| `collision.spriteCollide(a, b)` | Task 2 (def) + Task 4 (engine) |
| `collision.boxCollide(x1,y1,w1,h1,x2,y2,w2,h2)` | Task 2 (def) + Task 4 (engine) |
| `collision.circleCollide(a, rA, b, rB)` | Task 2 (def) + Task 4 (engine) |
| `collision.pointInBox(x, y, sprite)` | Task 2 (def) + Task 4 (engine) |
| `collision.raycast(x, y, angle, dist, sprites)` → first hit or false | Task 2 (def) + Task 4 (engine) |
| `collision.raycastAll(x, y, angle, dist, sprites)` → RayHit[] sorted | Task 2 (def) + Task 4 (engine) |
| `RayHit` class with `.sprite` and `.distance` | Task 3 (def) |
| `gfx.boxCollide(a, b)` backward compat alias → `_sb.spriteCollide` | Task 6 |
| Engine wiring (softBasicEngine.js, index.tsx, packageModules.ts) | Task 5 |
| Tests for all 6 functions + backward compat | Task 1 |
| API reference documentation | Task 7 |
| manifest.ts updated | Task 7 |

All spec requirements covered. No gaps identified.

**Placeholder scan:** No TBDs, no "similar to Task N" shortcuts, all code blocks complete.

**Type consistency:** `_sb.spriteCollide` referenced in gfx.bas (Task 6) and collision.bas (Task 2) — both call the same engine function. `spriteCollide` in collision.js is the implementation.
