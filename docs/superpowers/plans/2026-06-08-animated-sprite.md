# AnimatedSprite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `AnimatedSprite` BASIC class backed by `PIXI.AnimatedSprite` that supports uniform-grid spritesheets, named animations with per-animation loop flags, and an `isPlaying` one-shot detection API.

**Architecture:** A new engine mixin (`_sbAnimatedSprites`) handles all frame-slicing and PIXI wiring; a new BASIC class def (`animatedsprite.bas`) exposes the API via `call()` escape hatches; `index.tsx` injects the engine file into the bootstrapper alongside the existing engine modules. No compiler changes — everything goes through the existing `call()` mechanism. The `transform` property reuses the existing `ObjectTransform` class by passing `handle.pixi` (the inner PIXI object) rather than the wrapper.

**Tech Stack:** TypeScript, PixiJS 8 (`PIXI.AnimatedSprite`, `PIXI.Texture`, `PIXI.Rectangle`), softBASIC compiler, Vitest

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/Runner/engine/animatedSprite.js` | `_sbAnimatedSprites` mixin — frame slicing, PIXI.AnimatedSprite wiring |
| Create | `src/lib/Basic4WebGL/defs/animatedsprite.bas` | BASIC class definition — delegates to engine via `call()` |
| Modify | `src/components/Runner/softBasicEngine.js` | Spread `_sbAnimatedSprites` into `_sb` |
| Modify | `src/components/Runner/index.tsx` | Import `animatedSprite.js?raw` and inject into bootstrapper |
| Modify | `src/constants/packageModules.ts` | Import `animatedsprite.bas?raw` and register in `packageModules` |
| Create | `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts` | Transpiler tests |

---

## Task 1: Transpiler tests (failing)

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource        = readFileSync('src/lib/Basic4WebGL/defs/transform.bas',        'utf-8');
const animatedSpriteSource   = readFileSync('src/lib/Basic4WebGL/defs/animatedsprite.bas',   'utf-8');

const transpileWithAnimSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas',  source: transformSource      },
      { name: 'AnimatedSprite.bas',   source: animatedSpriteSource },
      { name: 'Main.bas',             source                       },
    ],
  });

// ─── Construction ─────────────────────────────────────────────────────────────

describe('AnimatedSprite — construction', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.createAnimatedSprite(', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\nendfunction'
    );
    expect(result.code).toContain('_sb.createAnimatedSprite(');
  });
});

// ─── addAnim ──────────────────────────────────────────────────────────────────

describe('AnimatedSprite — addAnim', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.addAnim("run", 0, 7, 12, true)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.addAnim(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.addAnim("run", 0, 7, 12, true)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addAnim(');
  });
});

// ─── play ─────────────────────────────────────────────────────────────────────

describe('AnimatedSprite — play', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.play("run")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.playAnim(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.play("run")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.playAnim(');
  });
});

// ─── isPlaying ────────────────────────────────────────────────────────────────

describe('AnimatedSprite — isPlaying', () => {
  test('compiles without error in if condition', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  if s.isPlaying("run") == false',
      '    s.play("idle")',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.isPlayingAnim(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  if s.isPlaying("run") == false',
      '    s.play("idle")',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isPlayingAnim(');
  });
});

// ─── Visual / transform methods ───────────────────────────────────────────────

describe('AnimatedSprite — visual methods', () => {
  test('setScale compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setScale(2, 2)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setFlip compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setFlip(true, false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setVisible compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setVisible(false)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setAlpha compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setAlpha(0.5)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('setAngle compiles without error', () => {
    const result = transpileWithAnimSprite(
      'function test()\n  dim s as AnimatedSprite("hero.png", 48, 48)\n  s.setAngle(45)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
  test('width compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim w',
      '  w = s.width()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('height compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim h',
      '  h = s.height()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── End-to-end ───────────────────────────────────────────────────────────────

describe('AnimatedSprite — end-to-end', () => {
  test('full platformer-style program compiles without error', () => {
    const result = transpileWithAnimSprite([
      'dim hero as AnimatedSprite("hero.png", 48, 48)',
      '',
      'function onenter()',
      '  hero.addAnim("idle",  0,  3,  8, true)',
      '  hero.addAnim("run",   4, 11, 12, true)',
      '  hero.addAnim("jump", 12, 15, 10, false)',
      '  hero.play("idle")',
      '  hero.transform.setPosition(100, 200)',
      'endfunction',
      '',
      'function onupdate()',
      '  if hero.isPlaying("jump") == false',
      '    hero.play("idle")',
      '  endif',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts
```

