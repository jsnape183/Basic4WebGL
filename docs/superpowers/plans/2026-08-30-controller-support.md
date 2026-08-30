# Controller Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gamepad support to softBASIC through an action-map API on the `input` module (bind named actions to keys/buttons/axes, then query actions) plus a new `controller` constant module, so keyboard and controller are interchangeable in game logic with zero branching.

**Architecture:** Game code calls `input.bind("jump", "key", keyboard.SPACE)` / `input.bind("jump", "button", controller.A)` once at startup, then queries `input.held/pressed/released/strength/axis`. The engine polls `navigator.getGamepads()` at the top of every fixed step, folds the snapshot into the same just-pressed/just-released model the keyboard already uses (in a separate `"b0"`/`"h3"` key namespace), and the query helpers resolve each action across all its bound sources. `controller` is a pure constant module (no functions, no engine file) — button indices and stick half-direction indices per the W3C standard gamepad mapping.

**Tech Stack:** TypeScript/React frontend, softBASIC transpiler (`src/lib/Basic4WebGL`), PIXI-based runtime engine (`src/components/Runner/engine/*.js`, plain scripts concatenated into `bootstrapper.html`), Vitest for unit tests, Cypress for manual e2e.

**Dependency:** This plan **depends on** `docs/superpowers/plans/2026-08-30-softbasic-constants.md` (the softBASIC named-constants mechanism — `const … endconst`, module-qualified constant resolution via the extended `ModuleRule`, and the hand-written `keyboard` constant def module). Every task below assumes that plan has already landed on `main`: `const … endconst` parses, `keyboard.SPACE` resolves and emits `_const_keyboard.SPACE`, and `src/lib/Basic4WebGL/defs/keyboard.bas` exists and is registered in `packageModules.ts`. Do not start this plan until that one is merged.

**Source of truth:** `docs/superpowers/specs/2026-08-30-controller-support-design.md`.

**Verification commands for this repo:**
- Tests: `npx vitest run` (single pass). Target one file: `npx vitest run tests/path/to/file.test.ts`.
- Build: `npx vite build` (NOT `tsc --noEmit` — it has pre-existing unrelated env errors).
- Cypress: `npm run dev` in one terminal, then `npm run cypress:run` in another. Manual only — not in CI, will not run automatically.

---

## File Structure

**Created:**

| Path | Responsibility |
|------|----------------|
| `src/lib/Basic4WebGL/defs/controller.bas` | Hand-written constant def module: gamepad button + stick half-direction constants. One `const … endconst` block, no functions. |
| `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts` | Transpiler unit tests for every new `input.*` call, including calls that pass `controller.*` / `keyboard.*` constants as the `code` argument. |
| `tests/components/Runner/engine/input.test.ts` | Engine unit tests for `_sbInput`: deadzone rescale, button edges, analog→digital crossover, `strength` max, `axis` arithmetic/clamp, keyboard-only path. Uses a mocked `navigator.getGamepads`. |
| `src/docs/api-reference/controller.md` | API Reference page for the `controller` constant module — button + axis-half tables, standard-mapping note and limitations. |
| `src/docs/language-guide/input.md` | New Language Guide topic teaching the action map as the primary input model. (The spec calls for "Language Guide input topic — updated"; no such topic exists today, so it is created here.) |

**Modified:**

| Path | Change |
|------|--------|
| `src/constants/packageModules.ts` | `import` + register `controller`. |
| `src/constants/firstPartyPackages.ts` | Add `controller` to the `softgfx` package `moduleNames` (alongside `input` and `keyboard`); bump the `softgfx` `version` if the constants plan has not already bumped it for this batch. |
| `src/lib/Basic4WebGL/defs/input.bas` | Add `bind`, `clearBindings`, `held`, `pressed`, `released`, `strength`, `axis`, `padConnected`, `setDeadzone`. Keep `getKeyDown`/`keyPressed`/`keyReleased`/`mouseX`/`mouseY`/`mouseDown` unchanged. |
| `src/components/Runner/engine/input.js` | Add pad state + `bind`, `clearBindings`, `_pollGamepads`, `setDeadzone`, `padConnected`, the `_digital`/`held`/`pressed`/`released`/`strength`/`axis` helpers; extend `_resetFrameInput` to roll pad prev-state. |
| `src/components/Runner/engine/scene.js` | Call `this._pollGamepads()` at the top of `_fixedStep`. |
| `src/components/Runner/bootstrapper.html` | Add `gamepadconnected` / `gamepaddisconnected` window listeners. |
| `tests/components/Runner/scene.test.ts` | Stub `_pollGamepads` in `loadScene`, add a wiring assertion. |
| `tests/components/Runner/bootstrapper.test.ts` | Assert the two gamepad listeners are present in the template. |
| `cypress/e2e/tutorials.cy.ts` | New `describe` block seeding a hand-written project that drives the action map on the keyboard path. |
| `src/docs/api-reference/input.md` | Restructure: action-map section first, deprecated `getKeyDown`/`keyPressed`/`keyReleased` moved to a "Deprecated" section at the bottom with migration examples. |
| `src/docs/manifest.ts` | Add `controller` to the API Reference `softGfx` group; add `input` (action map) to the Language Guide topic list. |
| `docs/language/library-roadmap.md` | Mark controller/gamepad support delivered; add the three tracked follow-ups. |
| `src/docs/roadmap.md` | Reflect the same in the public-facing summary. |

**Notes on two deviations from the spec's literal wording, and why:**

1. **Engine test location.** The spec and the task brief both name `tests/components/Runner/engine/input.test.ts`. Every existing engine test actually lives one level up (`tests/components/Runner/*.test.ts`, e.g. `scene.test.ts`, `collision.test.ts`) even though the engine sources are in `src/components/Runner/engine/`. This plan follows the spec's path (`tests/components/Runner/engine/input.test.ts`) since it is also the true mirror of `src/components/Runner/engine/input.js`. If a reviewer prefers the flat sibling location, moving the file is a one-line `git mv` and a path change in Task 12's commands — nothing else depends on the location.
2. **`controller` package.** The spec says register `controller` "as a package" and add it "to the API Reference group" but does not name the package. **Confirmed by the coordinator:** `controller` goes in **softGfx**, alongside `input` and `keyboard`. softGfx is "the game engine package"; softCore stays lean (math/string/array/dict/file/save). The constants plan places `keyboard` in softGfx too (not softCore).

---

## Task 1: `controller` constant def module

**Files:**
- Create: `src/lib/Basic4WebGL/defs/controller.bas`
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts:18`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts` (created here; grows in Task 3)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../../../../src/constants/packageModules';

const keyboardSource = readFileSync('src/lib/Basic4WebGL/defs/keyboard.bas', 'utf-8');
const controllerSource = readFileSync('src/lib/Basic4WebGL/defs/controller.bas', 'utf-8');
const inputSource = readFileSync('src/lib/Basic4WebGL/defs/input.bas', 'utf-8');

/** Transpile a Main.bas body with keyboard + controller + input defs in scope. */
const transpileMain = (body: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'keyboard.bas', source: keyboardSource },
      { name: 'controller.bas', source: controllerSource },
      { name: 'input.bas', source: inputSource },
      { name: 'Main.bas', source: body },
    ],
  });

// ─── controller module registration ──────────────────────────────────────────

describe('controller — registration', () => {
  test('packageModules["controller"] resolves to real source', () => {
    expect(packageModules.controller).toBeTypeOf('string');
    expect(packageModules.controller).toContain('const');
    expect(packageModules.controller).toContain('endconst');
  });
});

// ─── controller constants resolve and emit ───────────────────────────────────

