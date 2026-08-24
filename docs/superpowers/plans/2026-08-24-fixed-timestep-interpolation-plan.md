# Fixed-Timestep Simulation with Interpolated Rendering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple softBASIC's game simulation from its render rate — step every per-frame system in fixed 1/60s increments and render objects at an interpolated position — so that real frame-time variance (GC pauses, compositor hiccups, refresh-rate mismatch) no longer shows up as uneven on-screen motion.

**Architecture:** A new `_sbFrameLoop` engine module owns an accumulator. `_sb._update(deltaMS)` (still the single PIXI ticker entry point) adds real elapsed time to the accumulator and runs `_sb._fixedStep(FIXED_STEP_MS)` — the old `_update` body, renamed — as many whole times as fit. `handle.position` remains the one authoritative simulation position at all times, so **no reader anywhere changes**. Immediately before PIXI renders, the frame loop *temporarily* overwrites `handle.position` with the interpolated blend of the last two fixed-step samples; a second, lower-priority ticker callback restores the authoritative values immediately after the render completes. Because both happen synchronously inside a single ticker tick, no softBASIC code — not `onupdate`, not `onkeydown`, not a collision query — can ever observe an interpolated value.

**Tech Stack:** Plain ES5-ish JS engine modules concatenated into a sandboxed iframe (`src/components/Runner/engine/*.js`), PIXI.js v8 (`app.ticker`, `PIXI.UPDATE_PRIORITY`), Vitest for tests (engine modules loaded via `new Function(...)` — see `tests/components/Runner/camera.test.ts` for the established pattern).

---

## Design decisions (and why)

These were the real forks. Recording the reasoning so a later reader does not have to re-derive it.

### 1. Swap-and-restore, not a separate simulation position

