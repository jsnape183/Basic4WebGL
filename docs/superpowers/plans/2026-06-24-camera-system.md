# Camera System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `camera`, `world`, and `hud` modules to softBASIC, refactor the stage engine to use separate world/HUD PIXI containers, and deprecate `stage.add/remove/clear` in favour of `world.*`.

**Architecture:** A new `worldContainer` and `hudContainer` are added as children of `app.stage`; the camera moves `worldContainer` each tick while `hudContainer` stays fixed. `_sbStage` is refactored to route world objects to `worldContainer`; `_sbCamera` is a new engine object with follow, setPosition, setBounds, and per-tick update logic. `stage.*` methods remain as deprecated aliases to `world.*`.

**Tech Stack:** TypeScript/Vite, PIXI.js v8, softBASIC compiler (same as rest of project).

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts` | Transpiler tests for camera, world, hud |
| Create | `src/lib/Basic4WebGL/defs/camera.bas` | Module def — follow, setPosition, setBounds, x, y |
| Create | `src/lib/Basic4WebGL/defs/world.bas` | Module def — add, remove, clear |
| Create | `src/lib/Basic4WebGL/defs/hud.bas` | Module def — add, remove, clear |
| Modify | `src/components/Runner/engine/stage.js` | Add worldContainer/hudContainer globals; add world/hud methods; update clear() |
| Create | `src/components/Runner/engine/camera.js` | `_sbCamera` engine object |
| Modify | `src/components/Runner/engine/scene.js` | Call `this._cameraUpdate()` at end of `_update` |
| Modify | `src/components/Runner/softBasicEngine.js` | Spread `_sbCamera` after `_sbStage` |
| Modify | `src/components/Runner/index.tsx` | Import camera.js and include in engine concat |
| Modify | `src/components/Runner/bootstrapper.html` | Call `_sb._initStage()` after `app.init` |
| Modify | `src/constants/packageModules.ts` | Add camera, world, hud imports/exports |
| Modify | `src/constants/firstPartyPackages.ts` | Add 'camera', 'world', 'hud' to softGfx moduleNames |
| Create | `src/docs/api-reference/camera.md` | camera API reference |
| Create | `src/docs/api-reference/world.md` | world API reference |
| Create | `src/docs/api-reference/hud.md` | hud API reference |
| Modify | `src/docs/api-reference/stage.md` | Add deprecation notice |
| Modify | `src/docs/manifest.ts` | Add world, hud, camera to softGfx group |
| Modify | 14 docs/tutorial files | Replace `stage.add` → `world.add`, `stage.remove` → `world.remove` |

---

## Task 1: Failing transpiler tests for camera, world, and hud

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`

- [ ] **Step 1: Write the test file**

Create `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const cameraSource = readFileSync('src/lib/Basic4WebGL/defs/camera.bas', 'utf-8');
const worldSource  = readFileSync('src/lib/Basic4WebGL/defs/world.bas',  'utf-8');
const hudSource    = readFileSync('src/lib/Basic4WebGL/defs/hud.bas',    'utf-8');

const transpileWithCamera = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'camera', source: cameraSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithWorld = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'world', source: worldSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithHud = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'hud', source: hudSource }],
    files: [{ name: 'Main.bas', source }],
  });

// ─── camera.follow ────────────────────────────────────────────────────────────

describe('camera — follow', () => {
  test('compiles without error (snap)', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim s',
      '  camera.follow(s, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('compiles without error (smooth)', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim s',
      '  camera.follow(s, 0.1)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraFollow(', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim s',
      '  camera.follow(s, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraFollow(');
  });
});

// ─── camera.setPosition ───────────────────────────────────────────────────────

describe('camera — setPosition', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  camera.setPosition(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraSetPosition(', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  camera.setPosition(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraSetPosition(');
  });
});

// ─── camera.setBounds ─────────────────────────────────────────────────────────

describe('camera — setBounds', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function onenter()',
      '  camera.setBounds(2000, 1000)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraSetBounds(', () => {
    const result = transpileWithCamera([
      'function onenter()',
      '  camera.setBounds(2000, 1000)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraSetBounds(');
  });
});

// ─── camera.x and camera.y ────────────────────────────────────────────────────

describe('camera — x and y', () => {
  test('camera.x() compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cx',
      '  cx = camera.x()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('camera.x() emits _sb.cameraX()', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cx',
      '  cx = camera.x()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraX()');
  });

  test('camera.y() compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cy',
      '  cy = camera.y()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('camera.y() emits _sb.cameraY()', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cy',
      '  cy = camera.y()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraY()');
  });
});

// ─── world ────────────────────────────────────────────────────────────────────

describe('world — add', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.addToWorld(', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addToWorld(');
  });
});

describe('world — remove', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.removeFromWorld(', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.removeFromWorld(');
  });
});

describe('world — clear', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  world.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.clearWorld()', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  world.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.clearWorld()');
  });
});

// ─── hud ──────────────────────────────────────────────────────────────────────

describe('hud — add', () => {
  test('compiles without error', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.addToHud(', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addToHud(');
  });
});

describe('hud — remove', () => {
  test('compiles without error', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.removeFromHud(', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.removeFromHud(');
  });
});

describe('hud — clear', () => {
  test('compiles without error', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  hud.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.clearHud()', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  hud.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.clearHud()');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`