Expected: Error such as `ENOENT: no such file or directory, open '...animatedsprite.bas'` — confirms the tests are wired up and the target file doesn't exist yet.

---

## Task 2: BASIC class definition

**Files:**
- Create: `src/lib/Basic4WebGL/defs/animatedsprite.bas`

**Context:** softBASIC classes use `call()` to escape into engine JS. Parameter references inside `call()` strings follow the pattern `functionname_paramname` (all-lowercase function name + underscore + parameter name as written). The constructor param prefix is always `constructor`. The `ObjectTransform` class takes a raw PIXI object as its handle — passing `this._handle.pixi` gives it the inner PIXI sprite so it can call `_sb.setPosition` / `_sb.getPositionX` / `_sb.getPositionY` which operate directly on PIXI display objects.

- [ ] **Step 1: Create `animatedsprite.bas`**

```basic
Class
dim _handle

Constructor(imagePath, frameW, frameH)
    _handle = call("_sb.createAnimatedSprite(constructor_imagePath, constructor_frameW, constructor_frameH)")
    dim transform as ObjectTransform(call("this._handle.pixi"))
EndConstructor

function addAnim(name, startFrame, endFrame, fps, loop)
    call("_sb.addAnim(this._handle, addanim_name, addanim_startFrame, addanim_endFrame, addanim_fps, addanim_loop)")
endfunction

function play(name)
    call("_sb.playAnim(this._handle, play_name)")
endfunction

function isPlaying(name)
    return call("_sb.isPlayingAnim(this._handle, isplaying_name)")
endfunction

function setAngle(angle)
    call("_sb.setAnimAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAnimAlpha(this._handle, setalpha_a)")
endfunction

function setScale(sx, sy)
    call("_sb.setAnimScale(this._handle, setscale_sx, setscale_sy)")
endfunction

function setFlip(h, v)
    call("_sb.setAnimFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setVisible(v)
    call("_sb.setAnimVisible(this._handle, setvisible_v)")
endfunction

function width()
    return call("_sb.getAnimWidth(this._handle)")
endfunction

function height()
    return call("_sb.getAnimHeight(this._handle)")
endfunction

EndClass
```