The obvious implementation stores the authoritative position in `handle._sbSimX/_sbSimY` and leaves `handle.position` purely visual. That would require changing **every** reader of position: `_sbSprites.getPositionX/Y` (which backs `ObjectTransform.x()/y()`), `_sbCollision._localAabb`, `spriteCollide`/`pointInBox`/`raycast` (all of which go through PIXI's `getBounds()`, which we do not control), `_sbCamera._cameraUpdate`'s follow target read, and `_sbPathfinding._pathfindingUpdate`'s distance math. `getBounds()` alone makes that approach impossible to do completely — PIXI computes it from `handle.position` internally.

So instead: `handle.position` **is** the simulation position, always, exactly as today. The interpolated value is written into it only for the duration of PIXI's render call and restored straight afterwards. Ordering is guaranteed by PIXI ticker priorities, which run in descending order:

| Priority | Callback |
|---|---|
| `NORMAL` (0) | `_sb._update(ticker.deltaMS)` — fixed steps, then write interpolated positions |
| `LOW` (−25) | PIXI `Application`'s own `render` (registered by PIXI itself) |
| `UTILITY` (−50) | `_sb._afterRender()` — restore authoritative positions |

All three run synchronously within one `requestAnimationFrame` callback, so a keyboard event handler (which fires between frames, and which *does* read `self.transform.x()`) can never land inside the displaced window.

### 2. Only *position* is interpolated — not angle, scale, or alpha

Interpolating the other channels is tempting for tweens but actively harmful:

- **scale** — `sprite.setFlip()` flips `scale.x` between `+n` and `−n`. Blending across that sign change renders the sprite squashed to zero width for a frame. Every demo with a left/right-facing character does this.
- **alpha** — used for discrete state changes (hit flashes, fade toggles). Smearing them is at best pointless.
- **angle** — set discretely for aiming and facing. A 180° facing change would render as a visible spin.

Position is also the only channel where the original stutter complaint actually lives: continuous, delta-scaled translation. Tween-driven angle/scale/alpha now update at a *constant* 60Hz, which is at or above the threshold where their stepping is perceptible. Tween-driven *position* needs no special handling at all — it writes `handle.position` inside a fixed step like everything else, so the generic mechanism picks it up for free.

### 3. `setPosition` participates in interpolation; teleports are detected two ways

This was the hardest call. The task framing treats `setPosition` as a teleport primitive, and in the demos it largely is. But `setPosition` is *also* the movement primitive the tutorials teach — `04-motion.md`, `05-keyboard.md`, `09-enemies.md`, `11-dodge.md` all move sprites with `self.transform.setPosition(x + speed * delta / 1000, ...)` inside `onupdate`. If `setPosition` unconditionally snapped, every tutorial game would get zero benefit *and* would regress on high-refresh displays: today they render a fresh position every frame (144 distinct positions/sec on a 144Hz panel); with fixed stepping and no interpolation they would render only 60 distinct positions/sec, each held for ~2.4 frames — visible judder we introduced.

So `setPosition` is treated as movement by default, with two teleport detectors:

1. **Called outside a fixed step → snap, exactly.** Spawn code in `onenter`/`oninit`, module top-level statements, and `onkeydown` handlers all run outside `_fixedStep`. These are unambiguously placements, not motion, and the frame loop knows precisely when it is inside a step (`_inFixedStep` flag). No heuristic involved.
2. **Called inside a fixed step with a displacement larger than `MAX_INTERP_STEP_PX` (64) on either axis → snap.** 64px per 1/60s is 3840 px/s — six canvas-widths per second on the 640×360 stage. No demo moves anything near that: the fastest bullets in Bullet Hell are a few hundred px/s (≤10px/step). Room-cut teleports, by contrast, move hundreds of pixels at once. The separation margin is roughly two orders of magnitude, and both failure modes are benign: a false snap gives exactly today's behaviour for one frame, and a false interpolation smears by less than 64px for less than one frame.

This threshold is a heuristic and is labelled as one in the code. It is the conservative choice — the alternative (a new `transform.teleport()` API) would break no demos but would silently leave every *existing* demo's teleports smearing until each was hand-updated, which is strictly worse.

### 4. The camera is interpolated too — and must be

Not interpolating the camera is worse than not interpolating anything. With `camera.follow(player, 0)` (hard lock), the camera would snap to the player's position each fixed step while the player rendered at an interpolated position — so the player would visibly slide back and forth *relative to the viewport*, which is the exact artefact we are trying to remove. Interpolating both with the same alpha makes a hard-locked follow render rock-steady.

`camera.setPosition()` sets a snap flag, so Dungeon Explorer's hard room cuts stay instant. `_cameraUpdate(delta)` keeps its name and becomes simulation-only (updating `_camX/_camY` and shake); a new `_cameraApply(alpha)` does the `worldContainer` write. `cameraX()`/`cameraY()` keep returning the authoritative `_camX/_camY`. `worldContainer`'s transform is restored after render alongside sprite positions, so anything reading `getBounds()` during a fixed step sees exactly the coordinate space it sees today.

### 5. Accepted trade-off: `onupdate` can run more than once per rendered frame

On a frame that takes longer than 16.67ms, the loop catches up by running two or more fixed steps, which means `onupdate` runs two or more times before that frame renders. For most games this is just correct. For the Raycaster demo, whose `onupdate` performs an entire software-rendering pass (`drawing.clear()` plus hundreds of `drawImageStrip` calls), a slow frame now costs two passes instead of one.

This is inherent to the pattern and is bounded on both ends: incoming `deltaMS` is clamped to `MAX_FRAME_MS` (250ms) so a backgrounded tab cannot produce a huge burst, and at most `MAX_STEPS` (5) steps run per rendered frame, with any remaining accumulator dropped. On a *faster*-than-60Hz display the Raycaster does strictly less work than today (60 passes/sec instead of 144), and its `drawing` output is retained between steps so it looks identical. A softBASIC `onrender` hook would remove the waste entirely; that is deliberately out of scope here and noted as a follow-up.

### 6. No opt-out toggle

No `world.setFixedTimestep(false)`. YAGNI, and a toggle would double the behaviours that need testing across every demo. If a demo turns out to need one, it is a small follow-up.

---

## File structure

**Create:**
- `src/components/Runner/engine/frameloop.js` — `_sbFrameLoop`: the accumulator, the fixed-step driver, the interpolation snapshot/apply/restore, and the teleport flag helpers. One responsibility: reconciling simulation rate with render rate. ~120 lines.
- `tests/components/Runner/frameloop.test.ts` — unit tests for the module above.

**Modify:**
- `src/components/Runner/engine/scene.js` — rename `_update(delta)` → `_fixedStep(delta)`. (`_update` is re-provided by `frameloop.js`.)
- `src/components/Runner/engine/sprites.js` — `setPosition` marks the handle as teleported when appropriate.
- `src/components/Runner/engine/camera.js` — split simulate/apply, snap on `cameraSetPosition`, reset interp state in `_cameraReset`.
- `src/components/Runner/softBasicEngine.js` — spread `_sbFrameLoop` into `_sb`.
- `src/components/Runner/bootstrapper.html` — register the post-render restore callback.
- `tests/components/Runner/bootstrapper.test.ts` — update the ticker-wiring assertions.
- `tests/components/Runner/camera.test.ts` — its `advance()` helper must call `_cameraApply` too.
- `tests/components/Runner/scene.test.ts` — references to `_update` become `_fixedStep` where they mean "one simulation step".
- `src/docs/language-guide/lifecycle.md` — document the fixed `delta`.

**Ordering note:** `frameloop.js` must be concatenated into `_sb` and must not depend on load order for anything but `_sb` membership; it calls sibling modules only through `this`, like `scene.js` already does.

---

### Task 1: Rename `scene._update` to `scene._fixedStep`

Pure rename, no behaviour change, so the risky part lands on its own commit.

**Files:**
- Modify: `src/components/Runner/engine/scene.js:41-51`
- Modify: `tests/components/Runner/scene.test.ts`

- [ ] **Step 1: Rename the method**

In `src/components/Runner/engine/scene.js`, change the method name and add the explanatory comment:

```js
  // ONE fixed simulation step. Always called with a constant delta
  // (_sbFrameLoop.FIXED_STEP_MS), possibly more than once per rendered frame,
  // possibly zero times. Everything that advances game state belongs here;
  // nothing that draws does. See engine/frameloop.js for the driver.
  _fixedStep(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
    this._cameraUpdate(delta);
    this._pathfindingUpdate(delta);
    this._tweenUpdate(delta);
    this._resetFrameInput();
  },
```

- [ ] **Step 2: Update the existing scene tests**

In `tests/components/Runner/scene.test.ts`, replace every call to `scene._update(` with `scene._fixedStep(`. Find them with:

```bash
grep -n "_update" tests/components/Runner/scene.test.ts
```

- [ ] **Step 3: Run the suite**

Run: `npx vitest run tests/components/Runner/`
Expected: PASS. (`bootstrapper.test.ts` still passes — it only inspects the `app.ticker.add` line, which is untouched.)

- [ ] **Step 4: Commit**

```bash
git add src/components/Runner/engine/scene.js tests/components/Runner/scene.test.ts
git commit -m "refactor: rename scene._update to _fixedStep ahead of the fixed-timestep loop"
```

---

### Task 2: The frame loop module — accumulator and fixed stepping

**Files:**
- Create: `src/components/Runner/engine/frameloop.js`
- Create: `tests/components/Runner/frameloop.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/Runner/frameloop.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/frameloop.js is a plain script (not an ES module) — it declares a bare
// `const _sbFrameLoop` that the runner concatenates into the sandboxed iframe.
// Evaluate it in a Function context, the same technique camera.test.ts uses.
function loadFrameLoop() {
  const src = readFileSync('src/components/Runner/engine/frameloop.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbFrameLoop;`);
  return factory();
}

// A minimal stand-in for the assembled `_sb`: the frame loop calls its siblings
// through `this`, so a test host only needs the members it actually touches.
function makeHost(overrides: Record<string, unknown> = {}) {
  const steps: number[] = [];
  const host = {
    ...loadFrameLoop(),
    _sbInstances: [] as Array<{ _handle: unknown }>,
    _fixedStep(delta: number) {
      steps.push(delta);
    },
    _cameraSnapshot() {},
    _cameraApply() {},
    ...overrides,
  };
  return { host, steps };
}

