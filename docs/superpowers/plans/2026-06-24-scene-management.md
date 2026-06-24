# Scene Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Scene` base class and `SceneManager` module to softBASIC so developers can define named game states as classes, switch between them, and receive lifecycle/key events scoped to the active scene only.

**Architecture:** `Scene.bas` defines a base class with no-op lifecycle hooks that users extend. `SceneManager.bas` is a pure module with `register(name, obj)` and `switch(name)` functions. All runtime behaviour lives in `scene.js` (`_sbScene`), which overrides `_sbLifecycle._update` in the engine spread to route per-tick and per-key events to the active scene only. Scene switches are deferred to end-of-tick to prevent mid-frame corruption; the initial switch is applied synchronously by the bootstrapper before the ticker starts.

**Tech Stack:** TypeScript/Vitest (tests), plain JS (engine module), softBASIC `.bas` syntax (def files), PIXI.js ticker (runtime loop), `postMessage` iframe bridge (error handling).

---

## File map

| File | Change |
|------|--------|
| `tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts` | **Create** — transpiler tests |
| `src/lib/Basic4WebGL/defs/Scene.bas` | **Create** — base class def |
| `src/lib/Basic4WebGL/defs/SceneManager.bas` | **Create** — module def |
| `src/components/Runner/engine/scene.js` | **Create** — runtime engine |
| `src/components/Runner/softBasicEngine.js` | **Modify** — spread `_sbScene` |
| `src/components/Runner/bootstrapper.html` | **Modify** — `_applySwitch()` + scene key routing |
| `src/constants/packageModules.ts` | **Modify** — import both modules |
| `src/constants/firstPartyPackages.ts` | **Modify** — add to softGfx list |
| `src/lib/Basic4WebGL/keywords.ts` | **Modify** — add `'onexit'` to lifecycle events |
| `src/docs/api-reference/scene.md` | **Create** — API reference doc |
| `src/docs/manifest.ts` | **Modify** — add scene to softGfx group |

---

## Task 1: Failing transpiler tests

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const sceneSource        = readFileSync('src/lib/Basic4WebGL/defs/Scene.bas',        'utf-8');
const sceneManagerSource = readFileSync('src/lib/Basic4WebGL/defs/SceneManager.bas', 'utf-8');

const transpileWithScene = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Scene.bas',  source: sceneSource },
      { name: 'Main.bas',   source },
    ],
  });

const transpileWithSceneManager = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'SceneManager', source: sceneManagerSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithBoth = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'SceneManager', source: sceneManagerSource }],
    files: [
      { name: 'Scene.bas', source: sceneSource },
      { name: 'Main.bas',  source },
    ],
  });

// ─── Scene base class ──────────────────────────────────────────────────────────