- [ ] **Step 2: Run tests**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/Basic4WebGL/defs/animatedsprite.bas tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts
git commit -m "feat: add AnimatedSprite BASIC class def and transpiler tests"
```

---

## Task 3: Engine implementation

**Files:**
- Create: `src/components/Runner/engine/animatedSprite.js`

**Context:** All engine files export a single `const _sbXxx = { ... }` object that gets spread into `_sb`. The existing `_sbSprites.createSprite` returns a raw PIXI object as the handle. `AnimatedSprite` returns a wrapper `{ pixi, frames, animations, currentAnim, playing }` instead — the PIXI object lives at `.pixi`. The `_sbAssets.get(path)` helper returns a `PIXI.Texture`; its `.source` property is the underlying `TextureSource` needed to construct sub-frame textures in PIXI 8. Frame numbers are zero-based; `playAnim` uses `Array.slice(startFrame, endFrame + 1)` to get the inclusive range. `isPlayingAnim` returns `1` or `0` (not JS boolean) so that softBASIC comparisons like `== false` work correctly — softBASIC treats `0` as false.

- [ ] **Step 1: Create `animatedSprite.js`**

```javascript
const _sbAnimatedSprites = {
  createAnimatedSprite(imagePath, frameW, frameH) {
    const base = _sbAssets.get(imagePath);
    const cols = Math.floor(base.width / frameW);
    const rows = Math.floor(base.height / frameH);
    const frames = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push(
          new PIXI.Texture({
            source: base.source,
            frame: new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH),
          })
        );
      }
    }
    const pixi = new PIXI.AnimatedSprite(frames);
    pixi.anchor.set(0.5);
    app.stage.addChild(pixi);
    return { pixi, frames, animations: new Map(), currentAnim: null, playing: false };
  },

  addAnim(handle, name, startFrame, endFrame, fps, loop) {
    handle.animations.set(String(name), {
      startFrame: Number(startFrame),
      endFrame:   Number(endFrame),
      fps:        Number(fps),
      loop:       Boolean(loop),
    });
  },

  playAnim(handle, name) {
    const key = String(name);
    const def = handle.animations.get(key);
    if (!def) return;
    handle.pixi.textures = handle.frames.slice(def.startFrame, def.endFrame + 1);
    handle.pixi.animationSpeed = def.fps / 60;
    handle.pixi.loop = def.loop;
    handle.pixi.onComplete = null;
    handle.currentAnim = key;
    handle.playing = true;
    if (!def.loop) {
      handle.pixi.onComplete = () => { handle.playing = false; };
    }
    handle.pixi.gotoAndPlay(0);
  },

  isPlayingAnim(handle, name) {
    return (handle.currentAnim === String(name) && handle.playing) ? 1 : 0;
  },

  setAnimAngle(handle, angle) {
    handle.pixi.angle = Number(angle);
  },

  setAnimAlpha(handle, a) {
    handle.pixi.alpha = Number(a);
  },

  setAnimScale(handle, sx, sy) {
    handle.pixi.scale.set(Number(sx), Number(sy));
  },

  setAnimFlip(handle, h, v) {
    handle.pixi.scale.x = h ? -Math.abs(handle.pixi.scale.x) : Math.abs(handle.pixi.scale.x);
    handle.pixi.scale.y = v ? -Math.abs(handle.pixi.scale.y) : Math.abs(handle.pixi.scale.y);
  },

  setAnimVisible(handle, v) {
    handle.pixi.visible = Boolean(v);
  },

  getAnimWidth(handle) {
    return handle.pixi.width;
  },

  getAnimHeight(handle) {
    return handle.pixi.height;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Runner/engine/animatedSprite.js
git commit -m "feat: add _sbAnimatedSprites engine mixin"
```

---

## Task 4: Wire engine into bootstrapper

**Files:**
- Modify: `src/components/Runner/index.tsx`
- Modify: `src/components/Runner/softBasicEngine.js`

**Context:** `index.tsx` imports each engine file as a raw string (`?raw`) and concatenates them in the `replace('//${softBasicGFX}', [...].join('\n'))` call. `softBasicEngine.js` spreads each mixin into the `_sb` object. Both files must be updated together — the mixin name `_sbAnimatedSprites` must match exactly between the engine file (where it is declared) and `softBasicEngine.js` (where it is spread).

- [ ] **Step 1: Add import to `index.tsx`**

In `src/components/Runner/index.tsx`, add the import after the existing `sbSprites` import:

```typescript
import sbAnimatedSprites from './engine/animatedSprite.js?raw';
```

Then update the `replace` call — find:

```typescript
[sbLifecycle, sbInput, sbAssets, sbDrawing, sbStage, sbSprites, softBasicEngine].join('\n')
```

Replace with:

```typescript
[sbLifecycle, sbInput, sbAssets, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, softBasicEngine].join('\n')
```

- [ ] **Step 2: Spread mixin in `softBasicEngine.js`**

In `src/components/Runner/softBasicEngine.js`, the current content is:

```javascript
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
};
```

Replace with:

```javascript
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,
};
```

- [ ] **Step 3: Run all tests to confirm nothing regressed**

```
npx vitest run
```

Expected: All tests pass including the new `animated-sprite.test.ts` suite.

- [ ] **Step 4: Commit**

```bash
git add src/components/Runner/index.tsx src/components/Runner/softBasicEngine.js
git commit -m "feat: wire _sbAnimatedSprites into bootstrapper"
```

---

## Task 5: Package registration

**Files:**
- Modify: `src/constants/packageModules.ts`

**Context:** `packageModules.ts` maps package names to raw BASIC source strings. The key becomes the module name used in `lib: [{ name: 'animatedsprite', ... }]` calls. `AnimatedSprite` depends on `ObjectTransform` — both must be included when the class is used. The existing pattern (see `sprite` entry) is that the class files are registered individually and the runner loads them as class files. Adding `animatedsprite` here makes it available via the softgfx package load in the runner.

- [ ] **Step 1: Update `packageModules.ts`**

In `src/constants/packageModules.ts`, the current content is:

```typescript
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
import array from '../lib/Basic4WebGL/defs/array.bas?raw';
import gfx from '../lib/Basic4WebGL/defs/gfx.bas?raw';
import drawing from '../lib/Basic4WebGL/defs/drawing.bas?raw';
import stage from '../lib/Basic4WebGL/defs/stage.bas?raw';
import pen from '../lib/Basic4WebGL/defs/pen.bas?raw';
import text from '../lib/Basic4WebGL/defs/text.bas?raw';
import assetmanager from '../lib/Basic4WebGL/defs/assetmanager.bas?raw';
import ObjectTransform from '../lib/Basic4WebGL/defs/transform.bas?raw';
import sprite from '../lib/Basic4WebGL/defs/sprite.bas?raw';