const STEP = 1000 / 60;

describe('fixed-timestep accumulator', () => {
  test('a frame of exactly one step runs exactly one simulation step', () => {
    const { host, steps } = makeHost();
    host._update(STEP);
    expect(steps).toEqual([STEP]);
  });

  test('always steps with the constant timestep, never the real frame delta', () => {
    const { host, steps } = makeHost();
    host._update(23.4);
    expect(steps).toEqual([STEP]);
  });

  test('a short frame runs no steps and banks the time', () => {
    const { host, steps } = makeHost();
    host._update(8);
    expect(steps).toEqual([]);
    expect(host._accumulator).toBeCloseTo(8, 6);
  });

  test('two short frames that together exceed one step run one step', () => {
    const { host, steps } = makeHost();
    host._update(8);
    host._update(9);
    expect(steps).toEqual([STEP]);
  });

  test('a long frame catches up with multiple steps', () => {
    const { host, steps } = makeHost();
    host._update(STEP * 3);
    expect(steps).toEqual([STEP, STEP, STEP]);
  });

  test('leftover time carries over instead of being discarded', () => {
    const { host } = makeHost();
    host._update(STEP + 5);
    expect(host._accumulator).toBeCloseTo(5, 6);
  });

  test('simulated time tracks real time over a run of jittery frames', () => {
    const { host, steps } = makeHost();
    const frames = [16.6, 9.2, 31.7, 12.0, 18.3, 22.9, 5.4, 16.9];
    const realTotal = frames.reduce((a, b) => a + b, 0);
    frames.forEach((f) => host._update(f));
    const simulated = steps.reduce((a, b) => a + b, 0);
    // Every millisecond is either simulated or still banked in the accumulator.
    expect(simulated + host._accumulator).toBeCloseTo(realTotal, 6);
  });

  test('clamps an enormous frame delta so a backgrounded tab cannot burst', () => {
    const { host, steps } = makeHost();
    host._update(5000);
    expect(steps.length).toBeLessThanOrEqual(5);
  });

  test('drops the backlog rather than spiralling when it hits the step cap', () => {
    const { host, steps } = makeHost();
    host._update(5000);
    expect(host._accumulator).toBe(0);
    steps.length = 0;
    host._update(STEP);
    expect(steps).toEqual([STEP]);
  });

  test('ignores a negative or zero frame delta', () => {
    const { host, steps } = makeHost();
    host._update(-100);
    expect(steps).toEqual([]);
    expect(host._accumulator).toBe(0);
  });
});