describe('controller — constant references', () => {
  test('controller.A compiles with zero diagnostics', () => {
    const result = transpileMain(
      'function test()\n  dim n\n  n = controller.A\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('controller.A emits _const_controller.A', () => {
    const result = transpileMain(
      'function test()\n  dim n\n  n = controller.A\nendfunction'
    );
    expect(result.code).toContain('_const_controller.A');
  });

  test('controller.RSTICK_RIGHT (axis half) compiles with zero diagnostics', () => {
    const result = transpileMain(
      'function test()\n  dim n\n  n = controller.RSTICK_RIGHT\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`
Expected: FAIL — `ENOENT` reading `src/lib/Basic4WebGL/defs/controller.bas`, and `packageModules.controller` is `undefined`.

- [ ] **Step 3: Create the def file**

Create `src/lib/Basic4WebGL/defs/controller.bas`:

```basic
' controller — named gamepad button and stick-axis constants for input.bind.
' Standard-mapping controllers only (Xbox, PlayStation, and most modern pads).
' Button constants are used with device = "button"; the *_LEFT/_RIGHT/_UP/_DOWN
' stick constants are used with device = "axis".
const
    A = 0
    B = 1
    X = 2
    Y = 3
    LB = 4
    RB = 5
    LT = 6
    RT = 7
    BACK = 8
    START = 9
    LSTICK = 10
    RSTICK = 11
    DPAD_UP = 12
    DPAD_DOWN = 13
    DPAD_LEFT = 14
    DPAD_RIGHT = 15
    GUIDE = 16
    LSTICK_LEFT = 0
    LSTICK_RIGHT = 1
    LSTICK_UP = 2
    LSTICK_DOWN = 3
    RSTICK_LEFT = 4
    RSTICK_RIGHT = 5
    RSTICK_UP = 6
    RSTICK_DOWN = 7
endconst
```

- [ ] **Step 4: Register the module**

In `src/constants/packageModules.ts`, add the import next to the other `defs/*.bas?raw` imports (alphabetical-ish, near `collision`):

```ts
import controller from '../lib/Basic4WebGL/defs/controller.bas?raw';
```

and add `controller,` to the `packageModules` object literal (next to `collision,`):

```ts
  collision,
  controller,
  pathfinding,
```

- [ ] **Step 5: Add to the softGfx package and bump its version**

`controller` lives in **softGfx** — the "game engine" package — alongside `input` and `keyboard`. softCore stays lean (math/string/array/dict/file/save only).

**Ordering note:** the constants plan (`docs/superpowers/plans/2026-08-30-softbasic-constants.md`) runs first and adds `'keyboard'` to this same `softgfx` `moduleNames` array and bumps the `softgfx` `version`. So by the time this plan runs, `moduleNames` already contains `'keyboard'` and `version` may already be a fresh number. This step is therefore **additive and conditional**:

- Add `'controller'` to the `softgfx` `moduleNames` array, immediately after `'keyboard'` (which the constants plan placed after `'input'`). If `'keyboard'` is somehow not present (constants plan not yet merged — do not proceed in that case, per the plan header), add `'controller'` after `'input'`.
- Bump the `softgfx` `version` field by one patch level **only if it has not already been bumped since `main`** for this batch of work. Check `git log -p -- src/constants/firstPartyPackages.ts` / compare against `origin/main`: if the constants plan already moved it from `2.7.0` to e.g. `2.8.0`, leave it — one bump covers both new modules. If it is still at its pre-batch value, bump the patch digit (`2.7.0` → `2.7.1`, or `2.8.0` → `2.8.1` if constants bumped the minor).

Resulting array (assuming the constants plan has run and added `'keyboard'`):

```ts
    moduleNames: ['gfx', 'input', 'keyboard', 'controller', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'tilemaplayer', 'tilemapset', 'audio', 'collision', 'pathfinding', 'marker', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud', 'Keyframe', 'tween', 'Emitter'],
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 7: Run the full suite (constant-module registration can affect other tests)**

Run: `npx vitest run`
Expected: PASS — no regressions. If a "package module count" or "registered defs" snapshot test fails, update the snapshot to include `controller`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/controller.bas src/constants/packageModules.ts src/constants/firstPartyPackages.ts tests/lib/Basic4WebGL/unit/transpiler/input.test.ts
git commit -m "feat: add controller constant module (gamepad button + axis constants)"
```

---

## Task 2: `input.bas` — new action-map function declarations

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/input.bas`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`

`input.bas` is hand-written (NOT descriptor-generated — it is not in `src/lib/Basic4WebGL/library/registry.ts`), so edit it directly.

- [ ] **Step 1: Write the failing tests**

Append to `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`:

```ts
// ─── input.bind ──────────────────────────────────────────────────────────────

describe('input.bind', () => {
  test('compiles with zero diagnostics', () => {
    const result = transpileMain([
      'function oncreate()',
      '  input.bind("jump", "key", 32)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.bind(', () => {
    const result = transpileMain([
      'function oncreate()',
      '  input.bind("jump", "key", 32)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.bind(');
  });

  test('accepts a keyboard.* constant as the code argument', () => {
    const result = transpileMain([
      'function oncreate()',
      '  input.bind("jump", "key", keyboard.SPACE)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keyboard.SPACE');
  });

  test('accepts a controller.* button constant as the code argument', () => {
    const result = transpileMain([
      'function oncreate()',
      '  input.bind("jump", "button", controller.A)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_controller.A');
  });

  test('accepts a controller.* axis-half constant as the code argument', () => {
    const result = transpileMain([
      'function oncreate()',
      '  input.bind("aim_right", "axis", controller.RSTICK_RIGHT)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_controller.RSTICK_RIGHT');
  });
});

// ─── input.clearBindings ─────────────────────────────────────────────────────

describe('input.clearBindings', () => {
  test('compiles and emits _sb.clearBindings(', () => {
    const result = transpileMain([
      'function rebind()',
      '  input.clearBindings("jump")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.clearBindings(');
  });
});

// ─── digital queries ─────────────────────────────────────────────────────────

describe('input.held / pressed / released', () => {
  test('input.held emits _sb.held(', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  dim h',
      '  h = input.held("fire")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.held(');
  });

  test('input.pressed emits _sb.pressed(', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  if input.pressed("jump") then',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.pressed(');
  });

  test('input.released emits _sb.released(', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  if input.released("charge") then',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.released(');
  });
});

// ─── analog queries ──────────────────────────────────────────────────────────

describe('input.strength / axis', () => {
  test('input.strength emits _sb.strength(', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  dim s',
      '  s = input.strength("fire")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.strength(');
  });

  test('input.axis emits _sb.axis(', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  dim move',
      '  move = input.axis("move_left", "move_right")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.axis(');
  });
});

// ─── pad status ──────────────────────────────────────────────────────────────

describe('input.padConnected / setDeadzone', () => {
  test('input.padConnected emits _sb.padConnected(', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  dim p',
      '  p = input.padConnected()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.padConnected(');
  });

  test('input.setDeadzone emits _sb.setDeadzone(', () => {
    const result = transpileMain([
      'function oncreate()',
      '  input.setDeadzone(0.2)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.setDeadzone(');
  });
});

// ─── deprecated functions still work ─────────────────────────────────────────

describe('input — deprecated functions still compile', () => {
  test('getKeyDown / keyPressed / keyReleased unchanged', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  dim a',
      '  a = input.getKeyDown(37)',
      '  a = input.keyPressed(38)',
      '  a = input.keyReleased(39)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.getKeyDown(');
    expect(result.code).toContain('_sb.keyPressed(');
    expect(result.code).toContain('_sb.keyReleased(');
  });

  test('getKeyDown accepts a keyboard.* constant', () => {
    const result = transpileMain([
      'function onupdate(delta)',
      '  dim a',
      '  a = input.getKeyDown(keyboard.LEFT)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keyboard.LEFT');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`
Expected: FAIL — the new `describe` blocks report diagnostics like `Unknown function 'bind' on module 'input'` (or similar). The Task 1 `controller` tests and the `getKeyDown` deprecated tests still pass.

- [ ] **Step 3: Add the function declarations**

Edit `src/lib/Basic4WebGL/defs/input.bas`. Keep the existing 6 functions exactly as they are, and add these **above** `getKeyDown` (action-map first, matching the docs restructure):

```basic
function bind(action, device, code)
    call("_sb.bind(bind_action, bind_device, bind_code)")
endfunction

function clearBindings(action)
    call("_sb.clearBindings(clearbindings_action)")
endfunction

function held(action)
    return call("_sb.held(held_action)")
endfunction

function pressed(action)
    return call("_sb.pressed(pressed_action)")
endfunction

function released(action)
    return call("_sb.released(released_action)")
endfunction

function strength(action)
    return call("_sb.strength(strength_action)")
endfunction

function axis(negAction, posAction)
    return call("_sb.axis(axis_negAction, axis_posAction)")
endfunction

function padConnected()
    return call("_sb.padConnected()")
endfunction

function setDeadzone(value)
    call("_sb.setDeadzone(setdeadzone_value)")
endfunction

```

The full file, after the edit, is:

```basic
function bind(action, device, code)
    call("_sb.bind(bind_action, bind_device, bind_code)")
endfunction

function clearBindings(action)
    call("_sb.clearBindings(clearbindings_action)")
endfunction

function held(action)
    return call("_sb.held(held_action)")
endfunction

function pressed(action)
    return call("_sb.pressed(pressed_action)")
endfunction

function released(action)
    return call("_sb.released(released_action)")
endfunction

function strength(action)
    return call("_sb.strength(strength_action)")
endfunction

function axis(negAction, posAction)
    return call("_sb.axis(axis_negAction, axis_posAction)")
endfunction

function padConnected()
    return call("_sb.padConnected()")
endfunction

function setDeadzone(value)
    call("_sb.setDeadzone(setdeadzone_value)")
endfunction

function getKeyDown(keycode)
    return call("_sb.getKeyDown(getkeydown_keycode)")
endfunction

function keyPressed(keycode)
    return call("_sb.keyPressed(keypressed_keycode)")
endfunction

function keyReleased(keycode)
    return call("_sb.keyReleased(keyreleased_keycode)")
endfunction

function mouseX()
    return call("_sb.getMouseX()")
endfunction

function mouseY()
    return call("_sb.getMouseY()")
endfunction

function mouseDown()
    return call("_sb.getMouseDown()")
endfunction
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`
Expected: PASS — all `describe` blocks green.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS. If `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` has an input-function-count assertion, update it for the 9 new functions.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/defs/input.bas tests/lib/Basic4WebGL/unit/transpiler/input.test.ts
git commit -m "feat: add action-map + gamepad function declarations to input.bas"
```

---

## Task 3: Engine — pad state + `bind` / `clearBindings`

**Files:**
- Modify: `src/components/Runner/engine/input.js`
- Test: `tests/components/Runner/engine/input.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/components/Runner/engine/input.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect, vi, afterEach } from 'vitest';

// engine/input.js is a plain script — it declares a bare `const _sbInput = { ... }`.
// Evaluate it in a Function context and return the object, the same technique
// scene.test.ts / collision.test.ts use for the other engine modules.
function loadInput() {
  const src = readFileSync('src/components/Runner/engine/input.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbInput;`);
  return factory() as any;
}

/** A standard-mapping gamepad snapshot. `buttons` entries may be a number
 *  (shorthand: value, pressed = value >= 0.5) or a full { pressed, value }. */
function makePad({ buttons = [], axes = [0, 0, 0, 0] }: { buttons?: any[]; axes?: number[] } = {}) {
  return {
    mapping: 'standard',
    connected: true,
    buttons: Array.from({ length: 17 }, (_, i) => {
      const b = buttons[i];
      if (b == null) return { pressed: false, value: 0 };
      if (typeof b === 'number') return { pressed: b >= 0.5, value: b };
      return b;
    }),
    axes: [axes[0] ?? 0, axes[1] ?? 0, axes[2] ?? 0, axes[3] ?? 0],
  };
}

function setPads(pads: any[]) {
  vi.stubGlobal('navigator', { getGamepads: () => pads });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── bind / clearBindings ────────────────────────────────────────────────────

describe('_sbInput.bind', () => {
  test('stores a binding under the action name', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    expect(inp._actions.jump).toEqual([{ device: 'key', code: 32 }]);
  });

  test('appends multiple bindings for one action', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.bind('jump', 'button', 0);
    expect(inp._actions.jump).toEqual([
      { device: 'key', code: 32 },
      { device: 'button', code: 0 },
    ]);
  });

  test('throws on an unknown device string', () => {
    const inp = loadInput();
    expect(() => inp.bind('jump', 'joystick', 0)).toThrow(/unknown device/i);
  });
});

describe('_sbInput.clearBindings', () => {
  test('empties an action without deleting the key', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.clearBindings('jump');
    expect(inp._actions.jump).toEqual([]);
  });
});

describe('_sbInput — pad state defaults', () => {
  test('starts with no pad connected and empty pad tables', () => {
    const inp = loadInput();
    expect(inp._padConnected).toBe(false);
    expect(inp._deadzone).toBeCloseTo(0.15);
    expect(inp._axisThreshold).toBeCloseTo(0.5);
    expect(inp._padButtons).toEqual([]);
    expect(inp._padAxisHalves).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: FAIL — `inp.bind is not a function`, `inp._actions` undefined.

- [ ] **Step 3: Add state and the two methods**

Edit `src/components/Runner/engine/input.js`. Add the new fields right after `_mouseDown: false,` and add the methods after `keyReleased(...)`. The file becomes:

```js
const _sbInput = {
  _keys: {},
  _justPressed: {},
  _justReleased: {},
  _mouseX: 0,
  _mouseY: 0,
  _mouseDown: false,

  // ── Action map (bind + query) ──────────────────────────────────────────────
  // _actions: { actionName: [ { device: "key"|"button"|"axis", code: number } ] }
  _actions: {},
  _deadzone: 0.15,
  _axisThreshold: 0.5, // analog -> digital crossover, fixed
  _padButtons: [],        // current poll: [{ pressed, value }]
  _padButtonsPrev: [],    // previous poll, for edge detection
  _padAxisHalves: [0, 0, 0, 0, 0, 0, 0, 0],     // 8 deadzoned 0..1 strengths
  _padAxisHalvesPrev: [0, 0, 0, 0, 0, 0, 0, 0],
  _padConnected: false,

  bind(action, device, code) {
    if (device !== 'key' && device !== 'button' && device !== 'axis') {
      throw new Error(
        `input.bind: unknown device "${device}" — expected "key", "button", or "axis"`
      );
    }
    if (!this._actions[action]) this._actions[action] = [];
    this._actions[action].push({ device, code });
  },

  clearBindings(action) {
    this._actions[action] = [];
  },

  setDeadzone(value) {
    this._deadzone = Math.min(Math.max(value, 0), 0.9);
  },

  padConnected() {
    return this._padConnected;
  },

  getKeyDown(keyCode) {
    return Boolean(this._keys[keyCode]);
  },
  keyPressed(keyCode) {
    return Boolean(this._justPressed[keyCode]);
  },
  keyReleased(keyCode) {
    return Boolean(this._justReleased[keyCode]);
  },
  registerKey(keyCode, down) {
    if (down && !this._keys[keyCode]) this._justPressed[keyCode] = true;
    if (!down && this._keys[keyCode]) this._justReleased[keyCode] = true;
    this._keys[keyCode] = down;
  },
  _resetFrameInput() {
    this._justPressed = {};
    this._justReleased = {};
  },
  getMouseX() {
    return this._mouseX;
  },
  getMouseY() {
    return this._mouseY;
  },
  getMouseDown() {
    return this._mouseDown;
  },
  _initMouse(canvas) {
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('pointerdown', () => {
      this._mouseDown = true;
    });
    canvas.addEventListener('pointerup', () => {
      this._mouseDown = false;
    });
    canvas.addEventListener('pointercancel', () => {
      this._mouseDown = false;
    });
  },
};
```

(`_pollGamepads`, `_digital`, `held`, `pressed`, `released`, `strength`, `axis`, and the `_resetFrameInput` extension are added in Tasks 4–7.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/input.js tests/components/Runner/engine/input.test.ts
git commit -m "feat: add action-map state, bind/clearBindings, setDeadzone to input engine"
```

---

## Task 4: Engine — `_pollGamepads` with deadzone rescale + edge detection

**Files:**
- Modify: `src/components/Runner/engine/input.js`
- Test: `tests/components/Runner/engine/input.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/engine/input.test.ts`:

```ts
// ─── _pollGamepads: deadzone rescale ─────────────────────────────────────────

describe('_sbInput._pollGamepads — axis half deadzone rescale', () => {
  test('a raw value at the deadzone edge produces 0', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [0.15, 0, 0, 0] })]); // deadzone default 0.15
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(0); // LSTICK_RIGHT
  });

  test('full deflection produces 1', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(1); // LSTICK_RIGHT
  });

  test('halfway past the deadzone produces ~0.5', () => {
    const inp = loadInput();
    // (0.575 - 0.15) / (1 - 0.15) = 0.5
    setPads([makePad({ axes: [0.575, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(0.5, 5);
  });

  test('negative axis feeds the opposite half; the active half is 0', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [-1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[0]).toBeCloseTo(1); // LSTICK_LEFT
    expect(inp._padAxisHalves[1]).toBeCloseTo(0); // LSTICK_RIGHT
  });

  test('a larger deadzone rescales the ramp', () => {
    const inp = loadInput();
    inp.setDeadzone(0.5);
    setPads([makePad({ axes: [0.75, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(0.5, 5); // (0.75-0.5)/(1-0.5)
  });

  test('vertical axis maps to UP (negative) and DOWN (positive) halves', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [0, -1, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[2]).toBeCloseTo(1); // LSTICK_UP
    expect(inp._padAxisHalves[3]).toBeCloseTo(0); // LSTICK_DOWN
  });
});

// ─── _pollGamepads: connectivity + button snapshot ───────────────────────────

describe('_sbInput._pollGamepads — connectivity', () => {
  test('no pads: _padConnected false, tables cleared', () => {
    const inp = loadInput();
    setPads([]);
    inp._pollGamepads();
    expect(inp._padConnected).toBe(false);
    expect(inp._padButtons).toEqual([]);
    expect(inp._padAxisHalves).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test('null-padded array: picks the first non-null pad', () => {
    const inp = loadInput();
    setPads([null, makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp._padConnected).toBe(true);
    expect(inp._padButtons[0]).toEqual({ pressed: true, value: 1 });
  });

  test('navigator without getGamepads is treated as no pad', () => {
    const inp = loadInput();
    vi.stubGlobal('navigator', {});
    inp._pollGamepads();
    expect(inp._padConnected).toBe(false);
  });
});

// ─── _pollGamepads: edge detection into the b#/h# namespace ──────────────────

describe('_sbInput._pollGamepads — button edges', () => {
  test('a newly-pressed button sets _justPressed["b0"] once', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [0] })]);
    inp._pollGamepads();               // button up
    inp._resetFrameInput();            // roll prev, clear edges
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();               // button down -> edge
    expect(inp._justPressed['b0']).toBe(true);
    expect(inp._justReleased['b0']).toBeUndefined();
  });

  test('a held button produces no repeat edge on the next poll', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp._justPressed['b0']).toBeUndefined();
  });

  test('releasing a button sets _justReleased["b0"]', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [0] })]);
    inp._pollGamepads();
    expect(inp._justReleased['b0']).toBe(true);
  });
});

describe('_sbInput._pollGamepads — analog->digital crossover at 0.5', () => {
  test('crossing the threshold once yields a single h# pressed edge', () => {
    const inp = loadInput();
    // below threshold: (0.49? use axes so half < 0.5)
    setPads([makePad({ axes: [0.4, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    // (0.7 - 0.15) / 0.85 = 0.647 -> above 0.5
    setPads([makePad({ axes: [0.7, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._justPressed['h1']).toBe(true); // LSTICK_RIGHT half
    inp._resetFrameInput();
    // stays deflected -> no repeat
    setPads([makePad({ axes: [0.9, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._justPressed['h1']).toBeUndefined();
  });

  test('dropping back below the threshold yields an h# released edge', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ axes: [0.1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._justReleased['h1']).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: FAIL — `inp._pollGamepads is not a function`. (The Task 3 tests still pass.)

- [ ] **Step 3: Add `_pollGamepads` and extend `_resetFrameInput`**

In `src/components/Runner/engine/input.js`, add `_pollGamepads` after `padConnected()` and replace `_resetFrameInput` with the extended version:

```js
  _pollGamepads() {
    const pads =
      (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function')
        ? navigator.getGamepads()
        : [];
    let pad = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) { pad = pads[i]; break; }
    }
    this._padConnected = pad != null;

    if (!pad) {
      this._padButtons = [];
      this._padAxisHalves = [0, 0, 0, 0, 0, 0, 0, 0];
      return;
    }

    // Buttons: copy { pressed, value }.
    this._padButtons = Array.from(pad.buttons, (b) => ({
      pressed: !!b.pressed,
      value: typeof b.value === 'number' ? b.value : (b.pressed ? 1 : 0),
    }));

    // Axis halves: split each raw -1..1 axis into two rescaled 0..1 signals.
    const dz = this._deadzone;
    const rescale = (x) => {
      const m = Math.min(Math.max(x - dz, 0), 1);
      return dz < 1 ? m / (1 - dz) : m;
    };
    const ax = pad.axes || [];
    const lx = ax[0] || 0, ly = ax[1] || 0, rx = ax[2] || 0, ry = ax[3] || 0;
    this._padAxisHalves = [
      rescale(-lx), // 0 LSTICK_LEFT
      rescale(lx),  // 1 LSTICK_RIGHT
      rescale(-ly), // 2 LSTICK_UP
      rescale(ly),  // 3 LSTICK_DOWN
      rescale(-rx), // 4 RSTICK_LEFT
      rescale(rx),  // 5 RSTICK_RIGHT
      rescale(-ry), // 6 RSTICK_UP
      rescale(ry),  // 7 RSTICK_DOWN
    ];

    // Edge detection vs. the previous poll, in a separate "b#"/"h#" key
    // namespace so gamepad codes never collide with keyboard keyCodes.
    for (let i = 0; i < this._padButtons.length; i++) {
      const now = this._padButtons[i].pressed;
      const prev = this._padButtonsPrev[i];
      const was = prev ? prev.pressed : false;
      if (now && !was) this._justPressed['b' + i] = true;
      if (!now && was) this._justReleased['b' + i] = true;
    }
    for (let i = 0; i < 8; i++) {
      const now = this._padAxisHalves[i] >= this._axisThreshold;
      const was = (this._padAxisHalvesPrev[i] || 0) >= this._axisThreshold;
      if (now && !was) this._justPressed['h' + i] = true;
      if (!now && was) this._justReleased['h' + i] = true;
    }
  },
```

Replace:

```js
  _resetFrameInput() {
    this._justPressed = {};
    this._justReleased = {};
  },
```

with:

```js
  _resetFrameInput() {
    this._justPressed = {};
    this._justReleased = {};
    // Roll gamepad poll state so the next poll's edge diff has a baseline.
    this._padButtonsPrev = this._padButtons;
    this._padAxisHalvesPrev = this._padAxisHalves;
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: PASS — all `_pollGamepads` blocks green.

- [ ] **Step 5: Run the full suite (input.js is shared)**

Run: `npx vitest run`
Expected: PASS — no regressions (keyboard/mouse behaviour unchanged).

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/input.js tests/components/Runner/engine/input.test.ts
git commit -m "feat: poll gamepads with deadzone rescale and edge detection"
```

---

## Task 5: Engine — digital query resolution (`held` / `pressed` / `released`)

**Files:**
- Modify: `src/components/Runner/engine/input.js`
- Test: `tests/components/Runner/engine/input.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/engine/input.test.ts`:

```ts
// ─── digital query resolution ───────────────────────────────────────────────

describe('_sbInput.held', () => {
  test('keyboard source: true while the key is down', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    expect(inp.held('jump')).toBe(false);
    inp.registerKey(32, true);
    expect(inp.held('jump')).toBe(true);
  });

  test('button source: true while the pad button is pressed', () => {
    const inp = loadInput();
    inp.bind('fire', 'button', 0);
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.held('fire')).toBe(true);
  });

  test('axis source: true once the half-strength reaches the threshold', () => {
    const inp = loadInput();
    inp.bind('move_right', 'axis', 1); // LSTICK_RIGHT
    setPads([makePad({ axes: [0.4, 0, 0, 0] })]); // half ~0.29 < 0.5
    inp._pollGamepads();
    expect(inp.held('move_right')).toBe(false);
    inp._resetFrameInput();
    setPads([makePad({ axes: [0.9, 0, 0, 0] })]); // half ~0.88 >= 0.5
    inp._pollGamepads();
    expect(inp.held('move_right')).toBe(true);
  });

  test('OR across sources: either the key or the button activates it', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.bind('jump', 'button', 0);
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.held('jump')).toBe(true);
  });

  test('unbound action is never held', () => {
    const inp = loadInput();
    expect(inp.held('nothing')).toBe(false);
  });
});

describe('_sbInput.pressed / released', () => {
  test('pressed: true only on the key-down edge', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.registerKey(32, true);
    expect(inp.pressed('jump')).toBe(true);
    inp._resetFrameInput();
    expect(inp.pressed('jump')).toBe(false); // still held, no repeat
  });

  test('pressed: true on the button-down edge (b# namespace)', () => {
    const inp = loadInput();
    inp.bind('fire', 'button', 0);
    setPads([makePad({ buttons: [0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.pressed('fire')).toBe(true);
  });

  test('pressed: true on the axis threshold-crossing edge (h# namespace)', () => {
    const inp = loadInput();
    inp.bind('move_right', 'axis', 1);
    setPads([makePad({ axes: [0, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.pressed('move_right')).toBe(true);
  });

  test('released: true on the key-up edge', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.registerKey(32, true);
    inp._resetFrameInput();
    inp.registerKey(32, false);
    expect(inp.released('jump')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: FAIL — `inp.held is not a function`.

- [ ] **Step 3: Add the digital helpers**

In `src/components/Runner/engine/input.js`, add after `_pollGamepads`:

```js
  // ── Query resolution ──────────────────────────────────────────────────────
  _digital(action) {
    const list = this._actions[action];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      if (src.device === 'key') {
        if (this._keys[src.code]) return true;
      } else if (src.device === 'button') {
        const b = this._padButtons[src.code];
        if (b && b.pressed) return true;
      } else if (src.device === 'axis') {
        if ((this._padAxisHalves[src.code] || 0) >= this._axisThreshold) return true;
      }
    }
    return false;
  },

  held(action) {
    return this._digital(action);
  },

  pressed(action) {
    const list = this._actions[action];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      if (src.device === 'key') {
        if (this._justPressed[src.code]) return true;
      } else if (src.device === 'button') {
        if (this._justPressed['b' + src.code]) return true;
      } else if (src.device === 'axis') {
        if (this._justPressed['h' + src.code]) return true;
      }
    }
    return false;
  },

  released(action) {
    const list = this._actions[action];
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      if (src.device === 'key') {
        if (this._justReleased[src.code]) return true;
      } else if (src.device === 'button') {
        if (this._justReleased['b' + src.code]) return true;
      } else if (src.device === 'axis') {
        if (this._justReleased['h' + src.code]) return true;
      }
    }
    return false;
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/input.js tests/components/Runner/engine/input.test.ts
git commit -m "feat: add held/pressed/released action resolution to input engine"
```

---

## Task 6: Engine — analog query resolution (`strength` / `axis`)

**Files:**
- Modify: `src/components/Runner/engine/input.js`
- Test: `tests/components/Runner/engine/input.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/engine/input.test.ts`:

```ts
// ─── analog query resolution ────────────────────────────────────────────────

describe('_sbInput.strength', () => {
  test('digital key source: 1 when down, 0 when up', () => {
    const inp = loadInput();
    inp.bind('fire', 'key', 32);
    expect(inp.strength('fire')).toBe(0);
    inp.registerKey(32, true);
    expect(inp.strength('fire')).toBe(1);
  });

  test('button source: the analog button value (e.g. a trigger)', () => {
    const inp = loadInput();
    inp.bind('fire', 'button', 7); // RT
    setPads([makePad({ buttons: (() => { const a: any[] = []; a[7] = { pressed: true, value: 0.3 }; return a; })() })]);
    inp._pollGamepads();
    expect(inp.strength('fire')).toBeCloseTo(0.3);
  });

  test('axis source: the deadzoned half-strength', () => {
    const inp = loadInput();
    inp.bind('move_right', 'axis', 1);
    setPads([makePad({ axes: [0.575, 0, 0, 0] })]); // -> ~0.5
    inp._pollGamepads();
    expect(inp.strength('move_right')).toBeCloseTo(0.5, 5);
  });

  test('max across sources: key down (1) beats a weak stick push', () => {
    const inp = loadInput();
    inp.bind('move_right', 'key', 39);
    inp.bind('move_right', 'axis', 1);
    inp.registerKey(39, true);
    setPads([makePad({ axes: [0.3, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.strength('move_right')).toBe(1);
  });

  test('unbound action has strength 0', () => {
    const inp = loadInput();
    expect(inp.strength('nope')).toBe(0);
  });
});

describe('_sbInput.axis', () => {
  test('returns strength(pos) - strength(neg)', () => {
    const inp = loadInput();
    inp.bind('left', 'axis', 0);  // LSTICK_LEFT
    inp.bind('right', 'axis', 1); // LSTICK_RIGHT
    setPads([makePad({ axes: [0.575, 0, 0, 0] })]); // right half ~0.5, left 0
    inp._pollGamepads();
    expect(inp.axis('left', 'right')).toBeCloseTo(0.5, 5);
  });

  test('is negative when the neg action wins', () => {
    const inp = loadInput();
    inp.bind('left', 'key', 37);
    inp.bind('right', 'key', 39);
    inp.registerKey(37, true);
    expect(inp.axis('left', 'right')).toBe(-1);
  });

  test('clamps to [-1, 1]', () => {
    const inp = loadInput();
    // Two positive sources on `right`, both maxed, neg at 0 -> raw 1 (max), still clamped.
    inp.bind('right', 'key', 39);
    inp.bind('right', 'button', 0);
    inp.registerKey(39, true);
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.axis('left', 'right')).toBe(1);
  });

  test('rest position is 0', () => {
    const inp = loadInput();
    inp.bind('left', 'axis', 0);
    inp.bind('right', 'axis', 1);
    setPads([makePad({ axes: [0, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.axis('left', 'right')).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: FAIL — `inp.strength is not a function`.

- [ ] **Step 3: Add `strength` and `axis`**

In `src/components/Runner/engine/input.js`, add after `released(action)`:

```js
  strength(action) {
    const list = this._actions[action];
    if (!list) return 0;
    let max = 0;
    for (let i = 0; i < list.length; i++) {
      const src = list[i];
      let s = 0;
      if (src.device === 'key') {
        s = this._keys[src.code] ? 1 : 0;
      } else if (src.device === 'button') {
        const b = this._padButtons[src.code];
        s = b ? b.value : 0;
      } else if (src.device === 'axis') {
        s = this._padAxisHalves[src.code] || 0;
      }
      if (s > max) max = s;
    }
    return max;
  },

  axis(negAction, posAction) {
    const v = this.strength(posAction) - this.strength(negAction);
    return Math.min(Math.max(v, -1), 1);
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/input.js tests/components/Runner/engine/input.test.ts
git commit -m "feat: add strength/axis analog action resolution to input engine"
```

---

## Task 7: Engine — keyboard-only regression + prev-state roll coverage

**Files:**
- Test: `tests/components/Runner/engine/input.test.ts` (no source change — this task locks in behaviour that must survive)

- [ ] **Step 1: Write the tests**

Append to `tests/components/Runner/engine/input.test.ts`:

```ts
// ─── keyboard-only path (no pad ever connected) ─────────────────────────────

describe('_sbInput — keyboard-only path', () => {
  test('actions resolve with no gamepad present and getGamepads returning []', () => {
    const inp = loadInput();
    setPads([]);
    inp.bind('jump', 'key', 32);
    inp._pollGamepads();
    expect(inp._padConnected).toBe(false);

    inp.registerKey(32, true);
    expect(inp.held('jump')).toBe(true);
    expect(inp.pressed('jump')).toBe(true);
    inp._resetFrameInput();
    expect(inp.pressed('jump')).toBe(false);
    inp.registerKey(32, false);
    expect(inp.released('jump')).toBe(true);
  });

  test('legacy getKeyDown/keyPressed still work alongside the action map', () => {
    const inp = loadInput();
    inp.registerKey(37, true);
    expect(inp.getKeyDown(37)).toBe(true);
    expect(inp.keyPressed(37)).toBe(true);
  });
});

// ─── _resetFrameInput rolls pad prev-state ──────────────────────────────────

describe('_sbInput._resetFrameInput — pad prev-state roll', () => {
  test('after reset, _padButtonsPrev equals the last polled _padButtons', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    const snapshot = inp._padButtons;
    inp._resetFrameInput();
    expect(inp._padButtonsPrev).toBe(snapshot);
    expect(inp._padAxisHalvesPrev).toBe(inp._padAxisHalves);
  });

  test('a second poll in the same frame produces no spurious edge', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();            // edge: b0 pressed
    expect(inp._justPressed['b0']).toBe(true);
    // No _resetFrameInput between polls (models _fixedStep running twice a frame
    // without the end-of-step reset in between is NOT the real order; the real
    // order resets at end of each step. But an extra poll with unchanged state
    // and a rolled prev must still not double-fire.)
    inp._resetFrameInput();
    inp._pollGamepads();
    expect(inp._justPressed['b0']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/components/Runner/engine/input.test.ts`
Expected: PASS (all behaviour already implemented in Tasks 3–6).

- [ ] **Step 3: Run the full suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/components/Runner/engine/input.test.ts
git commit -m "test: lock in keyboard-only path and pad prev-state roll for input engine"
```

---

## Task 8: `scene.js` — poll gamepads at the top of `_fixedStep`

**Files:**
- Modify: `src/components/Runner/engine/scene.js:45-56`
- Test: `tests/components/Runner/scene.test.ts:12-23` and a new `describe`

- [ ] **Step 1: Write the failing test**

In `tests/components/Runner/scene.test.ts`, add `scene._pollGamepads = vi.fn();` to `loadScene()` (right after `scene._resetFrameInput = vi.fn();`), then append this `describe`:

```ts
describe('_sbScene._fixedStep — gamepad polling wiring', () => {
  test('calls _pollGamepads() once at the top of the step, before _update', () => {
    const scene = loadScene();
    const calls: string[] = [];
    scene._pollGamepads = vi.fn(() => calls.push('poll'));
    scene._resetFrameInput = vi.fn(() => calls.push('reset'));

    scene._fixedStep(16.67);

    expect(scene._pollGamepads).toHaveBeenCalledTimes(1);
    // Poll happens before the frame-end reset.
    expect(calls).toEqual(['poll', 'reset']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/scene.test.ts`
Expected: FAIL — `scene._pollGamepads` never called (`calls` is `['reset']`).

- [ ] **Step 3: Add the call**

In `src/components/Runner/engine/scene.js`, change `_fixedStep` so the first line polls gamepads:

```js
  _fixedStep(delta) {
    this._pollGamepads();
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
    this._cameraUpdate(delta);
    this._pathfindingUpdate(delta);
    this._tweenUpdate(delta);
    this._particlesUpdate(delta);
    this._resetFrameInput();
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/scene.test.ts`
Expected: PASS — existing scene wiring tests still green, new one green.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/scene.js tests/components/Runner/scene.test.ts
git commit -m "feat: poll gamepads at the top of the fixed simulation step"
```

---

## Task 9: `bootstrapper.html` — gamepad connect/disconnect listeners

**Files:**
- Modify: `src/components/Runner/bootstrapper.html` (in the second `<script>`, near the `keydown`/`keyup` listeners, around line 184-198)
- Test: `tests/components/Runner/bootstrapper.test.ts`

- [ ] **Step 1: Inspect the existing test to match its style**

Run: `sed -n '1,40p' tests/components/Runner/bootstrapper.test.ts`
Note how it reads `bootstrapper.html` and asserts on substrings.

- [ ] **Step 2: Write the failing test**

Append to `tests/components/Runner/bootstrapper.test.ts` a `describe` matching the file's existing pattern (it reads the template once at the top — reuse that variable; it is typically named `html` or `template`). Using `template` as the placeholder name — adjust to whatever the file already declares:

```ts
describe('bootstrapper — gamepad connectivity listeners', () => {
  test('registers a gamepadconnected listener that sets _padConnected true', () => {
    expect(template).toContain("addEventListener('gamepadconnected'");
    expect(template).toMatch(/gamepadconnected[\s\S]{0,120}_sb\._padConnected\s*=\s*true/);
  });

  test('registers a gamepaddisconnected listener', () => {
    expect(template).toContain("addEventListener('gamepaddisconnected'");
    expect(template).toMatch(/gamepaddisconnected[\s\S]{0,160}navigator\.getGamepads/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/bootstrapper.test.ts`
Expected: FAIL — neither string present.

- [ ] **Step 4: Add the listeners**

In `src/components/Runner/bootstrapper.html`, immediately after the `document.addEventListener('keyup', ...)` block closes (after its `});`, before the `app.ticker.add(...)` comment), add:

```js
          // Gamepad connectivity. These events are only a hint so that
          // input.padConnected() can answer before the first _pollGamepads()
          // runs — the poll itself (top of every fixed step) is authoritative
          // once the game loop is running and re-derives _padConnected from
          // navigator.getGamepads().
          window.addEventListener('gamepadconnected', () => {
            _sb._padConnected = true;
          });
          window.addEventListener('gamepaddisconnected', () => {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            _sb._padConnected = Array.prototype.some.call(pads, (p) => p != null);
          });
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/bootstrapper.test.ts`
Expected: PASS.

- [ ] **Step 6: Build check (bootstrapper is bundled as a raw asset — make sure nothing broke)**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/Runner/bootstrapper.html tests/components/Runner/bootstrapper.test.ts
git commit -m "feat: add gamepad connect/disconnect listeners to the runtime bootstrapper"
```

---

## Task 10: Cypress — action map on the keyboard path

**Files:**
- Modify: `cypress/e2e/tutorials.cy.ts`

Cypress cannot emulate a physical gamepad, so this covers the keyboard path only (the spec explicitly accepts this). Manual run — not CI.

- [ ] **Step 1: Add a source constant and a `describe` block**

In `cypress/e2e/tutorials.cy.ts`, after the existing shared-source constants, add:

```ts
const MAIN_ACTIONMAP = `
function onenter()
  stage.setBackground(10, 10, 30)
  input.bind("move_left", "key", keyboard.LEFT)
  input.bind("move_left", "key", 65)
  input.bind("move_right", "key", keyboard.RIGHT)
  input.bind("move_right", "key", 68)
  input.bind("fire", "key", keyboard.SPACE)
  dim player = new Player()
endfunction
`.trim();

const PLAYER_ACTIONMAP = `
Class
Extends sprite

dim speed
dim shots

Constructor()
  super("ship.png")
  self.speed = 200
  self.shots = 0
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim move
  move = input.axis("move_left", "move_right")
  dim x
  x = self.transform.x() + move * self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
  if input.pressed("fire") then
    self.shots = self.shots + 1
  endif
  if input.held("fire") then
    self.transform.setAngle(self.transform.angle() + delta / 100)
  endif
endfunction
`.trim();
```

Then add the `describe` block alongside the other tutorial blocks:

```ts
describe('Action map (keyboard path)', () => {
  it('binds and queries named actions with no ERR entries', () => {
    runTutorial(
      'e2e-actionmap',
      'Action Map',
      [
        { name: 'Main.bas', source: MAIN_ACTIONMAP },
        { name: 'Player.bas', source: PLAYER_ACTIONMAP },
      ],
      ['ship.png']
    );
  });
});
```

- [ ] **Step 2: Confirm the seeded project has the packages it needs**

`buildPersistedState` hard-codes `packageIds: ['softcore', 'softgfx']`. `input`, `keyboard`, and `controller` all live in `softgfx`, which is already included — no change to the helper needed.

- [ ] **Step 3: Run it manually**

```bash
npm run dev   # terminal 1, must stay running on :5173
npm run cypress:run --spec cypress/e2e/tutorials.cy.ts   # terminal 2
```

Expected: the "Action map (keyboard path)" spec passes — no `ERR` span appears in the console panel.

- [ ] **Step 4: Commit**

```bash
git add cypress/e2e/tutorials.cy.ts
git commit -m "test(e2e): cover the input action map on the keyboard path"
```

---

## Task 11: Docs — restructure `input.md`

**Files:**
- Modify: `src/docs/api-reference/input.md`

Follow the API docs writing style in `CLAUDE.md`: beginner audience, no JS internals, param types `number`/`string`/`true`/`false`, one-sentence description → param table → `**Returns:**` → `.bas` example. Cross-check every call against `src/lib/Basic4WebGL/defs/input.bas` (Task 2) and `src/lib/Basic4WebGL/defs/controller.bas` (Task 1).

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `src/docs/api-reference/input.md` with:

```markdown
# input

The `input` module reads the keyboard, the mouse, and game controllers. Include the **softGfx** package to use it.

## The action map

Instead of checking physical keys and buttons directly, you give each thing the player can do a name — an *action* like `"jump"` or `"move_left"` — and bind one or more physical inputs to it. Then you only ever ask about actions. A keyboard player and a controller player run the exact same game code.

Set your bindings once, in a starting scene's `onenter`. They stay set for the whole game, across scene switches.

```bas
function onenter()
  input.bind("move_left",  "key", keyboard.LEFT)
  input.bind("move_left",  "axis", controller.LSTICK_LEFT)
  input.bind("move_right", "key", keyboard.RIGHT)
  input.bind("move_right", "axis", controller.LSTICK_RIGHT)
  input.bind("jump", "key", keyboard.SPACE)
  input.bind("jump", "button", controller.A)
  input.bind("fire", "button", controller.RT)
endfunction

function onupdate(delta)
  dim move
  move = input.axis("move_left", "move_right")   ' -1..1, stick or keys
  self.transform.setPosition(self.transform.x() + move * 5, self.transform.y())

  if input.pressed("jump") then self.jump() endif
  if input.held("fire") then self.shoot(input.strength("fire")) endif
endfunction
```

See the [keyboard](keyboard) page for `"key"` codes and the [controller](controller) page for `"button"` and `"axis"` codes.

## bind(action, device, code)

Adds one physical input to a named action. Call it more than once with the same action to bind several inputs at once (for example a key *and* a controller button).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action name you choose, such as `"jump"` |
| device    | string | `"key"`, `"button"`, or `"axis"` |
| code      | number | A `keyboard.*` value for `"key"`, a `controller.*` button for `"button"`, or a `controller.*` stick direction for `"axis"`. A raw number works too. |

```bas
input.bind("jump", "key", keyboard.SPACE)
input.bind("jump", "button", controller.A)
```

## clearBindings(action)

Removes every binding for an action. Useful for a "rebind controls" menu — clear the action, then `bind` the player's new choice.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to clear |

```bas
input.clearBindings("jump")
input.bind("jump", "key", keyboard.ENTER)
```

## held(action)

Checks whether an action is active right now.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** `true` every frame the action is active, `false` otherwise.

```bas
if input.held("fire") then
  self.shoot()
endif
```

## pressed(action)

Checks whether an action became active on this exact frame. Returns `true` only once per press — use it for one-shot actions like jumping.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** `true` on the frame the action activates, `false` otherwise.

```bas
if input.pressed("jump") then
  self.jump()
endif
```

## released(action)

Checks whether an action stopped being active on this exact frame.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** `true` on the frame the action releases, `false` otherwise.

```bas
if input.released("charge") then
  self.fireChargedShot()
endif
```

## strength(action)

Reads how hard an action is being pushed, for analog inputs like a stick or a trigger. Keys and ordinary buttons report `0` or `1`. If an action has several bindings, you get the largest value.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** number — `0` to `1`.

```bas
dim throttle
throttle = input.strength("accelerate")
self.setSpeed(throttle * self.maxSpeed)
```

## axis(negAction, posAction)

Combines two opposing actions into one number — handy for left/right or up/down movement. It is `strength(posAction)` minus `strength(negAction)`.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| negAction  | string | The action that pushes toward `-1` (for example `"move_left"`) |
| posAction  | string | The action that pushes toward `1` (for example `"move_right"`) |

**Returns:** number — `-1` to `1`.

```bas
dim move
move = input.axis("move_left", "move_right")
self.transform.setPosition(self.transform.x() + move * 5, self.transform.y())
```

## padConnected()

Checks whether at least one game controller is connected.

**Returns:** `true` if a controller is present, `false` otherwise.

```bas
if input.padConnected() then
  hint.setText("Press A to start")
else
  hint.setText("Press Space to start")
endif
```

## setDeadzone(value)

Sets how far a stick must move before it counts as pushed. Small drift below this amount is ignored. The default is `0.15`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| value     | number | `0` to `0.9` |

```bas
input.setDeadzone(0.2)
```

## mouseX()

Returns the current horizontal position of the mouse cursor on the canvas.

**Returns:** number — the x coordinate in pixels from the left edge.

```bas
dim cursorX
cursorX = input.mouseX()
```

## mouseY()

Returns the current vertical position of the mouse cursor on the canvas.

**Returns:** number — the y coordinate in pixels from the top edge.

```bas
dim cursorY
cursorY = input.mouseY()
```

## mouseDown()

Checks whether the primary mouse button is currently held down.

**Returns:** `true` if the mouse button is pressed, `false` if not.

```bas
function onupdate(delta)
  if input.mouseDown() then
    fireProjectile()
  endif
endfunction
```

## Deprecated

These functions still work, but new games should use the action map above — it handles controllers for free and keeps game code free of device checks.

### getKeyDown(keycode)

Checks whether a specific key is currently held down. **Replace with:** `input.bind("action", "key", keycode)` then `input.held("action")`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code (or a `keyboard.*` value) |

**Returns:** `true` if the key is held down, `false` if not.

```bas
' Old:
if input.getKeyDown(39) then self.moveRight() endif

' New:
input.bind("move_right", "key", keyboard.RIGHT)   ' once, in onenter
if input.held("move_right") then self.moveRight() endif
```

### keyPressed(keycode)

Checks whether a key was pressed on this exact frame. **Replace with:** `input.pressed("action")`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code (or a `keyboard.*` value) |

**Returns:** `true` on the frame the key was pressed, `false` otherwise.

```bas
' Old:
if input.keyPressed(32) then self.jump() endif

' New:
input.bind("jump", "key", keyboard.SPACE)
if input.pressed("jump") then self.jump() endif
```

### keyReleased(keycode)

Checks whether a key was released on this exact frame. **Replace with:** `input.released("action")`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code (or a `keyboard.*` value) |

**Returns:** `true` on the frame the key was released, `false` otherwise.

```bas
' Old:
if input.keyReleased(32) then self.stopCharging() endif

' New:
input.bind("charge", "key", keyboard.SPACE)
if input.released("charge") then self.stopCharging() endif
```
```

- [ ] **Step 2: Build check (docs markdown is imported at build time)**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/docs/api-reference/input.md
git commit -m "docs: restructure input reference around the action map"
```

---

## Task 12: Docs — new `controller.md` + manifest entry

**Files:**
- Create: `src/docs/api-reference/controller.md`
- Modify: `src/docs/manifest.ts` (API Reference `softGfx` group)

- [ ] **Step 1: Write the page**

Create `src/docs/api-reference/controller.md`:

```markdown
# controller

The `controller` module is a set of named numbers for game controller buttons and sticks. Use them with `input.bind` so your bindings read clearly:

```bas
input.bind("jump", "button", controller.A)
input.bind("aim_right", "axis", controller.RSTICK_RIGHT)
```

There are no functions here — just constants. Include the **softGfx** package to use it.

## Standard mapping

These values follow the standard controller layout that browsers apply to Xbox, PlayStation, and most modern controllers. A controller the browser does not recognise may not match these positions — bindings simply will not respond. There is no way to remap an unrecognised controller yet.

## Button constants

Use these with `input.bind(action, "button", code)`.

| Constant | Button | Constant | Button |
|----------|--------|----------|--------|
| `controller.A` | A / cross | `controller.BACK` | Back / Select |
| `controller.B` | B / circle | `controller.START` | Start |
| `controller.X` | X / square | `controller.LSTICK` | Left stick click |
| `controller.Y` | Y / triangle | `controller.RSTICK` | Right stick click |
| `controller.LB` | Left shoulder | `controller.DPAD_UP` | D-pad up |
| `controller.RB` | Right shoulder | `controller.DPAD_DOWN` | D-pad down |
| `controller.LT` | Left trigger | `controller.DPAD_LEFT` | D-pad left |
| `controller.RT` | Right trigger | `controller.DPAD_RIGHT` | D-pad right |
| | | `controller.GUIDE` | Guide / Home |

The triggers (`controller.LT`, `controller.RT`) are half buttons, half analog. Bound to an action you can read them with `input.held` and `input.pressed` like any button, or with `input.strength` to get how far they are pulled, `0` to `1`.

## Stick direction constants

Use these with `input.bind(action, "axis", code)`. Each one is a single push direction of a stick — a value from `0` (centred) to `1` (pushed all the way that way).

| Constant | Direction | Constant | Direction |
|----------|-----------|----------|-----------|
| `controller.LSTICK_LEFT` | Left stick, left | `controller.RSTICK_LEFT` | Right stick, left |
| `controller.LSTICK_RIGHT` | Left stick, right | `controller.RSTICK_RIGHT` | Right stick, right |
| `controller.LSTICK_UP` | Left stick, up | `controller.RSTICK_UP` | Right stick, up |
| `controller.LSTICK_DOWN` | Left stick, down | `controller.RSTICK_DOWN` | Right stick, down |

Pair opposite directions with `input.axis` to get a `-1` to `1` value:

```bas
function onenter()
  input.bind("left",  "axis", controller.LSTICK_LEFT)
  input.bind("right", "axis", controller.LSTICK_RIGHT)
  input.bind("left",  "key", keyboard.LEFT)
  input.bind("right", "key", keyboard.RIGHT)
endfunction

function onupdate(delta)
  dim move
  move = input.axis("left", "right")
  self.transform.setPosition(self.transform.x() + move * 4, self.transform.y())
endfunction
```

## Limitations

- One controller at a time. If several are connected, the game reads the first one.
- No rumble / vibration yet.
- No "press any button" capture helper for rebind screens yet.
```

- [ ] **Step 2: Add the manifest entry**

In `src/docs/manifest.ts`, in the API Reference section's `softGfx` group `topics` array, add `controller` right after the `input` line:

```ts
          { slug: 'input',           title: 'input',           file: 'api-reference/input.md' },
          { slug: 'controller',      title: 'controller',      file: 'api-reference/controller.md' },
```

- [ ] **Step 3: Build check**

Run: `npx vite build`
Expected: build succeeds — the new markdown file resolves.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run `npm run dev`, open `/docs/api-reference/controller`, confirm the page renders and both tables show.

- [ ] **Step 5: Commit**

```bash
git add src/docs/api-reference/controller.md src/docs/manifest.ts
git commit -m "docs: add controller API reference page"
```

---

## Task 13: Docs — Language Guide "Input" topic

**Files:**
- Create: `src/docs/language-guide/input.md`
- Modify: `src/docs/manifest.ts` (Language Guide `topics`)

The spec calls for a "Language Guide input topic" updated to teach the action map. No such topic exists today (there is only tutorial 5), so it is created here.

- [ ] **Step 1: Write the topic**

Create `src/docs/language-guide/input.md`:

```markdown
# Input

Games react to the player. In softBASIC you read input through the `input` module — and the modern way to do that is the **action map**.

## Why an action map

Without one, your code checks physical keys directly:

```bas
if input.getKeyDown(37) then self.moveLeft() endif
```

That works for a keyboard, but the moment you want controller support you end up writing `if keyboard... else if gamepad...` everywhere. The action map fixes this. You name the things the player can *do*, bind physical inputs to those names once, and everywhere else you ask about the name.

## Binding

Do this once, in your first scene's `onenter`. Bindings last for the whole game.

```bas
function onenter()
  input.bind("move_left",  "key",  keyboard.LEFT)
  input.bind("move_left",  "axis", controller.LSTICK_LEFT)
  input.bind("move_right", "key",  keyboard.RIGHT)
  input.bind("move_right", "axis", controller.LSTICK_RIGHT)
  input.bind("jump", "key",    keyboard.SPACE)
  input.bind("jump", "button", controller.A)
endfunction
```

Each `bind` takes an action name, a device (`"key"`, `"button"`, or `"axis"`), and a code. Codes come from the [keyboard](../api-reference/keyboard) and [controller](../api-reference/controller) constant modules. Binding the same action twice just adds another input — `"jump"` above answers to the space bar *or* the A button.

## Querying

| Function | Use it for |
|----------|------------|
| `input.held("run")` | something that happens every frame while active |
| `input.pressed("jump")` | one-shot actions — fires once per press |
| `input.released("charge")` | the moment the player lets go |
| `input.strength("accelerate")` | how hard a stick or trigger is pushed, `0` to `1` |
| `input.axis("left", "right")` | two opposing actions as one `-1` to `1` number |

```bas
function onupdate(delta)
  dim move
  move = input.axis("move_left", "move_right")
  self.transform.setPosition(self.transform.x() + move * self.speed * delta / 1000, self.transform.y())

  if input.pressed("jump") then self.jump() endif
endfunction
```

## Controllers

If you bind controller inputs, they just work when a controller is plugged in — no extra code. Check `input.padConnected()` if you want to show different on-screen hints. Adjust stick sensitivity with `input.setDeadzone(value)`.

Controller support uses the browser's standard controller layout (Xbox, PlayStation, and most modern pads). See the [controller](../api-reference/controller) reference for the full list of buttons and stick directions, and its limitations.

## The older functions

`input.getKeyDown`, `input.keyPressed`, and `input.keyReleased` still work and older tutorials still use them. They are keyboard-only. New games should prefer the action map. `input.mouseX`, `input.mouseY`, and `input.mouseDown` are unchanged — the mouse is read directly.
```

- [ ] **Step 2: Add the manifest entry**

In `src/docs/manifest.ts`, in the `language-guide` section `topics` array, add an `input` entry after `lifecycle` (input is a natural follow-on from lifecycle functions, where `onupdate` is introduced):

```ts
      { slug: 'lifecycle',         title: 'Lifecycle Functions', file: 'language-guide/lifecycle.md' },
      { slug: 'input',             title: 'Input',               file: 'language-guide/input.md' },
```

- [ ] **Step 3: Build check**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/docs/language-guide/input.md src/docs/manifest.ts
git commit -m "docs: add Language Guide Input topic covering the action map"
```

---

## Task 14: Roadmap updates

**Files:**
- Modify: `docs/language/library-roadmap.md`
- Modify: `src/docs/roadmap.md`

- [ ] **Step 1: Update `docs/language/library-roadmap.md`**

Find the `### ~~P5 — Mouse input~~ **[DONE]** (touch still open)` section. Directly beneath it, add a new delivered section:

```markdown
### ~~Controller / gamepad support~~ **[DONE]**

Shipped as an **action map** on `input` plus a new `controller` constant module (and building on the named-constants mechanism + `keyboard` module, `docs/superpowers/specs/2026-08-30-softbasic-constants-design.md`).

Game code calls `input.bind(action, device, code)` (`device`: `"key"` | `"button"` | `"axis"`) once at startup, then queries actions — never physical inputs: `input.held`, `input.pressed`, `input.released` (digital, OR across sources), `input.strength` (0..1, max across sources), `input.axis(neg, pos)` (−1..1). Plus `input.clearBindings(action)`, `input.padConnected()`, `input.setDeadzone(value)` (default 0.15). Keyboard and controller are interchangeable in game logic with zero branching.

Engine: `_sbInput._pollGamepads()` runs at the top of `_sbScene._fixedStep` (`engine/scene.js`), reads `navigator.getGamepads()`, folds the first standard-mapping pad into the existing just-pressed/just-released model in a separate `"b#"`/`"h#"` key namespace, and derives 8 deadzone-rescaled 0..1 stick half-strengths. `_resetFrameInput` rolls `_padButtons`/`_padAxisHalves` into their `*Prev` counterparts. `bootstrapper.html` adds `gamepadconnected`/`gamepaddisconnected` listeners as a connectivity hint before the first poll.

`input.getKeyDown` / `keyPressed` / `keyReleased` are kept working, marked deprecated in the docs with migration examples.

Design spec: `docs/superpowers/specs/2026-08-30-controller-support-design.md`. Plan: `docs/superpowers/plans/2026-08-30-controller-support.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`, `tests/components/Runner/engine/input.test.ts`, `tests/components/Runner/scene.test.ts`, `tests/components/Runner/bootstrapper.test.ts`, `cypress/e2e/tutorials.cy.ts` (keyboard path). Docs: `src/docs/api-reference/input.md`, `src/docs/api-reference/controller.md`, `src/docs/language-guide/input.md`.

**Tracked follow-ups (deferred):**

- **Local multiplayer** — a player-index parameter on `bind` and the query functions. The API was designed so this can be added as an optional trailing argument without breaking the current surface. `_pollGamepads` currently reads only the first connected pad.
- **Rumble / haptics** — `gamepad.vibrationActuator` (Chromium-only). Not started.
- **Runtime rebind UI helpers** — a "press any input" capture so settings screens can let players remap. `clearBindings` + `bind` already cover applying a new binding; the missing piece is detecting what the player just pressed.
- **Extract a dedicated `softInput` package** — `input` + `keyboard` + `controller` currently ship inside softGfx (the "game engine" package). A future project should pull them into their own `softInput` first-party package so a project can take input without the rest of the rendering engine. This is a **breaking migration** (existing projects reference `softgfx`; module→package resolution, the Cypress seed helper's hard-coded `packageIds`, and every demo/tutorial export would need updating) and needs its own design spec. Deferred.
```

Also update the module inventory line (around line 43):

```markdown
| `input` | action map: `bind` `clearBindings` `held` `pressed` `released` `strength` `axis` `padConnected` `setDeadzone`; deprecated: `getKeyDown` `keyPressed` `keyReleased`; `mouseX()` `mouseY()` `mouseDown()` |
| `controller` | constants only — gamepad button + stick-direction values for `input.bind` |
```

(If the constants plan already added a `keyboard` row here, leave it; just add the `controller` row next to it.)

- [ ] **Step 2: Update `src/docs/roadmap.md`**

In the `## What just shipped` area, after the tile-collision paragraph, add:

```markdown
Most recently, controller support landed. Games now use an *action map*: you give each thing the player can do a name, bind keys and controller buttons to it once, and the rest of your game reads the action — so keyboard and gamepad work from the same code with no branching. Analog sticks and triggers are supported, and the old keyboard-only functions still work.
```

Then, in the `## Further out` / `## Beyond v1.0` area where the package ecosystem is mentioned, add a sentence noting a planned split:

```markdown
As part of that, the built-in library will be re-organised into smaller packages — for example a dedicated input package so a game can read the keyboard and controller without pulling in the whole rendering engine.
```

(If this pushes an older "most recently" phrasing out of date, reword the neighbouring sentence so only one paragraph claims to be the latest.)

- [ ] **Step 3: Build check**

Run: `npx vite build`
Expected: build succeeds (`roadmap.md` is served in-app).

- [ ] **Step 4: Commit**

```bash
git add docs/language/library-roadmap.md src/docs/roadmap.md
git commit -m "docs: mark controller support delivered in the roadmaps"
```

---

## Task 15: Full verification pass

**Files:** none — verification only.

- [ ] **Step 1: Run the whole unit suite**

Run: `npx vitest run`
Expected: PASS, no skipped-unexpectedly, no regressions.

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: succeeds with no errors.

- [ ] **Step 3: Manual Cypress (the only real runtime check)**

```bash
npm run dev
npm run cypress:run --spec cypress/e2e/tutorials.cy.ts
```

Expected: all tutorial specs pass, including "Action map (keyboard path)".

- [ ] **Step 4: Manual in-app smoke**

`npm run dev`, create a scratch project with `softcore` + `softgfx`, paste the action-map example from `input.md`, Run. Confirm the ship moves with arrow keys and no console errors. If a real controller is available, confirm the left stick moves the ship and A triggers the jump action.

- [ ] **Step 5: Final commit if anything was touched during verification**

```bash
git add -A
git commit -m "chore: controller support verification fixups"
```

(Skip if nothing changed.)

---

## Self-Review

**1. Spec coverage**

| Spec section | Task(s) |
|--------------|---------|
| `controller` constant module — button + axis-half tables | Task 1 |
| `controller` registration (`packageModules.ts`, package `moduleNames`) | Task 1 (steps 4–5) |
| `input.bas` — `bind`, `held`, `pressed`, `released`, `strength`, `axis`, `clearBindings`, `padConnected`, `setDeadzone` | Task 2 |
| Deprecated `getKeyDown`/`keyPressed`/`keyReleased` kept | Task 2 (step 3 keeps them; test in step 1) |
| Engine `_actions`, deadzone state, `_padButtons`/`Prev`, `_padAxisHalves`/`Prev`, `_padConnected` | Task 3 (state), Task 4 |
| Engine `bind` / `clearBindings` (+ unknown-device throw) | Task 3 |
| Engine `_pollGamepads` + deadzone-rescale formula | Task 4 |
| Engine `setDeadzone` (clamp `[0, 0.9]`), `padConnected` | Task 3 |
| Digital / strength / axis resolution helpers | Tasks 5, 6 |
| `_resetFrameInput` rolls pad prev-state | Task 4 (step 3) + Task 7 coverage |
| `scene.js` — `_pollGamepads()` at top of `_fixedStep` | Task 8 |
| `bootstrapper.html` — `gamepadconnected` / `gamepaddisconnected` | Task 9 |
| Transpiler unit tests for every new call incl. constant args | Tasks 1, 2 |
| Engine unit test file with mocked `navigator.getGamepads` — deadzone rescale, button edges, analog→digital crossover at 0.5 (single edge), strength max-across-sources, axis arithmetic/clamp, keyboard-only path | Tasks 4, 5, 6, 7 |
| Cypress — action map on keyboard path, new `describe` | Task 10 |
| Docs — `input.md` restructured (action map first, deprecated at bottom) | Task 11 |
| Docs — new `controller.md` + `manifest.ts` entry | Task 12 |
| Docs — Language Guide input topic | Task 13 |
| Docs — `keyboard.md` link target | Assumed created by the constants plan; `input.md` / `controller.md` link to it (Tasks 11, 12) |
| Roadmap — `library-roadmap.md` + `roadmap.md`, with the deferred follow-ups (multiplayer, rumble, rebind helpers, + `softInput` package extraction) | Task 14 |
| softGfx `moduleNames` + conditional `version` bump, coordinated with the constants plan | Task 1 step 5 |
| Lifetime — bindings persist across scene switches | Realised by Task 4 (`_resetFrameInput` never touches `_actions`); no dedicated task needed, noted in `input.md` (Task 11) |

No gaps found.

**2. Placeholder scan** — no "TBD"/"add error handling"/"write tests for the above" left; every code step has complete code; every command has an expected result.

**3. Type consistency** — method names are consistent across tasks: `_pollGamepads`, `_digital`, `held`, `pressed`, `released`, `strength`, `axis`, `bind`, `clearBindings`, `setDeadzone`, `padConnected`. State fields: `_actions`, `_deadzone`, `_axisThreshold`, `_padButtons`, `_padButtonsPrev`, `_padAxisHalves`, `_padAxisHalvesPrev`, `_padConnected`. Edge-key namespace `"b" + i` / `"h" + i` is used identically in `_pollGamepads` (writes), `pressed`, and `released` (reads). Axis-half index order (`LEFT, RIGHT, UP, DOWN` per stick, left stick then right stick = indices 0–7) matches `controller.bas` constant values in Task 1 and the `_padAxisHalves` array construction in Task 4.

---

## Underspecified in the spec — flag to the human before/while executing

1. **Engine test file location.** Spec path is `tests/components/Runner/engine/input.test.ts`; every existing engine test actually lives at `tests/components/Runner/*.test.ts` (flat). Plan uses the spec's path. Confirm which the reviewer wants — trivial to move.
2. **"Language Guide input topic — updated."** There is no existing Language Guide input topic (only `tutorials/05-keyboard.md`). Task 13 *creates* `src/docs/language-guide/input.md` and adds it to the manifest after `lifecycle`. Confirm the slot and that a new topic (vs. folding into an existing one) is acceptable.
3. **`controller` package assignment.** ~~Spec does not name the package.~~ **Resolved by the coordinator:** `controller` → softGfx, with `input` and `keyboard`. Task 1 step 5 reflects this, including the conditional `softgfx` version bump coordinated with the constants plan (which runs first).
4. **Deprecated-function fate long-term.** Spec keeps them "working" with no removal date. Plan does not add a deprecation *warning* diagnostic (nothing in the spec asks for one). If a soft warning is wanted, that is a separate task not in this plan.
5. **`padConnected` before first poll on an already-connected pad.** The `gamepadconnected` event only fires on a *new* connection (or first input) after the page loads; a pad connected and idle before load is invisible until `_pollGamepads` runs (top of the first fixed step). In practice the first step runs within ~16 ms so this is not observable, but the spec's "let `input.padConnected()` work before the first poll" is only partially true (works for connect-after-load, not connect-before-load-and-idle). No code change proposed — just noting the limitation matches the docs wording in Task 12 ("reads the first one" / hint usage).
6. **Trigger `pressed` semantics.** `controller.LT` / `controller.RT` (button indices 6/7) report `.pressed` per the browser's own threshold, which varies by controller/driver. The spec says triggers are "usable digitally via `held`/`pressed`" — plan relies on the browser's `GamepadButton.pressed` as-is rather than re-deriving a digital state from `.value` and `_axisThreshold`. If consistent trigger thresholds are needed, that is an unspecified extra.
7. **Cypress can't test the gamepad path at all.** Spec acknowledges this. Task 10 covers keyboard only. The analog/button/deadzone behaviour is covered exclusively by the Vitest engine tests (Tasks 4–7) — there is no browser-level runtime test of a real `navigator.getGamepads()` integration. Accepted risk, consistent with the spec.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-30-controller-support.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: superpowers:subagent-driven-development.
2. **Inline Execution** — execute tasks in this session using superpowers:executing-plans, batch execution with checkpoints.

Which approach?