export const packageModules: Record<string, string> = {
  math,
  string,
  array,
  gfx,
  drawing,
  stage,
  pen,
  text,
  assetmanager,
  ObjectTransform,
  sprite,
};
```

Add the `animatedsprite` import after `sprite`:

```typescript
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
import array from '../lib/Basic4WebGL/defs/array.bas?raw';
import gfx from '../lib/Basic4WebGL/defs/gfx.bas?raw';
import drawing from '../lib/Basic4WebGL/defs/drawing.bas?raw';
import stage from '../lib/Basic4WebGL/defs/stage.bas?raw';
import pen from '../lib/Basic4WebGL/defs/pen.bas?raw';
import text from '../lib/Basic4WebGL/defs/text.bas?raw';
import assetmanager from '../lib/Basic4WebGL/defs/assetmanager.bas?raw';
import ObjectTransform from '../lib/Basic4WebGL/defs/transform.bas?raw';
import sprite from '../lib/Basic4WebGL/defs/sprite.bas?raw';
import animatedsprite from '../lib/Basic4WebGL/defs/animatedsprite.bas?raw';

export const packageModules: Record<string, string> = {
  math,
  string,
  array,
  gfx,
  drawing,
  stage,
  pen,
  text,
  assetmanager,
  ObjectTransform,
  sprite,
  animatedsprite,
};
```

- [ ] **Step 2: Run all tests**

```
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/constants/packageModules.ts
git commit -m "feat: register animatedsprite in packageModules"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ `AnimatedSprite("hero.png", 48, 48)` constructor → Task 2 (bas) + Task 3 (engine)
- ✅ `addAnim(name, startFrame, endFrame, fps, loop)` → Task 2 + 3
- ✅ `play(name)` → Task 2 + 3
- ✅ `isPlaying(name)` → Task 2 + 3; returns `1`/`0` for softBASIC truthiness
- ✅ Per-animation loop flag + one-shot `onComplete` → Task 3
- ✅ `setScale`, `setFlip`, `setVisible`, `setAlpha`, `setAngle`, `width`, `height` → Task 2 + 3
- ✅ `transform.setPosition` via `ObjectTransform(handle.pixi)` → Task 2
- ✅ Package registration → Task 5
- ✅ Engine wiring → Task 4
- ✅ Tests for every method → Task 1

**Placeholder scan:** None found.

**Type consistency:**
- Engine function names used in `call()` strings in Task 2 match method names defined in Task 3: `createAnimatedSprite`, `addAnim`, `playAnim`, `isPlayingAnim`, `setAnimAngle`, `setAnimAlpha`, `setAnimScale`, `setAnimFlip`, `setAnimVisible`, `getAnimWidth`, `getAnimHeight` — all consistent.
- `_sbAnimatedSprites` matches between Task 3 (declaration), Task 4 `softBasicEngine.js` spread, and Task 4 `index.tsx` array.