describe('render alpha', () => {
  test('is zero immediately after a step consumes the whole accumulator', () => {
    const { host } = makeHost();
    host._update(STEP);
    expect(host._alpha).toBeCloseTo(0, 6);
  });

  test('is the leftover fraction of a step', () => {
    const { host } = makeHost();
    host._update(STEP + STEP / 4);
    expect(host._alpha).toBeCloseTo(0.25, 6);
  });

  test('never reaches or exceeds one', () => {
    const { host } = makeHost();
    host._update(STEP * 1.999);
    expect(host._alpha).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/Runner/frameloop.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'src/components/Runner/engine/frameloop.js'`.

- [ ] **Step 3: Write the module**

Create `src/components/Runner/engine/frameloop.js`:

```js
// Fixed-timestep simulation with interpolated rendering — the "Fix Your
// Timestep!" pattern.
//
// Before this existed, every per-frame system (kinematics, pathfinding, tween,
// and every user class's own onupdate) read PIXI's raw, variable
// `ticker.deltaMS` and applied it directly to handle.position in one step. The
// delta-time maths was correct — average speed was frame-rate independent — but
// there was zero temporal smoothing, so any real frame-time variance (a GC
// pause, a compositor hiccup, a refresh rate that isn't 60Hz) landed unsmoothed
// on screen as uneven step sizes. Correct average speed, visibly uneven motion.
//
// Now: real elapsed time accumulates here, simulation advances in constant
// FIXED_STEP_MS increments, and rendering blends between the last two
// simulation samples.
const _sbFrameLoop = {
  // 60Hz. Chosen to match the rate softBASIC games have always effectively run
  // at, so no existing game's tuning constants change meaning.
  FIXED_STEP_MS: 1000 / 60,

  // Longest real frame the loop will believe. A backgrounded tab, a breakpoint,
  // or a device waking from sleep can hand us seconds of elapsed time; without
  // this the loop would try to simulate all of it at once.
  MAX_FRAME_MS: 250,

  // Hard cap on catch-up steps per rendered frame. If simulating N steps
  // reliably takes longer than N steps of real time, an uncapped loop falls
  // into a death spiral where each frame is slower than the last. When the cap
  // is hit we drop the outstanding backlog: the game runs briefly in slow
  // motion, which is recoverable, instead of locking up, which is not.
  MAX_STEPS: 5,

  _accumulator: 0,
  _alpha: 0,
  // True only while _fixedStep is on the stack. Read by _sbSprites.setPosition
  // to tell a spawn/teleport (outside a step) from movement (inside one).
  _inFixedStep: false,

  // The PIXI ticker's single per-frame entry point. Wired in bootstrapper.html.
  _update(deltaMS) {
    let elapsed = Number(deltaMS) || 0;
    if (elapsed <= 0) {
      // A zero or negative delta still needs a render pass at the current
      // alpha — the frame is being drawn either way.
      this._renderPrepare();
      return;
    }
    if (elapsed > this.MAX_FRAME_MS) elapsed = this.MAX_FRAME_MS;

    this._accumulator += elapsed;

    let steps = 0;
    while (this._accumulator >= this.FIXED_STEP_MS && steps < this.MAX_STEPS) {
      this._snapshot();
      this._inFixedStep = true;
      try {
        this._fixedStep(this.FIXED_STEP_MS);
      } finally {
        this._inFixedStep = false;
      }
      this._accumulator -= this.FIXED_STEP_MS;
      steps += 1;
    }

    if (steps === this.MAX_STEPS && this._accumulator >= this.FIXED_STEP_MS) {
      this._accumulator = 0;
    }

    this._alpha = this._accumulator / this.FIXED_STEP_MS;
    this._renderPrepare();
  },

  // Placeholders replaced in Task 3 — separated so the accumulator can be
  // tested on its own.
  _snapshot() {},
  _renderPrepare() {},
  _afterRender() {},
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/frameloop.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/frameloop.js tests/components/Runner/frameloop.test.ts
git commit -m "feat: add a fixed-timestep accumulator that drives simulation at a constant 60Hz"
```

---

### Task 3: Position snapshotting and render interpolation

**Files:**
- Modify: `src/components/Runner/engine/frameloop.js`
- Modify: `tests/components/Runner/frameloop.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/frameloop.test.ts`:

```ts
// A stand-in for a PIXI display object: the frame loop only ever touches
// `position.x`, `position.y`, and its own `_sb*` bookkeeping fields.
function makeHandle(x = 0, y = 0) {
  return {
    position: {
      x,
      y,
      set(nx: number, ny: number) {
        this.x = nx;
        this.y = ny;
      },
    },
  } as any;
}

// Builds a host whose _fixedStep moves `handle` by (dx, dy) each step.
function makeMovingHost(handle: any, dx: number, dy: number) {
  const inst = { _handle: handle };
  const base = loadFrameLoop();
  const host: any = {
    ...base,
    _sbInstances: [inst],
    _cameraSnapshot() {},
    _cameraApply() {},
    _cameraRestore() {},
    _fixedStep() {
      handle.position.x += dx;
      handle.position.y += dy;
    },
  };
  return host;
}

describe('render interpolation', () => {
  test('renders a moving object between its last two simulation samples', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    // One full step, then a quarter-step of leftover time.
    host._update(STEP + STEP / 4);
    // Simulation is at 10; rendering shows a quarter of the way to the *next*
    // step is wrong — interpolation is backward-looking, blending the previous
    // sample (0) toward the current one (10) by alpha.
    expect(handle.position.x).toBeCloseTo(2.5, 6);
  });

  test('restores the authoritative simulation position after the render', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP + STEP / 4);
    host._afterRender();
    expect(handle.position.x).toBeCloseTo(10, 6);
  });

  test('game logic inside a fixed step always sees the authoritative position', () => {
    const handle = makeHandle(0, 0);
    const seen: number[] = [];
    const host = makeMovingHost(handle, 10, 0);
    const move = host._fixedStep;
    host._fixedStep = function () {
      seen.push(handle.position.x);
      move.call(this);
    };
    host._update(STEP + STEP / 2);
    host._afterRender();
    host._update(STEP);
    // Second step starts from 10, not from the 5 that was rendered.
    expect(seen).toEqual([0, 10]);
  });

  test('leaves a stationary object completely alone', () => {
    const handle = makeHandle(100, 50);
    const host = makeMovingHost(handle, 0, 0);
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBe(100);
    expect(handle.position.y).toBe(50);
  });

  test('interpolates the y axis as well', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 0, 8);
    host._update(STEP + STEP / 2);
    expect(handle.position.y).toBeCloseTo(4, 6);
  });

  test('interpolates from the second-to-last step when a frame runs several', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP * 2 + STEP / 2);
    // Three samples in play: 0, 10, 20. Blending must use 10 -> 20, not 0 -> 20.
    expect(handle.position.x).toBeCloseTo(15, 6);
  });

  test('does not smear an object that was teleported during the step', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 0, 0);
    host._fixedStep = function () {
      handle.position.set(500, 300);
      handle._sbNoInterp = true;
    };
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBe(500);
    expect(handle.position.y).toBe(300);
  });

  test('clears the teleport flag so the next step interpolates again', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 0, 0);
    host._fixedStep = function () {
      handle.position.set(500, 300);
      handle._sbNoInterp = true;
    };
    host._update(STEP);
    host._afterRender();
    host._fixedStep = function () {
      handle.position.x += 10;
    };
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBeCloseTo(505, 6);
  });

  test('snaps rather than smears a jump larger than the interpolation limit', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 400, 0);
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBe(400);
  });

  test('an object added mid-run is not interpolated from a stale sample', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP);
    host._afterRender();
    const late = makeHandle(999, 999);
    host._sbInstances.push({ _handle: late });
    host._update(STEP + STEP / 2);
    expect(late.position.x).toBe(999);
    expect(late.position.y).toBe(999);
  });

  test('a restore with nothing displaced is a harmless no-op', () => {
    const handle = makeHandle(7, 7);
    const host = makeMovingHost(handle, 0, 0);
    host._afterRender();
    host._afterRender();
    expect(handle.position.x).toBe(7);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/Runner/frameloop.test.ts`
Expected: FAIL — the interpolation tests fail because `_snapshot`/`_renderPrepare` are still empty stubs (e.g. "expected 10 to be close to 2.5").

- [ ] **Step 3: Implement snapshot / interpolate / restore**

In `src/components/Runner/engine/frameloop.js`, add the constant to the top of the object, after `MAX_STEPS`:

```js
  // Per-step displacement above which a position change is treated as a
  // teleport and rendered without interpolation. HEURISTIC, but with a very
  // wide margin: 64px per 1/60s is 3840 px/s, six canvas-widths per second on
  // the 640x360 stage. Nothing in any demo moves within two orders of
  // magnitude of that, while a room-cut teleport clears it easily. Both
  // failure modes are benign — a false snap is exactly the pre-interpolation
  // behaviour for one frame, and a false interpolation smears by under 64px
  // for under one frame. The exact detector for teleports issued *outside* a
  // fixed step (spawns, onenter, key handlers) is _inFixedStep in
  // _sbSprites.setPosition; this only catches teleports issued from inside a
  // step, such as Dungeon Explorer's room transitions.
  MAX_INTERP_STEP_PX: 64,

  // Handles whose position currently holds an interpolated render value and
  // must be restored. Kept as its own list so the restore never has to rescan
  // the instance registry — and so it stays correct even if the registry is
  // mutated (it cannot be, within one synchronous tick, but the invariant is
  // cheap to hold).
  _displaced: [],
```

Then replace the three placeholder methods with:

```js
  // Records each instance's pre-step position. Runs at the top of EVERY fixed
  // step, so after a multi-step frame the recorded sample is the one from the
  // start of the LAST step — which is exactly what the render must blend from.
  _snapshot() {
    const instances = this._sbInstances;
    for (let i = 0; i < instances.length; i += 1) {
      const handle = instances[i]._handle;
      if (!handle) continue;
      handle._sbPrevX = handle.position.x;
      handle._sbPrevY = handle.position.y;
      handle._sbHasPrev = true;
    }
    this._cameraSnapshot();
  },

  // Runs after the last fixed step of a frame and before PIXI renders. Saves
  // each moving object's authoritative position and overwrites position with
  // the interpolated blend. _afterRender puts the authoritative values back.
  _renderPrepare() {
    const alpha = this._alpha;
    const instances = this._sbInstances;
    const limit = this.MAX_INTERP_STEP_PX;
    for (let i = 0; i < instances.length; i += 1) {
      const handle = instances[i]._handle;
      if (!handle) continue;

      // An object registered since the last snapshot has no previous sample to
      // blend from — rendering it against a stale or absent one would fling it
      // across the screen on its first frame.
      if (!handle._sbHasPrev) continue;

      // A hard teleport this step: show the destination, not the journey.
      if (handle._sbNoInterp) {
        handle._sbNoInterp = false;
        continue;
      }

      const simX = handle.position.x;
      const simY = handle.position.y;
      const dx = simX - handle._sbPrevX;
      const dy = simY - handle._sbPrevY;
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) > limit || Math.abs(dy) > limit) continue;

      handle._sbSimX = simX;
      handle._sbSimY = simY;
      handle.position.set(
        handle._sbPrevX + dx * alpha,
        handle._sbPrevY + dy * alpha
      );
      this._displaced.push(handle);
    }
    this._cameraApply(alpha);
  },

  // Registered on the PIXI ticker at UPDATE_PRIORITY.UTILITY (-50), which runs
  // after PIXI's own render (UPDATE_PRIORITY.LOW, -25), so the displaced window
  // is confined to the render itself. Nothing softBASIC can run — not
  // onupdate, not a key handler, not a collision query — falls inside it.
  _afterRender() {
    const displaced = this._displaced;
    for (let i = 0; i < displaced.length; i += 1) {
      const handle = displaced[i];
      handle.position.set(handle._sbSimX, handle._sbSimY);
    }
    displaced.length = 0;
    this._cameraRestore();
  },