Expected: Tests fail with `ENOENT: no such file or directory` for `camera.bas`. This confirms the test is correctly structured — it needs the def files.

---

## Task 2: Def files for camera, world, and hud

**Files:**
- Create: `src/lib/Basic4WebGL/defs/camera.bas`
- Create: `src/lib/Basic4WebGL/defs/world.bas`
- Create: `src/lib/Basic4WebGL/defs/hud.bas`

- [ ] **Step 1: Create camera.bas**

Create `src/lib/Basic4WebGL/defs/camera.bas`:

```bas
function follow(target, speed)
    call("_sb.cameraFollow(follow_target, follow_speed)")
endfunction

function setPosition(x, y)
    call("_sb.cameraSetPosition(setposition_x, setposition_y)")
endfunction

function setBounds(width, height)
    call("_sb.cameraSetBounds(setbounds_width, setbounds_height)")
endfunction

function x()
    return call("_sb.cameraX()")
endfunction

function y()
    return call("_sb.cameraY()")
endfunction
```

- [ ] **Step 2: Create world.bas**

Create `src/lib/Basic4WebGL/defs/world.bas`:

```bas
function add(obj)
    call("_sb.addToWorld(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromWorld(remove_obj)")
endfunction

function clear()
    call("_sb.clearWorld()")
endfunction
```

- [ ] **Step 3: Create hud.bas**

Create `src/lib/Basic4WebGL/defs/hud.bas`:

```bas
function add(obj)
    call("_sb.addToHud(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromHud(remove_obj)")
endfunction

function clear()
    call("_sb.clearHud()")
endfunction
```