describe('Scene — class extension', () => {
  test('class extending Scene compiles without error', () => {
    const result = transpileWithScene([
      'class MenuScene extends Scene',
      '  function onenter()',
      '  endfunction',
      '  function onupdate(delta)',
      '  endfunction',
      '  function onexit()',
      '  endfunction',
      'endclass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('class extending Scene with key hooks compiles without error', () => {
    const result = transpileWithScene([
      'class GameScene extends Scene',
      '  function onkeydown(key)',
      '  endfunction',
      '  function onkeyup(key)',
      '  endfunction',
      'endclass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('scene subclass with no methods compiles without error', () => {
    const result = transpileWithScene([
      'class EmptyScene extends Scene',
      'endclass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── SceneManager.register ────────────────────────────────────────────────────

describe('SceneManager — register', () => {
  test('compiles without error', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  dim s',
      '  SceneManager.register("menu", s)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.sceneRegister(', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  dim s',
      '  SceneManager.register("menu", s)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.sceneRegister(');
  });
});

// ─── SceneManager.switch ──────────────────────────────────────────────────────

describe('SceneManager — switch', () => {
  test('compiles without error', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  SceneManager.switch("game")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.sceneSwitch(', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  SceneManager.switch("game")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.sceneSwitch(');
  });
});

// ─── Integration: extend + register + switch ──────────────────────────────────

describe('Scene + SceneManager — integration', () => {
  test('full scene setup compiles without error', () => {
    const result = transpileWithBoth([
      'class MenuScene extends Scene',
      '  function onenter()',
      '  endfunction',
      '  function onupdate(delta)',
      '    SceneManager.switch("game")',
      '  endfunction',
      'endclass',
      'dim menu = new MenuScene()',
      'SceneManager.register("menu", menu)',
      'SceneManager.switch("menu")',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to confirm all tests fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts
```

Expected: all tests fail with `Error: ENOENT: no such file or directory ... Scene.bas` (or similar). This is the correct failure.

---

## Task 2: `Scene.bas` — base class def file

**Files:**
- Create: `src/lib/Basic4WebGL/defs/Scene.bas`

- [ ] **Step 1: Create `Scene.bas`**

```bas
Class

Constructor()
EndConstructor

function onenter()
endfunction

function onupdate(delta)
endfunction

function onexit()
endfunction

function onkeydown(key)
endfunction

function onkeyup(key)
endfunction

EndClass
```

The empty `Constructor() EndConstructor` is required so that `super()` auto-inserted by the transpiler in subclass constructors has a valid target to call.

- [ ] **Step 2: Run the Scene class tests to confirm they pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts -t "Scene —"
```

Expected: the three `Scene — class extension` tests pass. The `SceneManager` and integration tests still fail (SceneManager.bas doesn't exist yet).

---

## Task 3: `SceneManager.bas` — module def file

**Files:**
- Create: `src/lib/Basic4WebGL/defs/SceneManager.bas`

- [ ] **Step 1: Create `SceneManager.bas`**

```bas
function register(name, obj)
    call("_sb.sceneRegister(register_name, register_obj)")
endfunction

function switch(name)
    call("_sb.sceneSwitch(switch_name)")
endfunction
```

- [ ] **Step 2: Run the full test suite to confirm all scene tests now pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 3: Run the full test suite to confirm nothing is broken**

```
npx vitest run
```

Expected: all existing tests still pass plus the 8 new scene tests.

- [ ] **Step 4: Commit**

```
git add src/lib/Basic4WebGL/defs/Scene.bas src/lib/Basic4WebGL/defs/SceneManager.bas tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts
git commit -m "feat: add Scene.bas and SceneManager.bas def files with transpiler tests"
```

---

## Task 4: `scene.js` — engine module

**Files:**
- Create: `src/components/Runner/engine/scene.js`

- [ ] **Step 1: Create `scene.js`**

```js
const _sbScene = {
  _scenes: {},
  _activeScene: null,
  _pendingSwitch: null,

  sceneRegister(name, obj) {
    this._scenes[name] = obj;
  },

  sceneSwitch(name) {
    if (!this._scenes[name]) throw new Error(`Scene not found: "${name}"`);
    this._pendingSwitch = name;
  },

  _applySwitch() {
    if (!this._pendingSwitch) return;
    const name = this._pendingSwitch;
    this._pendingSwitch = null;
    if (this._activeScene && this._activeScene.onexit) {
      try { this._activeScene.onexit(); } catch(e) { _throwError(e); }
    }
    this.clear();
    this._activeScene = this._scenes[name];
    if (this._activeScene && this._activeScene.onenter) {
      try { this._activeScene.onenter(); } catch(e) { _throwError(e); }
    }
  },

  _sceneKeyDown(keyCode) {
    if (this._activeScene && this._activeScene.onkeydown) {
      try { this._activeScene.onkeydown(keyCode); } catch(e) { _throwError(e); }
    }
  },

  _sceneKeyUp(keyCode) {
    if (this._activeScene && this._activeScene.onkeyup) {
      try { this._activeScene.onkeyup(keyCode); } catch(e) { _throwError(e); }
    }
  },

  _update(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
  },
};
```

`_update` overrides `_sbLifecycle._update` in the `_sb` spread (since `_sbScene` is spread after `_sbLifecycle`). It chains to `_sbLifecycle._update` to preserve existing top-level class lifecycle, then delegates to the active scene, then applies any pending switch.

`this.clear()` in `_applySwitch` resolves to `_sbStage.clear()` via the spread — it removes all children from the PIXI stage and clears `_sbLifecycle._sbInstances`.

- [ ] **Step 2: Commit**

```
git add src/components/Runner/engine/scene.js
git commit -m "feat: add scene.js engine module"
```

---

## Task 5: Wire engine into bootstrapper

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/bootstrapper.html`

- [ ] **Step 1: Add `_sbScene` to `softBasicEngine.js`**

Current file content:
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

Replace with:
```js
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
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

`_sbScene` must come after `_sbLifecycle` so its `_update` override takes effect, and before `_sbStage` so `_sbScene._applySwitch` can call `this.clear()` which resolves via the spread.

- [ ] **Step 2: Add `_applySwitch()` call and scene key routing to `bootstrapper.html`**

Locate the block in `bootstrapper.html` that looks like:

```js
          //${transpiled};

          // Key listeners are registered after the transpiled code so that
          // _sbClasses is populated and onkeydown/onkeyup resolve correctly.
          document.addEventListener('keydown', (e) => {
            _sb.registerKey(e.keyCode, true);
            _sb._sbClasses.forEach((c) => { if (c.symbol.onkeydown) c.symbol.onkeydown(e.keyCode); });
            _sb._sbInstances.forEach((inst) => { if (inst.onkeydown) inst.onkeydown(e.keyCode); });
          });
          document.addEventListener('keyup', (e) => {
            _sb.registerKey(e.keyCode, false);
            _sb._sbClasses.forEach((c) => { if (c.symbol.onkeyup) c.symbol.onkeyup(e.keyCode); });
            _sb._sbInstances.forEach((inst) => { if (inst.onkeyup) inst.onkeyup(e.keyCode); });
          });
```

Replace with:

```js
          //${transpiled};

          // Apply any scene switch queued during transpiled startup code
          // so the initial scene's onenter fires before the first frame.
          _sb._applySwitch();

          // Key listeners are registered after the transpiled code so that
          // _sbClasses is populated and onkeydown/onkeyup resolve correctly.
          document.addEventListener('keydown', (e) => {
            _sb.registerKey(e.keyCode, true);
            _sb._sbClasses.forEach((c) => { if (c.symbol.onkeydown) c.symbol.onkeydown(e.keyCode); });
            _sb._sbInstances.forEach((inst) => { if (inst.onkeydown) inst.onkeydown(e.keyCode); });
            _sb._sceneKeyDown(e.keyCode);
          });
          document.addEventListener('keyup', (e) => {
            _sb.registerKey(e.keyCode, false);
            _sb._sbClasses.forEach((c) => { if (c.symbol.onkeyup) c.symbol.onkeyup(e.keyCode); });
            _sb._sbInstances.forEach((inst) => { if (inst.onkeyup) inst.onkeyup(e.keyCode); });
            _sb._sceneKeyUp(e.keyCode);
          });
```

- [ ] **Step 3: Run the full test suite to confirm nothing is broken**

```
npx vitest run
```

Expected: all tests still pass. The bootstrapper is not exercised by unit tests so no new passes expected here.

- [ ] **Step 4: Commit**

```
git add src/components/Runner/softBasicEngine.js src/components/Runner/bootstrapper.html
git commit -m "feat: wire scene engine into bootstrapper — applySwitch on init, scene key routing"
```

---

## Task 6: Package registration and keyword update

**Files:**
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`
- Modify: `src/lib/Basic4WebGL/keywords.ts`

- [ ] **Step 1: Update `packageModules.ts`**

Current file:
```ts
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
import array from '../lib/Basic4WebGL/defs/array.bas?raw';
import gfx from '../lib/Basic4WebGL/defs/gfx.bas?raw';
import input from '../lib/Basic4WebGL/defs/input.bas?raw';
import drawing from '../lib/Basic4WebGL/defs/drawing.bas?raw';
import stage from '../lib/Basic4WebGL/defs/stage.bas?raw';
import pen from '../lib/Basic4WebGL/defs/pen.bas?raw';
import text from '../lib/Basic4WebGL/defs/text.bas?raw';
import assetmanager from '../lib/Basic4WebGL/defs/assetmanager.bas?raw';
import ObjectTransform from '../lib/Basic4WebGL/defs/transform.bas?raw';
import sprite from '../lib/Basic4WebGL/defs/sprite.bas?raw';
import animatedsprite from '../lib/Basic4WebGL/defs/animatedsprite.bas?raw';
import tilemap from '../lib/Basic4WebGL/defs/tilemap.bas?raw';
import audio from '../lib/Basic4WebGL/defs/audio.bas?raw';
import collision from '../lib/Basic4WebGL/defs/collision.bas?raw';
import rayhit from '../lib/Basic4WebGL/defs/rayhit.bas?raw';

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
};
```

Add the two new imports and entries:

```ts
import math from '../lib/Basic4WebGL/defs/math.bas?raw';
import string from '../lib/Basic4WebGL/defs/string.bas?raw';
import array from '../lib/Basic4WebGL/defs/array.bas?raw';
import gfx from '../lib/Basic4WebGL/defs/gfx.bas?raw';
import input from '../lib/Basic4WebGL/defs/input.bas?raw';
import drawing from '../lib/Basic4WebGL/defs/drawing.bas?raw';
import stage from '../lib/Basic4WebGL/defs/stage.bas?raw';
import pen from '../lib/Basic4WebGL/defs/pen.bas?raw';
import text from '../lib/Basic4WebGL/defs/text.bas?raw';
import assetmanager from '../lib/Basic4WebGL/defs/assetmanager.bas?raw';
import ObjectTransform from '../lib/Basic4WebGL/defs/transform.bas?raw';
import sprite from '../lib/Basic4WebGL/defs/sprite.bas?raw';
import animatedsprite from '../lib/Basic4WebGL/defs/animatedsprite.bas?raw';
import tilemap from '../lib/Basic4WebGL/defs/tilemap.bas?raw';
import audio from '../lib/Basic4WebGL/defs/audio.bas?raw';
import collision from '../lib/Basic4WebGL/defs/collision.bas?raw';
import rayhit from '../lib/Basic4WebGL/defs/rayhit.bas?raw';
import Scene from '../lib/Basic4WebGL/defs/Scene.bas?raw';
import SceneManager from '../lib/Basic4WebGL/defs/SceneManager.bas?raw';

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
  Scene,
  SceneManager,
};
```

- [ ] **Step 2: Update `firstPartyPackages.ts`**

Current softGfx `moduleNames` array:
```ts
moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'audio', 'collision', 'rayhit'],
```

Replace with:
```ts
moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'audio', 'collision', 'rayhit', 'Scene', 'SceneManager'],
```

- [ ] **Step 3: Update `keywords.ts` — add `'onexit'` to lifecycle events**

Current:
```ts
export const SOFTBASIC_LIFECYCLE_EVENTS = [
  'onenter',
  'onupdate',
  'onkeydown',
  'onkeyup',
  'onpointerdown',
  'onpointermove',
] as const;
```

Replace with:
```ts
export const SOFTBASIC_LIFECYCLE_EVENTS = [
  'onenter',
  'onupdate',
  'onexit',
  'onkeydown',
  'onkeyup',
  'onpointerdown',
  'onpointermove',
] as const;
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Verify the build succeeds**

```
npx vite build
```

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```
git add src/constants/packageModules.ts src/constants/firstPartyPackages.ts src/lib/Basic4WebGL/keywords.ts
git commit -m "feat: register Scene and SceneManager in softGfx package, add onexit lifecycle event"
```

---

## Task 7: Documentation

**Files:**
- Create: `src/docs/api-reference/scene.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Create `src/docs/api-reference/scene.md`**

```markdown
# Scene and SceneManager

The `Scene` class and `SceneManager` module let you divide your game into named states — such as a title screen, the main game, and a game-over screen — and switch between them cleanly. Include the **softGfx** package to use them.

---

## The Scene base class

Define each game state as a class that extends `Scene`. Override only the lifecycle methods you need — the others are silent no-ops by default.

```bas
class MenuScene extends Scene

  function onenter()
    ' runs once when this scene becomes active
  endfunction

  function onupdate(delta)
    ' runs every frame while this scene is active
  endfunction

  function onexit()
    ' runs once just before leaving this scene
    ' the stage is cleared automatically after this returns
  endfunction

  function onkeydown(key)
    ' runs when a key is pressed, while this scene is active
  endfunction

  function onkeyup(key)
    ' runs when a key is released, while this scene is active
  endfunction

endclass
```

### Lifecycle hooks

| Method | When it runs |
|--------|-------------|
| `onenter()` | Once, when this scene becomes the active scene |
| `onupdate(delta)` | Every frame, while this scene is active |
| `onexit()` | Once, just before leaving this scene |
| `onkeydown(key)` | On each keypress, while this scene is active |
| `onkeyup(key)` | On each key release, while this scene is active |

Key events are scoped to the active scene — `onkeydown` and `onkeyup` only fire on the scene that is currently active.

**Stage auto-clear:** when switching scenes, the stage is cleared automatically after `onexit` returns. Any sprites, text, or tilemaps from the previous scene are removed. Re-add what you need in the new scene's `onenter`.

---

## SceneManager.register(name, obj)

Associates a name string with a scene object. Call this for each scene before switching to any of them.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | A name for this scene, used with `SceneManager.switch` |
| obj       | object | An instance of a class that extends `Scene` |

```bas
dim menu = new MenuScene()
SceneManager.register("menu", menu)
```

---

## SceneManager.switch(name)

Switches to the named scene. The switch is applied at the end of the current frame, so it is safe to call from inside `onupdate`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The name passed to `SceneManager.register` |

```bas
SceneManager.switch("game")
```

---

## Example: menu → game → game-over

```bas
' MenuScene.bas
class MenuScene extends Scene

  dim titleText

  function onenter()
    self.titleText = new text("SPACE SHOOTER")
    self.titleText.setPosition(320, 140)
    self.titleText.setStyle(36, "#ffffff")
    stage.add(self.titleText)
    dim prompt = new text("Press SPACE to start")
    prompt.setPosition(320, 220)
    prompt.setStyle(20, "#aaaaaa")
    stage.add(prompt)
  endfunction

  function onkeydown(key)
    if key = 32 then SceneManager.switch("game")
  endfunction

endclass

' GameScene.bas
class GameScene extends Scene

  dim player
  dim score
  dim scoreText

  function onenter()
    self.player = new sprite("ship.png")
    self.player.setPosition(320, 300)
    stage.add(self.player)
    self.score = 0
    self.scoreText = new text("0")
    self.scoreText.setPosition(20, 20)
    stage.add(self.scoreText)
  endfunction

  function onupdate(delta)
    ' move player, update score, check collisions...
    if self.score >= 100 then SceneManager.switch("gameover")
  endfunction

endclass

' GameOverScene.bas
class GameOverScene extends Scene

  function onenter()
    dim msg = new text("GAME OVER")
    msg.setPosition(320, 180)
    msg.setStyle(48, "#ff4444")
    stage.add(msg)
  endfunction

  function onkeydown(key)
    if key = 32 then SceneManager.switch("menu")
  endfunction

endclass

' Main.bas (depends on MenuScene, GameScene, GameOverScene)
dim menu    = new MenuScene()
dim game    = new GameScene()
dim gameover = new GameOverScene()
SceneManager.register("menu",     menu)
SceneManager.register("game",     game)
SceneManager.register("gameover", gameover)
SceneManager.switch("menu")
```
```

- [ ] **Step 2: Add scene to the softGfx group in `src/docs/manifest.ts`**

In `src/docs/manifest.ts`, locate the softGfx topics array:

```ts
{
  label: 'softGfx',
  topics: [
    { slug: 'gfx',             title: 'gfx',             file: 'api-reference/gfx.md' },
    { slug: 'input',           title: 'input',           file: 'api-reference/input.md' },
    { slug: 'drawing',         title: 'drawing',         file: 'api-reference/drawing.md' },
    { slug: 'stage',           title: 'stage',           file: 'api-reference/stage.md' },
    { slug: 'pen',             title: 'pen',             file: 'api-reference/pen.md' },
    { slug: 'assetmanager',    title: 'assetmanager',    file: 'api-reference/assetmanager.md' },
    { slug: 'objecttransform', title: 'ObjectTransform', file: 'api-reference/objecttransform.md' },
    { slug: 'sprite',          title: 'sprite',          file: 'api-reference/sprite.md' },
    { slug: 'animatedsprite',  title: 'animatedsprite',  file: 'api-reference/animatedsprite.md' },
    { slug: 'text',            title: 'text',            file: 'api-reference/text.md' },
    { slug: 'tilemap',         title: 'tilemap',         file: 'api-reference/tilemap.md' },
    { slug: 'audio',           title: 'audio',           file: 'api-reference/audio.md' },
    { slug: 'collision',       title: 'collision',       file: 'api-reference/collision.md' },
  ],
},
```

Add the scene entry at the end of the topics array:

```ts
{
  label: 'softGfx',
  topics: [
    { slug: 'gfx',             title: 'gfx',             file: 'api-reference/gfx.md' },
    { slug: 'input',           title: 'input',           file: 'api-reference/input.md' },
    { slug: 'drawing',         title: 'drawing',         file: 'api-reference/drawing.md' },
    { slug: 'stage',           title: 'stage',           file: 'api-reference/stage.md' },
    { slug: 'pen',             title: 'pen',             file: 'api-reference/pen.md' },
    { slug: 'assetmanager',    title: 'assetmanager',    file: 'api-reference/assetmanager.md' },
    { slug: 'objecttransform', title: 'ObjectTransform', file: 'api-reference/objecttransform.md' },
    { slug: 'sprite',          title: 'sprite',          file: 'api-reference/sprite.md' },
    { slug: 'animatedsprite',  title: 'animatedsprite',  file: 'api-reference/animatedsprite.md' },
    { slug: 'text',            title: 'text',            file: 'api-reference/text.md' },
    { slug: 'tilemap',         title: 'tilemap',         file: 'api-reference/tilemap.md' },
    { slug: 'audio',           title: 'audio',           file: 'api-reference/audio.md' },
    { slug: 'collision',       title: 'collision',       file: 'api-reference/collision.md' },
    { slug: 'scene',           title: 'Scene / SceneManager', file: 'api-reference/scene.md' },
  ],
},
```

- [ ] **Step 3: Run the full test suite one final time**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Verify the build succeeds**

```
npx vite build
```

Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```
git add src/docs/api-reference/scene.md src/docs/manifest.ts
git commit -m "docs: add Scene / SceneManager API reference"
```