```

Also remove `_snapshot() {}`, `_renderPrepare() {}`, `_afterRender() {}` placeholder stubs.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/frameloop.test.ts`
Expected: PASS, 24 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/frameloop.js tests/components/Runner/frameloop.test.ts
git commit -m "feat: render moving objects at a position interpolated between fixed steps"
```

---

### Task 4: Teleport detection in `setPosition`

**Files:**
- Modify: `src/components/Runner/engine/sprites.js:6-8`
- Modify: `tests/components/Runner/sprites.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/sprites.test.ts` (check the top of that file for the existing loader helper and reuse it; if it loads only `_sbSprites`, the new tests need the frame-loop flag supplied as a sibling, so add this self-contained block):

```ts
import { readFileSync } from 'node:fs';

// setPosition needs to know whether it is being called from inside a fixed
// simulation step. It reads that from `this._inFixedStep`, which the assembled
// `_sb` carries from _sbFrameLoop — so a test host just supplies the flag.
function loadSpritesWithFrameLoop(inFixedStep: boolean) {
  const src = readFileSync('src/components/Runner/engine/sprites.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbSprites;`);
  return { ...factory(), _inFixedStep: inFixedStep };
}

function makeHandle() {
  return {
    position: {
      x: 0,
      y: 0,
      set(nx: number, ny: number) {
        this.x = nx;
        this.y = ny;
      },
    },
  } as any;
}

describe('setPosition teleport marking', () => {
  test('marks a position set from outside a fixed step as a teleport', () => {
    const sprites = loadSpritesWithFrameLoop(false);
    const handle = makeHandle();
    sprites.setPosition(handle, 300, 200);
    expect(handle._sbNoInterp).toBe(true);
    expect(handle.position.x).toBe(300);
  });

  test('treats a small move inside a fixed step as movement, not a teleport', () => {
    const sprites = loadSpritesWithFrameLoop(true);
    const handle = makeHandle();
    sprites.setPosition(handle, 4, 0);
    expect(handle._sbNoInterp).toBeFalsy();
  });

  test('still positions the sprite exactly, either way', () => {
    const sprites = loadSpritesWithFrameLoop(true);
    const handle = makeHandle();
    sprites.setPosition(handle, 12.5, 7.25);
    expect(handle.position.x).toBe(12.5);
    expect(handle.position.y).toBe(7.25);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/Runner/sprites.test.ts`
Expected: FAIL — "expected undefined to be true" on the first test.

- [ ] **Step 3: Implement**

In `src/components/Runner/engine/sprites.js`, replace `setPosition`:

```js
  // setPosition is BOTH softBASIC's movement primitive (the tutorials teach
  // `setPosition(x + speed * delta / 1000, y)` inside onupdate) and its
  // teleport primitive (spawning, room transitions, respawns). Interpolation
  // has to treat those differently, and the frame loop's _inFixedStep flag
  // separates them exactly: game state only advances inside a fixed step, so a
  // setPosition issued anywhere else — module top-level, oninit, onenter, a key
  // handler — is by definition a placement, not motion, and must render at its
  // destination rather than smearing there. Teleports issued from *inside* a
  // step are caught separately by _sbFrameLoop.MAX_INTERP_STEP_PX.
  setPosition(obj, x, y) {
    obj.position.set(x, y);
    if (!this._inFixedStep) obj._sbNoInterp = true;
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/sprites.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/sprites.js tests/components/Runner/sprites.test.ts
git commit -m "feat: mark out-of-step setPosition calls as teleports so they render without smearing"
```

---

### Task 5: Camera interpolation

**Files:**
- Modify: `src/components/Runner/engine/camera.js`
- Modify: `tests/components/Runner/camera.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/camera.test.ts`:

```ts
describe('camera render interpolation', () => {
  test('applies the interpolated camera position at render time', () => {
    const { camera, positions } = loadCamera();
    camera._cameraSnapshot();
    camera.cameraSetPosition(0, 0);
    camera._cameraUpdate(FRAME_MS);
    camera._cameraApply(1);
    positions.length = 0;

    camera._cameraSnapshot();
    camera._camX = 100;
    camera._camY = 0;
    camera._cameraApply(0.5);

    expect(positions[positions.length - 1].x).toBeCloseTo(-50, 6);
  });

  test('restores the authoritative camera transform after the render', () => {
    const { camera, positions } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 100;
    camera._cameraApply(0.5);
    camera._cameraRestore();

    expect(positions[positions.length - 1].x).toBeCloseTo(-100, 6);
  });

  test('camera.setPosition is a hard cut, never a smooth glide', () => {
    const { camera, positions } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 0;
    camera._cameraApply(1);
    positions.length = 0;

    // A room transition: snapshot, then a hard cut inside the same step.
    camera._cameraSnapshot();
    camera.cameraSetPosition(640, 0);
    camera._cameraApply(0.5);

    expect(positions[positions.length - 1].x).toBeCloseTo(-640, 6);
  });

  test('cameraX still reports the authoritative position, not the rendered one', () => {
    const { camera } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 100;
    camera._cameraApply(0.5);

    expect(camera.cameraX()).toBe(100);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/Runner/camera.test.ts`
Expected: FAIL — `camera._cameraSnapshot is not a function`.

- [ ] **Step 3: Update the existing camera test helper**

Still in `tests/components/Runner/camera.test.ts`, the existing `advance()` helper drives `_cameraUpdate` and expects `worldContainer.position.set` to be called. That write now lives in `_cameraApply`, so update the helper:

```ts
function advance(
  camera: { _cameraUpdate: (d: number) => void; _cameraApply: (a: number) => void },
  seconds: number
) {
  const frames = Math.round((seconds * 1000) / FRAME_MS);
  for (let i = 0; i < frames; i += 1) {
    camera._cameraUpdate(FRAME_MS);
    // The engine applies the camera to worldContainer once per rendered frame,
    // after the last fixed step. At alpha 1 that is the post-step position,
    // which is what these timing tests assert against.
    camera._cameraApply(1);
  }
}
```

- [ ] **Step 4: Implement the simulate/apply split**

In `src/components/Runner/engine/camera.js`:

Add three fields after `_zoom: 1,`:

```js
  _prevCamX: 0,
  _prevCamY: 0,
  // Set by cameraSetPosition. A camera.setPosition is a hard cut — Dungeon
  // Explorer uses it for instant room transitions — so it must never render as
  // a glide from the old room to the new one.
  _camSnap: false,
  // The last shake offset computed by _cameraUpdate. Shake is random jitter,
  // so there is nothing meaningful to interpolate; it is simply added on top
  // of the interpolated camera position at render time.
  _shakeX: 0,
  _shakeY: 0,
```

Make `cameraSetPosition` flag the cut:

```js
  cameraSetPosition(x, y) {
    this._followTarget = null;
    this._camX = x;
    this._camY = y;
    this._camSnap = true;
  },
```

Replace `_cameraUpdate` with a simulation-only version plus the new snapshot/apply/restore trio:

```js
  // Records the pre-step camera position, mirroring _sbFrameLoop._snapshot for
  // sprites. Called from there at the top of every fixed step.
  _cameraSnapshot() {
    this._prevCamX = this._camX;
    this._prevCamY = this._camY;
  },

  // ONE fixed simulation step of camera state. Updates _camX/_camY and the
  // shake offset; deliberately does NOT touch worldContainer — that is
  // _cameraApply's job, once per rendered frame.
  //
  // The camera must be interpolated for the same reason sprites are, and more
  // urgently: with camera.follow(player, 0) the camera locks to the player's
  // position each step, so a camera that jumped in fixed steps while the player
  // rendered interpolated would make the player visibly slide back and forth
  // relative to the viewport — the exact artefact interpolation exists to
  // remove. Interpolating both with the same alpha makes a hard-locked follow
  // render perfectly steady.
  _cameraUpdate(delta) {
    if (this._followTarget) {
      const visibleW = app.renderer.width / this._zoom;
      const visibleH = app.renderer.height / this._zoom;
      const desiredX = this._followTarget._handle.position.x - visibleW / 2;
      const desiredY = this._followTarget._handle.position.y - visibleH / 2;
      if (this._followSpeed === 0) {
        this._camX = desiredX;
        this._camY = desiredY;
      } else {
        this._camX += (desiredX - this._camX) * this._followSpeed;
        this._camY += (desiredY - this._camY) * this._followSpeed;
      }
    }
    if (this._boundsW !== null) {
      const visibleW = app.renderer.width / this._zoom;
      const visibleH = app.renderer.height / this._zoom;
      this._camX = Math.max(0, Math.min(this._boundsW - visibleW, this._camX));
      this._camY = Math.max(0, Math.min(this._boundsH - visibleH, this._camY));
    }

    this._shakeX = 0;
    this._shakeY = 0;
    if (this._shakeElapsed < this._shakeDuration) {
      // `delta` is milliseconds (the same value onupdate receives) and
      // cameraShake's `duration` is documented in seconds, so convert with
      // /1000. This read `/ 60` back when the frame loop was wired to PIXI's
      // frame-normalised ticker.deltaTime, where 1.0 per frame / 60 happened to
      // come out in seconds.
      this._shakeElapsed += (delta || 0) / 1000;
      const remaining = Math.max(0, 1 - this._shakeElapsed / this._shakeDuration);
      const magnitude = this._shakeIntensity * remaining;
      this._shakeX = (Math.random() * 2 - 1) * magnitude;
      this._shakeY = (Math.random() * 2 - 1) * magnitude;
    }
  },

  // Writes the camera to worldContainer for one rendered frame, blending
  // between the last two simulation samples. A hard cut (cameraSetPosition)
  // renders at the destination and clears its own flag.
  _cameraApply(alpha) {
    let x = this._camX;
    let y = this._camY;
    if (this._camSnap) {
      this._camSnap = false;
    } else {
      const a = alpha === undefined ? 1 : alpha;
      x = this._prevCamX + (this._camX - this._prevCamX) * a;
      y = this._prevCamY + (this._camY - this._prevCamY) * a;
    }
    worldContainer.scale.set(this._zoom, this._zoom);
    worldContainer.position.set(
      -x * this._zoom + this._shakeX,
      -y * this._zoom + this._shakeY
    );
  },

  // Puts worldContainer back on the authoritative camera position after the
  // render. Everything that reads global coordinates during a fixed step —
  // anything going through PIXI's getBounds(), i.e. spriteCollide, pointInBox,
  // raycast — then sees exactly the coordinate space it saw before
  // interpolation existed, rather than a value that drifts with frame timing.
  _cameraRestore() {
    worldContainer.position.set(
      -this._camX * this._zoom + this._shakeX,
      -this._camY * this._zoom + this._shakeY
    );
  },
```

Finally, extend `_cameraReset` so a scene switch cannot leave stale interpolation state behind — add these lines just before the `worldContainer.scale.set(1, 1);` line:

```js
    this._prevCamX = 0;
    this._prevCamY = 0;
    this._camSnap = true;
    this._shakeX = 0;
    this._shakeY = 0;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/camera.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/camera.js tests/components/Runner/camera.test.ts
git commit -m "feat: interpolate the camera at render time, keeping setPosition an instant cut"
```

---

### Task 6: Wire the frame loop into the engine and the bootstrapper

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/bootstrapper.html:185`
- Modify: `tests/components/Runner/bootstrapper.test.ts:68-90`

- [ ] **Step 1: Write the failing tests**

Replace the `describe('per-frame ticker wiring', ...)` block in `tests/components/Runner/bootstrapper.test.ts` with:

```ts
// The frame loop is driven by exactly two ticker callbacks, and their ORDER is
// load-bearing. PIXI runs ticker callbacks in descending priority, and
// Application registers its own render at UPDATE_PRIORITY.LOW (-25). So:
//
//   NORMAL  (0)  _sb._update      — fixed steps, then write interpolated positions
//   LOW    (-25) PIXI render      — draws the interpolated positions
//   UTILITY(-50) _sb._afterRender — restores the authoritative positions
//
// All three run synchronously inside one requestAnimationFrame tick, which is
// what guarantees no softBASIC code can ever observe an interpolated position.
// Get the priority wrong and either the render draws un-interpolated positions
// or game logic starts reading smoothed ones.
describe('per-frame ticker wiring', () => {
  const html = readFileSync('src/components/Runner/bootstrapper.html', 'utf-8');
  const tickerLines = html
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .filter((line) => line.includes('app.ticker.add'));

  test('registers exactly two per-frame ticker callbacks', () => {
    expect(tickerLines).toHaveLength(2);
  });

  test('drives _sb._update from the millisecond delta, not the normalised one', () => {
    expect(tickerLines[0]).toContain('_sb._update(ticker.deltaMS)');
  });

  test('never reads the frame-normalised ticker.deltaTime', () => {
    expect(tickerLines.join('\n')).not.toContain('deltaTime');
  });

  test('restores interpolated positions after PIXI renders', () => {
    expect(tickerLines[1]).toContain('_sb._afterRender()');
    expect(tickerLines[1]).toContain('PIXI.UPDATE_PRIORITY.UTILITY');
  });
});

// engine/frameloop.js has to be part of the assembled `_sb`, or _sb._update
// resolves to nothing and the game never ticks at all.
describe('frame loop engine wiring', () => {
  const engine = readFileSync('src/components/Runner/softBasicEngine.js', 'utf-8');

  test('spreads _sbFrameLoop into _sb', () => {
    expect(engine).toContain('..._sbFrameLoop,');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/Runner/bootstrapper.test.ts`
Expected: FAIL — "expected length 1 to be 2" and "expected ... to contain '..._sbFrameLoop,'".

- [ ] **Step 3: Wire the engine module**

In `src/components/Runner/softBasicEngine.js`, add `..._sbFrameLoop,` as the **last** entry, so its `_update` wins over `_sbLifecycle._update` and `_sbScene._update`:

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
  ..._sbPathfinding,
  ..._sbTween,
  ..._sbAttach,
  // Last on purpose. _sbFrameLoop supplies `_update`, the single per-frame
  // entry point, and it must win over the same-named members that _sbLifecycle
  // and _sbScene still carry (both are called explicitly rather than through
  // `_sb._update`, but a spread order change would silently repoint the ticker
  // at one of them and disable fixed stepping entirely).
  ..._sbFrameLoop,
};
```

- [ ] **Step 4: Check how engine files are concatenated**

The engine modules are gathered into the bootstrapper by whatever imports `softBasicEngine.js`. Verify `frameloop.js` is picked up:

```bash
grep -rn "engine/" src/components/Runner/index.tsx vite.config.ts scripts/ 2>/dev/null
```

If the list of engine files is explicit anywhere (rather than a glob), add `frameloop.js` to it — and add it **before** `softBasicEngine.js`, since that file references `_sbFrameLoop`.

- [ ] **Step 5: Wire the post-render callback**

In `src/components/Runner/bootstrapper.html`, replace the single ticker line (around line 185) with:

```js
          app.ticker.add((ticker) => _sb._update(ticker.deltaMS));

          // Runs AFTER PIXI's own render, which Application registers at
          // UPDATE_PRIORITY.LOW (-25); ticker callbacks fire in descending
          // priority order, so UTILITY (-50) is last. _sb._update leaves every
          // moving object's `position` holding an interpolated render value;
          // this puts the authoritative simulation value back, so the displaced
          // window is confined to the render call itself and no softBASIC code
          // can observe a smoothed position.
          app.ticker.add(() => _sb._afterRender(), null, PIXI.UPDATE_PRIORITY.UTILITY);
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/`
Expected: PASS.

- [ ] **Step 7: Verify the build**

Run: `npx vite build`
Expected: build succeeds. (Do **not** use `tsc --noEmit` — CLAUDE.md documents pre-existing unrelated failures there.)

- [ ] **Step 8: Commit**

```bash
git add src/components/Runner/softBasicEngine.js src/components/Runner/bootstrapper.html tests/components/Runner/bootstrapper.test.ts
git commit -m "feat: drive the game loop through the fixed-timestep frame loop"
```

---

### Task 7: Reset frame-loop state on scene switch

A scene switch destroys every instance. Interpolation bookkeeping lives on the handles, which die with them, but the accumulator and the displaced list are module-level and must not survive.

**Files:**
- Modify: `src/components/Runner/engine/stage.js:57-65`
- Modify: `src/components/Runner/engine/frameloop.js`
- Modify: `tests/components/Runner/frameloop.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/components/Runner/frameloop.test.ts`:

```ts
describe('frame loop reset', () => {
  test('clears banked time and displaced handles', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP + STEP / 2);
    expect(host._displaced.length).toBe(1);

    host._frameLoopReset();

    expect(host._accumulator).toBe(0);
    expect(host._alpha).toBe(0);
    expect(host._displaced.length).toBe(0);
    expect(host._inFixedStep).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/Runner/frameloop.test.ts -t 'clears banked time'`
Expected: FAIL — `host._frameLoopReset is not a function`.

- [ ] **Step 3: Implement**

Add to `src/components/Runner/engine/frameloop.js`, after `_afterRender`:

```js
  // Called from stage.clear() on a scene switch. The per-handle interpolation
  // fields die with the handles, but this module's own state does not: a
  // half-full accumulator would make the new scene's first frame run a step it
  // has not earned, and a stale _displaced entry would write a destroyed
  // handle's saved position back after the next render.
  _frameLoopReset() {
    this._accumulator = 0;
    this._alpha = 0;
    this._displaced.length = 0;
    this._inFixedStep = false;
  },
```

In `src/components/Runner/engine/stage.js`, add the call inside `clear()`, after `this._tileCollisionReset();`:

```js
    this._frameLoopReset();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/frameloop.js src/components/Runner/engine/stage.js tests/components/Runner/frameloop.test.ts
git commit -m "fix: reset frame-loop accumulator and interpolation state on scene switch"
```

---

### Task 8: Full verification

**Files:** none modified unless a failure demands it.

- [ ] **Step 1: Run the whole Vitest suite**

Run: `npx vitest run`
Expected: PASS, no new failures versus the pre-change baseline. If anything fails, capture the baseline first with `git stash && npx vitest run` to be sure it is not pre-existing.

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: success.

- [ ] **Step 3: Play Dungeon Explorer in a real browser**

Start the dev server (`npm run dev`), seed `src/docs/demos/DungeonExplorer.b4wgl.json` into a project via `localStorage` (`persist:softBASIC`) the way `cypress/e2e/demos.cy.ts` does, and run it. Confirm, item by item:

- movement is smooth and does not stutter
- wall collision still stops the player (no tunnelling, no sticking)
- attacking connects with enemies at the same reach as before
- enemies chase, telegraph (scale pulse), and knock back correctly
- the camera cuts instantly between rooms with **no** visible slide or smear
- the boss door tile swap still opens the way through
- no `ERR` lines in the console panel

- [ ] **Step 4: Spot-check a second demo**

Run Coins Platformer the same way — it uses kinematic movement plus tile collision. Confirm jumping, landing, coin pickup and enemy movement all behave, and no `ERR` lines appear.

- [ ] **Step 5: Run the Cypress suites**

With `npm run dev` already running:

```bash
npm run cypress:run
```

Expected: `tutorials.cy.ts` and `demos.cy.ts` pass. These are the only layers that actually execute the compiled game in a browser, and this change touches the runtime, so CLAUDE.md requires running them.

- [ ] **Step 6: Commit any fixes**

Only if step 3-5 turned up a real defect. Small, focused commit per fix.

---

### Task 9: Documentation

**Files:**
- Modify: `src/docs/language-guide/lifecycle.md:63-71`

- [ ] **Step 1: Update the onupdate section**

The observable change a softBASIC author can notice is that `delta` is now a constant, and that `onupdate` may run more or fewer times than there are rendered frames. Replace the `## onupdate(delta)` section with:

```markdown
## onupdate(delta)

Called every simulation step — a fixed 60 steps per second — with `delta` as the
elapsed time in milliseconds for that step.

```bas
function onupdate(delta)
  x = x + speed * delta
endfunction
```

Keep writing movement in terms of `delta` exactly as before. The engine runs the
simulation at a steady rate no matter how fast or slow the screen is drawing, and
draws moving objects at a blended in-between position, so motion stays smooth even
when a frame takes longer than usual. Because the simulation and the screen are
independent, `onupdate` may occasionally run twice before one frame is drawn, or
not at all — over any stretch of real time the totals still match, which is why
scaling by `delta` remains the right way to move things.
```

- [ ] **Step 2: Verify the docs page still renders**

Run: `npx vite build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/docs/language-guide/lifecycle.md
git commit -m "docs: describe the fixed simulation rate in the onupdate lifecycle topic"
```

---

## Out of scope / follow-ups

- **An `onrender` hook.** Would let the Raycaster do its software-rendering pass exactly once per rendered frame instead of once per fixed step. Worth doing if the doubled pass on slow frames turns out to matter.
- **Interpolating angle/scale/alpha.** Deliberately excluded (design decision 2). If a demo ever needs smoothly interpolated rotation, the right shape is an opt-in per-channel flag, not blanket interpolation.
- **A `transform.teleport()` API.** Would replace the `MAX_INTERP_STEP_PX` heuristic with an exact signal, but only for code updated to call it.
- **Release notes / version bump.** Per CLAUDE.md these happen only when the user asks for a push. Do not touch `package.json` or `src/docs/release-notes.md` in this work.