- [ ] **Step 4: Run tests — all must pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`

Expected: All tests PASS. If any test fails, check that the function name in the `call(...)` string exactly matches what the test expects (e.g. `_sb.cameraFollow(`, `_sb.addToWorld(`).

- [ ] **Step 5: Run full test suite — no regressions**

Run: `npx vitest run`

Expected: All pre-existing tests still PASS, plus the new camera tests.

- [ ] **Step 6: Commit**

```bash
git add tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts
git add src/lib/Basic4WebGL/defs/camera.bas
git add src/lib/Basic4WebGL/defs/world.bas
git add src/lib/Basic4WebGL/defs/hud.bas
git commit -m "feat: add camera/world/hud def files and transpiler tests"
```

---

## Task 3: Stage engine refactor — world and HUD containers

**Files:**
- Modify: `src/components/Runner/engine/stage.js`

The current `stage.js` adds objects directly to `app.stage`. We need to add a `worldContainer` and `hudContainer` as globals, wire them into `app.stage` on init, and expose `addToWorld`, `addToHud`, `removeFromWorld`, `removeFromHud`, `clearWorld`, `clearHud`. The deprecated `addToStage`/`removeFromStage` become aliases to the world equivalents. `clear()` clears both containers and calls `this._cameraReset()` (available at runtime via `_sb`).

- [ ] **Step 1: Replace the full contents of stage.js**

Replace `src/components/Runner/engine/stage.js` with:

```js
let worldContainer;
let hudContainer;

const _sbStage = {
  _initStage() {
    worldContainer = new PIXI.Container();
    hudContainer = new PIXI.Container();
    app.stage.addChild(worldContainer);
    app.stage.addChild(hudContainer);
  },

  // ── world ────────────────────────────────────────────────────────────────
  addToWorld(obj) {
    worldContainer.addChild(obj._handle);
    if (!_sbLifecycle._sbInstances.includes(obj)) {
      _sbLifecycle._sbInstances.push(obj);
    }
  },
  removeFromWorld(obj) {
    worldContainer.removeChild(obj._handle);
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter((i) => i !== obj);
  },
  clearWorld() {
    const worldHandles = new Set(worldContainer.children);
    worldContainer.removeChildren();
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(
      (i) => !worldHandles.has(i._handle)
    );
  },

  // ── hud ──────────────────────────────────────────────────────────────────
  addToHud(obj) {
    hudContainer.addChild(obj._handle);
    if (!_sbLifecycle._sbInstances.includes(obj)) {
      _sbLifecycle._sbInstances.push(obj);
    }
  },
  removeFromHud(obj) {
    hudContainer.removeChild(obj._handle);
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter((i) => i !== obj);
  },
  clearHud() {
    const hudHandles = new Set(hudContainer.children);
    hudContainer.removeChildren();
    _sbLifecycle._sbInstances = _sbLifecycle._sbInstances.filter(
      (i) => !hudHandles.has(i._handle)
    );
  },

  // ── deprecated stage aliases ──────────────────────────────────────────────
  addToStage(obj) {
    this.addToWorld(obj);
  },
  removeFromStage(obj) {
    this.removeFromWorld(obj);
  },

  // ── full clear (used by scene switch) ────────────────────────────────────
  clear() {
    worldContainer.removeChildren();
    hudContainer.removeChildren();
    _sbLifecycle._sbInstances = [];
    this._cameraReset();
  },

  // ── canvas info ───────────────────────────────────────────────────────────
  getStageWidth() {
    return app.renderer.width;
  },
  getStageHeight() {
    return app.renderer.height;
  },
  setBackground(r, g, b) {
    app.renderer.background.color = (r << 16) | (g << 8) | b;
  },
};
```

- [ ] **Step 2: Run full test suite — still passing**

Run: `npx vitest run`

Expected: All tests PASS. The transpiler tests don't test the engine, so no test should be affected.

- [ ] **Step 3: Commit**

```bash
git add src/components/Runner/engine/stage.js
git commit -m "feat: refactor stage engine to use worldContainer and hudContainer"
```

---

## Task 4: Camera engine module and scene integration

**Files:**
- Create: `src/components/Runner/engine/camera.js`
- Modify: `src/components/Runner/engine/scene.js`

`_sbCamera` holds camera state and is spread into `_sb`. `worldContainer` (declared as a global in `stage.js`) is accessible here because all engine files are concatenated into one script block. `scene.js` gets a single extra line to call `this._cameraUpdate()` at the end of each tick.

- [ ] **Step 1: Create camera.js**

Create `src/components/Runner/engine/camera.js`:

```js
const _sbCamera = {
  _camX: 0,
  _camY: 0,
  _followTarget: null,
  _followSpeed: 0,
  _boundsW: null,
  _boundsH: null,

  cameraFollow(target, speed) {
    this._followTarget = target;
    this._followSpeed = speed;
  },

  cameraSetPosition(x, y) {
    this._followTarget = null;
    this._camX = x;
    this._camY = y;
  },

  cameraSetBounds(w, h) {
    this._boundsW = w;
    this._boundsH = h;
  },

  cameraX() { return this._camX; },
  cameraY() { return this._camY; },

  _cameraUpdate() {
    if (this._followTarget) {
      const sw = app.renderer.width;
      const sh = app.renderer.height;
      const desiredX = this._followTarget.position.x - sw / 2;
      const desiredY = this._followTarget.position.y - sh / 2;
      if (this._followSpeed === 0) {
        this._camX = desiredX;
        this._camY = desiredY;
      } else {
        this._camX += (desiredX - this._camX) * this._followSpeed;
        this._camY += (desiredY - this._camY) * this._followSpeed;
      }
    }
    if (this._boundsW !== null) {
      const sw = app.renderer.width;
      const sh = app.renderer.height;
      this._camX = Math.max(0, Math.min(this._boundsW - sw, this._camX));
      this._camY = Math.max(0, Math.min(this._boundsH - sh, this._camY));
    }
    worldContainer.position.set(-this._camX, -this._camY);
  },

  _cameraReset() {
    this._camX = 0;
    this._camY = 0;
    this._followTarget = null;
    this._followSpeed = 0;
    this._boundsW = null;
    this._boundsH = null;
    worldContainer.position.set(0, 0);
  },
};
```

- [ ] **Step 2: Add `this._cameraUpdate()` to scene.js**

In `src/components/Runner/engine/scene.js`, replace the `_update` method:

```js
  _update(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
    this._cameraUpdate();
  },
```

The only change from the current version is adding `this._cameraUpdate();` as the last line. At runtime `this` is `_sb`, which has `_cameraUpdate` from `_sbCamera`. This runs after game logic and scene switches, so the camera sees the final frame position of the follow target.

- [ ] **Step 3: Run full test suite — no regressions**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Runner/engine/camera.js
git add src/components/Runner/engine/scene.js
git commit -m "feat: add camera engine module and wire cameraUpdate into scene tick"
```

---

## Task 5: Wire camera into the runner

**Files:**
- Modify: `src/components/Runner/index.tsx`
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/bootstrapper.html`

- [ ] **Step 1: Import camera.js in index.tsx**

In `src/components/Runner/index.tsx`, add the import on line 13 (after `sbScene`):

```tsx
import sbCamera from './engine/camera.js?raw';
```

Then update the engine join array on line 41 to include `sbCamera` after `sbScene`:

```tsx
[sbLifecycle, sbInput, sbAssets, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbScene, sbCamera, softBasicEngine].join('\n')
```

- [ ] **Step 2: Spread _sbCamera in softBasicEngine.js**

Replace `src/components/Runner/softBasicEngine.js` with:

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

`_sbCamera` is placed after `_sbStage` so both have been defined by the time `_sb` is constructed. The `_cameraReset` from `_sbCamera` is now available as `_sb._cameraReset`, which `_sbStage.clear()` calls via `this._cameraReset()`.

- [ ] **Step 3: Call _sb._initStage() in bootstrapper.html**

In `src/components/Runner/bootstrapper.html`, after the existing `_sb._initMouse(app.canvas);` line, add:

```js
_sb._initStage();
```

The relevant section after the edit should look like:

```js
app.stage.interactive = true;
document.body.appendChild(app.canvas);

// Mouse tracking must be attached after app.canvas exists.
_sb._initMouse(app.canvas);
_sb._initStage();
```

- [ ] **Step 4: Build to verify no errors**

Run: `npx vite build`

Expected: Build completes with no TypeScript or bundling errors.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/index.tsx
git add src/components/Runner/softBasicEngine.js
git add src/components/Runner/bootstrapper.html
git commit -m "feat: wire camera engine into runner and bootstrapper"
```

---

## Task 6: Package registration

**Files:**
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`

- [ ] **Step 1: Add camera, world, hud imports to packageModules.ts**

In `src/constants/packageModules.ts`, add three import lines after `scenemanager` (current line 19):

```ts
import camera from '../lib/Basic4WebGL/defs/camera.bas?raw';
import world from '../lib/Basic4WebGL/defs/world.bas?raw';
import hud from '../lib/Basic4WebGL/defs/hud.bas?raw';
```

Then add `camera`, `world`, `hud` to the `packageModules` export object:

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
  rayhit,
  scene,
  scenemanager,
  camera,
  world,
  hud,
};
```

- [ ] **Step 2: Add camera, world, hud to firstPartyPackages.ts**

In `src/constants/firstPartyPackages.ts`, add `'camera'`, `'world'`, `'hud'` to the softGfx `moduleNames` array:

```ts
moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'audio', 'collision', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud'],
```

- [ ] **Step 3: Build to confirm no errors**

Run: `npx vite build`

Expected: Build completes with no errors.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/constants/packageModules.ts
git add src/constants/firstPartyPackages.ts
git commit -m "feat: register camera, world, hud modules in softGfx package"
```

---

## Task 7: Documentation — new API pages + deprecation + stage.add → world.add

**Files:**
- Create: `src/docs/api-reference/camera.md`
- Create: `src/docs/api-reference/world.md`
- Create: `src/docs/api-reference/hud.md`
- Modify: `src/docs/api-reference/stage.md`
- Modify: `src/docs/manifest.ts`
- Modify: `src/docs/api-reference/sprite.md`
- Modify: `src/docs/api-reference/animatedsprite.md`
- Modify: `src/docs/api-reference/text.md`
- Modify: `src/docs/api-reference/tilemap.md`
- Modify: `src/docs/api-reference/scene.md`
- Modify: `src/docs/tutorials/03-sprite.md`
- Modify: `src/docs/tutorials/04-motion.md`
- Modify: `src/docs/tutorials/05-keyboard.md`
- Modify: `src/docs/tutorials/06-bounds.md`
- Modify: `src/docs/tutorials/07-score.md`
- Modify: `src/docs/tutorials/08-functions.md`
- Modify: `src/docs/tutorials/09-enemies.md`
- Modify: `src/docs/tutorials/10-classes.md`
- Modify: `src/docs/tutorials/11-dodge.md`

**Reminder before writing docs:** Check `src/lib/Basic4WebGL/defs/camera.bas`, `world.bas`, and `hud.bas` to confirm exact call syntax. The docs writing style: beginners, no JS internals, parameter tables, one-sentence descriptions, game-like examples. Do NOT reference `stage.add` in the new pages.

- [ ] **Step 1: Create src/docs/api-reference/camera.md**

```markdown
# camera

The `camera` module controls what part of the game world is visible on screen. Use it to follow a moving player, pan to a location, or clamp the view so the camera never shows empty space beyond the world edge. Include the **softGfx** package to use it.

By default the camera is at position (0, 0), which shows the world origin at the top-left of the screen.

---

## camera.follow(target, speed)

Tells the camera to follow a sprite or other object each frame, keeping it centred on screen.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| target    | object | The sprite, animatedsprite, or text object to track |
| speed     | number | Lerp factor 0–1. Pass `0` to snap instantly; values like `0.08` give smooth tracking |

```bas
function onupdate(delta)
  camera.follow(self.player, 0.1)
endfunction
```

Calling `camera.setPosition()` while in follow mode cancels the follow target.

---

## camera.setPosition(x, y)

Moves the camera to a specific position in world space and cancels any active follow target.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | World x coordinate to show at the left edge of the screen |
| y         | number | World y coordinate to show at the top edge of the screen |

```bas
camera.setPosition(0, 0)
```

---

## camera.setBounds(width, height)

Enables bounds clamping so the camera never shows space outside the world rectangle. Without this call, the camera moves freely.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| width     | number | Total width of the game world in pixels |
| height    | number | Total height of the game world in pixels |

```bas
function onenter()
  camera.setBounds(3200, 1800)
endfunction
```

Clamping is applied every frame after follow tracking, so it works with both `camera.follow` and `camera.setPosition`.

---

## camera.x()

Returns the current camera x position — the world coordinate visible at the left edge of the screen.

**Returns:** number

```bas
dim spawnX
spawnX = camera.x() + stage.width()
```

---

## camera.y()

Returns the current camera y position — the world coordinate visible at the top edge of the screen.

**Returns:** number

```bas
dim spawnY
spawnY = camera.y() + stage.height()
```

---

## Full example — side-scrolling platformer camera

**GameScene class file:**

```bas
Class extends scene

dim player

function onenter()
  self.player = new sprite("player.png")
  self.player.setPosition(400, 300)
  world.add(self.player)
  camera.setBounds(6400, 600)
endfunction

function onupdate(delta)
  if input.keyDown(39) then
    self.player.move(4, 0)
  endif
  camera.follow(self.player, 0.08)
endfunction

EndClass
```

The player moves right with the arrow key. The camera smoothly follows and clamps so it never shows space past x = 6400.
```

- [ ] **Step 2: Create src/docs/api-reference/world.md**

```markdown
# world

The `world` module adds, removes, and clears objects in the game world — the scrollable space that the camera moves through. Objects added with `world.add` move with the camera. Use `hud.add` for score displays and other screen-fixed elements. Include the **softGfx** package to use it.

---

## world.add(obj)

Adds an object to the world so it becomes visible and moves with the camera.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, text, or tilemap instance |

```bas
function onenter()
  dim enemy = new sprite("enemy.png")
  enemy.setPosition(800, 300)
  world.add(enemy)
endfunction
```

---

## world.remove(obj)

Removes an object from the world so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
world.remove(self.enemy)
```

---

## world.clear()

Removes all world objects at once.

```bas
function onenter()
  world.clear()
endfunction
```
```

- [ ] **Step 3: Create src/docs/api-reference/hud.md**

```markdown
# hud

The `hud` module adds, removes, and clears objects on the HUD layer — a fixed overlay that does not move when the camera scrolls. Use it for score text, health bars, timers, and other screen-fixed elements. Objects added with `world.add` scroll with the camera; objects added with `hud.add` stay in place. Include the **softGfx** package to use it.

---

## hud.add(obj)

Adds an object to the HUD layer so it stays fixed on screen regardless of camera position.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, or text instance |

```bas
function onenter()
  dim scoreLabel = new text()
  scoreLabel.setText("Score: 0")
  scoreLabel.setPosition(20, 20)
  hud.add(scoreLabel)
endfunction
```

---

## hud.remove(obj)

Removes an object from the HUD layer so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
hud.remove(self.scoreLabel)
```

---

## hud.clear()

Removes all HUD objects at once.

```bas
hud.clear()
```
```

- [ ] **Step 4: Update stage.md with deprecation notice**

Replace the full contents of `src/docs/api-reference/stage.md` with:

```markdown
# stage (deprecated)

> **Deprecated:** Use `world` and `hud` instead. `stage.add`, `stage.remove`, and `stage.clear` continue to work but new code should use `world.add`, `world.remove`, and `world.clear`. See the [world](world) and [hud](hud) API reference pages.

The `stage` module adds objects to the game world, removes them, and queries the canvas size.

`stage.add(obj)` → use `world.add(obj)` instead  
`stage.remove(obj)` → use `world.remove(obj)` instead  
`stage.clear()` → use `world.clear()` instead

`stage.width()`, `stage.height()`, and `stage.setBackground()` are not deprecated.

---

## width()

Returns the width of the canvas in pixels.

**Returns:** number

```bas
dim centreX
centreX = stage.width() / 2
```

## height()

Returns the height of the canvas in pixels.

**Returns:** number

```bas
dim centreY
centreY = stage.height() / 2
```

## setBackground(r, g, b)

Sets the background colour of the canvas using red, green, and blue values (0–255 each).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
function onenter()
  stage.setBackground(30, 30, 50)
endfunction
```
```

- [ ] **Step 5: Update manifest.ts — add world, hud, camera; update stage label**

In `src/docs/manifest.ts`, update the softGfx topics array. Replace the current `stage` entry and add the three new pages after it:

```ts
{ slug: 'stage',           title: 'stage (deprecated)', file: 'api-reference/stage.md' },
{ slug: 'world',           title: 'world',           file: 'api-reference/world.md' },
{ slug: 'hud',             title: 'hud',             file: 'api-reference/hud.md' },
{ slug: 'camera',          title: 'camera',          file: 'api-reference/camera.md' },
```

The full softGfx topics array should look like:

```ts
topics: [
  { slug: 'gfx',             title: 'gfx',             file: 'api-reference/gfx.md' },
  { slug: 'input',           title: 'input',           file: 'api-reference/input.md' },
  { slug: 'drawing',         title: 'drawing',         file: 'api-reference/drawing.md' },
  { slug: 'stage',           title: 'stage (deprecated)', file: 'api-reference/stage.md' },
  { slug: 'world',           title: 'world',           file: 'api-reference/world.md' },
  { slug: 'hud',             title: 'hud',             file: 'api-reference/hud.md' },
  { slug: 'camera',          title: 'camera',          file: 'api-reference/camera.md' },
  { slug: 'pen',             title: 'pen',             file: 'api-reference/pen.md' },
  { slug: 'assetmanager',    title: 'assetmanager',    file: 'api-reference/assetmanager.md' },
  { slug: 'objecttransform', title: 'ObjectTransform', file: 'api-reference/objecttransform.md' },
  { slug: 'sprite',          title: 'sprite',          file: 'api-reference/sprite.md' },
  { slug: 'animatedsprite',  title: 'animatedsprite',  file: 'api-reference/animatedsprite.md' },
  { slug: 'text',            title: 'text',            file: 'api-reference/text.md' },
  { slug: 'tilemap',         title: 'tilemap',         file: 'api-reference/tilemap.md' },
  { slug: 'audio',           title: 'audio',           file: 'api-reference/audio.md' },
  { slug: 'collision',       title: 'collision',       file: 'api-reference/collision.md' },
  { slug: 'scene',           title: 'scene / scenemanager', file: 'api-reference/scene.md' },
],
```

- [ ] **Step 6: Replace stage.add → world.add in 14 docs files**

In each file listed below, do a find-and-replace:
- `stage.add(` → `world.add(`
- `stage.remove(` → `world.remove(`

Files to update (no other content changes needed):

1. `src/docs/api-reference/sprite.md`
2. `src/docs/api-reference/animatedsprite.md`
3. `src/docs/api-reference/text.md`
4. `src/docs/api-reference/tilemap.md`
5. `src/docs/api-reference/scene.md`
6. `src/docs/tutorials/03-sprite.md`
7. `src/docs/tutorials/04-motion.md`
8. `src/docs/tutorials/05-keyboard.md`
9. `src/docs/tutorials/06-bounds.md`
10. `src/docs/tutorials/07-score.md`
11. `src/docs/tutorials/08-functions.md`
12. `src/docs/tutorials/09-enemies.md`
13. `src/docs/tutorials/10-classes.md`
14. `src/docs/tutorials/11-dodge.md`

To verify the updates, after editing run:

```bash
grep -rn "stage\.add\|stage\.remove" src/docs/ --include="*.md" --exclude="stage.md"
```

Expected: **zero matches** (only `stage.md` itself should contain these strings, and it's excluded from the check).

- [ ] **Step 7: Build to confirm no errors**

Run: `npx vite build`

Expected: Build completes with no errors.

- [ ] **Step 8: Run full test suite**

Run: `npx vitest run`

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/docs/api-reference/camera.md
git add src/docs/api-reference/world.md
git add src/docs/api-reference/hud.md
git add src/docs/api-reference/stage.md
git add src/docs/manifest.ts
git add src/docs/api-reference/sprite.md
git add src/docs/api-reference/animatedsprite.md
git add src/docs/api-reference/text.md
git add src/docs/api-reference/tilemap.md
git add src/docs/api-reference/scene.md
git add src/docs/tutorials/03-sprite.md
git add src/docs/tutorials/04-motion.md
git add src/docs/tutorials/05-keyboard.md
git add src/docs/tutorials/06-bounds.md
git add src/docs/tutorials/07-score.md
git add src/docs/tutorials/08-functions.md
git add src/docs/tutorials/09-enemies.md
git add src/docs/tutorials/10-classes.md
git add src/docs/tutorials/11-dodge.md
git commit -m "docs: add camera/world/hud API reference, deprecate stage.add, update all tutorials"
```
