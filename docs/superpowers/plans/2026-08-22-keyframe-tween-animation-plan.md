# Keyframe (Tween) Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new softBASIC engine feature — a `Keyframe` data class plus a `tween` module (`tween.play`/`tween.stop`/`tween.isPlaying`) that animates any sprite's angle, scale, alpha, and position over a sequence of keyframes. Reusable by any demo; not yet wired into Dungeon Explorer (that's a separate follow-up plan).

**Architecture:** `Keyframe` (`src/lib/Basic4WebGL/defs/Keyframe.bas`) is a plain hand-written data class with setters, zero engine JS. `tween` (`src/lib/Basic4WebGL/defs/tween.bas`) is a free module — three thin `call()` wrappers delegating to a new engine module `src/components/Runner/engine/tween.js`, which tracks active animations in a `Map` keyed by PIXI handle and interpolates per-frame, wired into the main loop exactly like `pathfinding`'s existing `_pathfindingUpdate` hook.

**Tech Stack:** softBASIC, PIXI.js (via the existing engine module pattern), Vitest.

**Design spec:** `docs/superpowers/specs/2026-08-22-keyframe-animation-design.md` — read this first, this plan implements it exactly.

---

### Task 1: `Keyframe` data class

**Files:**
- Create: `src/lib/Basic4WebGL/defs/Keyframe.bas`
- Create: `tests/lib/Basic4WebGL/unit/transpiler/keyframe.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const keyframeSource = readFileSync('src/lib/Basic4WebGL/defs/Keyframe.bas', 'utf-8');

const transpileWithKeyframe = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'Keyframe', source: keyframeSource }],
    files: [{ name: 'Main.bas', source }],
  });

describe('Keyframe — construction and defaults', () => {
  test('compiles without error', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('constructor sets neutral defaults for every field', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('this.time = 0');
    expect(result.code).toContain('this.angle = 0');
    expect(result.code).toContain('this.scalex = 1');
    expect(result.code).toContain('this.scaley = 1');
    expect(result.code).toContain('this.alpha = 1');
    expect(result.code).toContain('this.x = 0');
    expect(result.code).toContain('this.y = 0');
  });
});

describe('Keyframe — setters', () => {
  test('each setter assigns its field (compiled lowercase)', () => {
    const result = transpileWithKeyframe([
      'function test()',
      '  dim k as Keyframe',
      '  k = new Keyframe()',
      '  k.setTime(0.4)',
      '  k.setAngle(360)',
      '  k.setScaleX(2)',
      '  k.setScaleY(2)',
      '  k.setAlpha(0.5)',
      '  k.setPosition(100, 50)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('.prototype.settime');
    expect(result.code).toContain('.prototype.setangle');
    expect(result.code).toContain('.prototype.setscalex');
    expect(result.code).toContain('.prototype.setscaley');
    expect(result.code).toContain('.prototype.setalpha');
    expect(result.code).toContain('.prototype.setposition');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/keyframe.test.ts`
Expected: FAIL — `Keyframe.bas` doesn't exist yet, `readFileSync` throws `ENOENT`.

- [ ] **Step 3: Write `src/lib/Basic4WebGL/defs/Keyframe.bas`**

```bas
Class
dim time
dim angle
dim scaleX
dim scaleY
dim alpha
dim x
dim y

Constructor()
  self.time = 0
  self.angle = 0
  self.scaleX = 1
  self.scaleY = 1
  self.alpha = 1
  self.x = 0
  self.y = 0
EndConstructor

function setTime(t)
  self.time = t
endfunction

function setAngle(a)
  self.angle = a
endfunction

function setScaleX(sx)
  self.scaleX = sx
endfunction

function setScaleY(sy)
  self.scaleY = sy
endfunction

function setAlpha(al)
  self.alpha = al
endfunction

function setPosition(px, py)
  self.x = px
  self.y = py
endfunction

EndClass
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/keyframe.test.ts`
Expected: PASS (both `describe` blocks, 3 tests total)

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/Keyframe.bas tests/lib/Basic4WebGL/unit/transpiler/keyframe.test.ts
git commit -m "feat: add Keyframe data class for the upcoming tween module"
```

---

### Task 2: `tween` engine module (interpolation logic)

**Files:**
- Create: `src/components/Runner/engine/tween.js`
- Create: `tests/components/Runner/tween.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/tween.js is a plain script (not an ES module) — same loading
// technique tests/components/Runner/pathfinding.test.ts already uses for
// engine/pathfinding.js, since it declares a bare `const _sbTween` that the
// runner concatenates into the sandboxed iframe rather than importing.
function loadTween() {
  const src = readFileSync('src/components/Runner/engine/tween.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbTween;`);
  return factory();
}

function makeHandle() {
  return {
    angle: 0,
    alpha: 1,
    scale: { x: 1, y: 1, set(x: number, y: number) { this.x = x; this.y = y; } },
    position: { x: 0, y: 0, set(x: number, y: number) { this.x = x; this.y = y; } },
  };
}

// Matches the compiled field names a real `Keyframe` instance has —
// scaleX/scaleY compile to lowercase scalex/scaley (confirmed via a
// throwaway transpile during design, not assumed).
function frame(time: number, angle: number, scalex = 1, scaley = 1, alpha = 1, x = 0, y = 0) {
  return { time, angle, scalex, scaley, alpha, x, y };
}

describe('tweenPlay / tweenIsPlaying / tweenStop', () => {
  test('a sprite is not playing until tweenPlay is called', () => {
    const tw = loadTween();
    const handle = makeHandle();
    expect(tw.tweenIsPlaying({ _handle: handle })).toBe(false);
  });

  test('tweenPlay starts it, tweenStop halts it', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 90)], false);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(true);
    tw.tweenStop(spriteObj);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(false);
  });

  test('does nothing given no handle or an empty frames array', () => {
    const tw = loadTween();
    expect(() => tw.tweenPlay({ _handle: null }, [frame(0, 0)], false)).not.toThrow();
    expect(() => tw.tweenPlay({ _handle: makeHandle() }, [], false)).not.toThrow();
  });
});

describe('_tweenUpdate — interpolation', () => {
  test('linearly interpolates angle between two keyframes', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay({ _handle: handle }, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(500); // 0.5s of a 1s span
    expect(handle.angle).toBeCloseTo(50);
  });

  test('interpolates scale, alpha, and position together', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay(
      { _handle: handle },
      [frame(0, 0, 1, 1, 1, 0, 0), frame(1, 0, 3, 3, 0, 100, 200)],
      false
    );
    tw._tweenUpdate(500);
    expect(handle.scale.x).toBeCloseTo(2);
    expect(handle.scale.y).toBeCloseTo(2);
    expect(handle.alpha).toBeCloseTo(0.5);
    expect(handle.position.x).toBeCloseTo(50);
    expect(handle.position.y).toBeCloseTo(100);
  });

  test('frames need not be pre-sorted — engine sorts by time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay({ _handle: handle }, [frame(1, 100), frame(0, 0)], false);
    tw._tweenUpdate(500);
    expect(handle.angle).toBeCloseTo(50);
  });

  test('before the first keyframe, snaps immediately to its values', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay({ _handle: handle }, [frame(0.5, 40), frame(1, 100)], false);
    tw._tweenUpdate(16.67); // well before time=0.5
    expect(handle.angle).toBeCloseTo(40);
  });

  test('non-looping: holds the final keyframe and stops after it finishes', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(0.5, 100)], false);
    tw._tweenUpdate(1000); // well past the 0.5s span
    expect(handle.angle).toBeCloseTo(100);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(false);
  });

  test('looping: wraps elapsed time modulo the last keyframe time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], true);
    tw._tweenUpdate(1500); // 1.5s -> wraps to 0.5s into the loop
    expect(handle.angle).toBeCloseTo(50);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(true);
  });

  test('restarting play on an already-playing sprite resets elapsed time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(900);
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false); // restart
    tw._tweenUpdate(0);
    expect(handle.angle).toBeCloseTo(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/tween.test.ts`
Expected: FAIL — `src/components/Runner/engine/tween.js` doesn't exist yet.

- [ ] **Step 3: Write `src/components/Runner/engine/tween.js`**

```javascript
const _sbTween = {
  _playing: new Map(), // handle -> { frames: [...sorted by time], loop, elapsed }

  tweenPlay(spriteObj, frames, loop) {
    if (!spriteObj || !spriteObj._handle || !frames || frames.length === 0) return;
    const sorted = [...frames].sort((a, b) => a.time - b.time);
    this._playing.set(spriteObj._handle, { frames: sorted, loop: !!loop, elapsed: 0 });
  },

  tweenStop(spriteObj) {
    if (spriteObj && spriteObj._handle) this._playing.delete(spriteObj._handle);
  },

  tweenIsPlaying(spriteObj) {
    return !!(spriteObj && spriteObj._handle && this._playing.has(spriteObj._handle));
  },

  _tweenUpdate(delta) {
    const dt = delta / 1000;
    for (const [handle, state] of this._playing) {
      state.elapsed += dt;
      const { frames, loop } = state;
      const last = frames[frames.length - 1];
      let t = state.elapsed;

      if (loop) {
        t = t % last.time;
      } else if (t >= last.time) {
        this._applyFrame(handle, last);
        this._playing.delete(handle);
        continue;
      }

      let i = 0;
      while (i < frames.length - 1 && frames[i + 1].time <= t) i++;
      const a = frames[i];
      const b = frames[Math.min(i + 1, frames.length - 1)];
      const span = b.time - a.time;
      const f = span > 0 ? (t - a.time) / span : 0;

      // Keyframe's softBASIC fields scaleX/scaleY compile to lowercase
      // scalex/scaley -- read those, not the camelCase names.
      this._applyFrame(handle, {
        angle: a.angle + (b.angle - a.angle) * f,
        scaleX: a.scalex + (b.scalex - a.scalex) * f,
        scaleY: a.scaley + (b.scaley - a.scaley) * f,
        alpha: a.alpha + (b.alpha - a.alpha) * f,
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
      });
    }
  },

  _applyFrame(handle, v) {
    handle.angle = v.angle;
    handle.scale.set(v.scaleX, v.scaleY);
    handle.alpha = v.alpha;
    handle.position.set(v.x, v.y);
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/tween.test.ts`
Expected: PASS (all tests in both `describe` blocks)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/tween.js tests/components/Runner/tween.test.ts
git commit -m "feat: add tween engine module for keyframe interpolation"
```

---

### Task 3: Wire `tween` into the engine's main loop and `_sb` mixin

**Files:**
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `src/components/Runner/engine/scene.js`
- Modify: `tests/components/Runner/scene.test.ts` (read first — check its existing shape before adding to it)

- [ ] **Step 1: Read `src/components/Runner/engine/scene.js` and `tests/components/Runner/scene.test.ts` in full**

Confirm the exact current shape of `_update(delta)` and how the existing `scene.test.ts` test (there's exactly one, per the project's CLAUDE.md test-count notes) verifies the update loop calls `_cameraUpdate`/`_pathfindingUpdate`, so the new `_tweenUpdate` call can be added and verified the same way.

- [ ] **Step 2: Add `this._tweenUpdate(delta);` to `_update` in `scene.js`**

```javascript
  _update(delta) {
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

- [ ] **Step 3: Mix `_sbTween` into `_sb` in `softBasicEngine.js`**

```javascript
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
};
```

- [ ] **Step 4: Update or add a `scene.test.ts` assertion that `_update` calls `_tweenUpdate`**

Follow whatever pattern the existing test already uses for asserting `_cameraUpdate`/`_pathfindingUpdate` get called (likely a spy/mock on the mixed-in object) — add the equivalent for `_tweenUpdate`.

- [ ] **Step 5: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, including the updated `scene.test.ts` and everything from Tasks 1–2.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/softBasicEngine.js src/components/Runner/engine/scene.js tests/components/Runner/scene.test.ts
git commit -m "feat: wire tween module into the engine's main update loop"
```

---

### Task 4: `tween` module `.bas` defs

**Files:**
- Create: `src/lib/Basic4WebGL/defs/tween.bas`
- Create: `tests/lib/Basic4WebGL/unit/transpiler/tween.test.ts`

- [ ] **Step 1: Write the failing test**

Follow `tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`'s exact shape (read it first — already read during planning, this mirrors it directly):

```typescript
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const tweenSource = readFileSync('src/lib/Basic4WebGL/defs/tween.bas', 'utf-8');

const transpileWithTween = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'tween', source: tweenSource }],
    files: [{ name: 'Main.bas', source }],
  });

describe('tween — play', () => {
  test('compiles without error', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim frames(0)',
      '  tween.play(sprite, frames, false)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.tweenPlay( and passes the sprite instance directly', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim frames(0)',
      '  tween.play(sprite, frames, false)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tweenPlay(');
    expect(result.code).not.toContain('play_sprite._handle');
  });
});

describe('tween — stop', () => {
  test('compiles without error', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  tween.stop(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.tweenStop(', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  tween.stop(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tweenStop(');
  });
});

describe('tween — isPlaying', () => {
  test('compiles without error', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim playing',
      '  playing = tween.isPlaying(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.tweenIsPlaying(', () => {
    const result = transpileWithTween([
      'function test()',
      '  dim sprite',
      '  dim playing',
      '  playing = tween.isPlaying(sprite)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.tweenIsPlaying(');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tween.test.ts`
Expected: FAIL — `tween.bas` doesn't exist yet.

- [ ] **Step 3: Write `src/lib/Basic4WebGL/defs/tween.bas`**

```bas
function play(sprite, frames, loop)
    call("_sb.tweenPlay(play_sprite, play_frames, play_loop)")
endfunction

function stop(sprite)
    call("_sb.tweenStop(stop_sprite)")
endfunction

function isPlaying(sprite)
    return call("_sb.tweenIsPlaying(isplaying_sprite)")
endfunction
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/tween.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/tween.bas tests/lib/Basic4WebGL/unit/transpiler/tween.test.ts
git commit -m "feat: add tween module defs (play/stop/isPlaying)"
```

---

### Task 5: Register `Keyframe` and `tween` as library modules

**Files:**
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`

- [ ] **Step 1: Add imports and map entries to `packageModules.ts`**

Add near the other `defs/*.bas?raw` imports (after `hud`):

```typescript
import Keyframe from '../lib/Basic4WebGL/defs/Keyframe.bas?raw';
import tween from '../lib/Basic4WebGL/defs/tween.bas?raw';
```

Add to the exported `packageModules` map:

```typescript
  Keyframe,
  tween,
```

- [ ] **Step 2: Add both module names to `softgfx` and bump its version**

In `src/constants/firstPartyPackages.ts`, add `'Keyframe'` and `'tween'` to the `softgfx` package's `moduleNames` array, and bump `version` from `'2.5.0'` to `'2.6.0'` (following this project's established convention of bumping `softGfx`'s version on every new module it ships — confirmed via git history during design).

- [ ] **Step 3: Build check**

```bash
npx vite build
```

Expected: builds cleanly — this catches a typo'd import path or a malformed package entry immediately.

- [ ] **Step 4: Manual smoke check — a project can actually use `Keyframe`/`tween`**

Start the dev server, create a throwaway project (or reuse an existing one) with a `Main.bas` that constructs a `Keyframe`, pushes it into an array, and calls `tween.play(someSprite, frames, false)` on a sprite; confirm it compiles with zero diagnostics in the editor. This is the first point in the plan where the whole chain (defs → package registration → compiler) is exercised end-to-end for a real project, not just a unit test's isolated `lib:` array.

- [ ] **Step 5: Commit**

```bash
git add src/constants/packageModules.ts src/constants/firstPartyPackages.ts
git commit -m "feat: register Keyframe and tween in the softGfx package"
```

---

### Task 6: Docs

**Files:**
- Create: `src/docs/api-reference/tween.md`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Write `src/docs/api-reference/tween.md`**

Follow this project's established API-doc conventions (see `CLAUDE.md`'s "Writing style for API docs" and `tilemapset.md`'s precedent for documenting a small helper class — `Marker` — inline within the page of the module that uses it, rather than giving it its own nav entry; do the same here for `Keyframe` within this page). Structure:

1. Short intro paragraph: what `tween` is for, one plain-English sentence on what a keyframe sequence is (a list of points in time with a target angle/scale/alpha/position at each one, smoothly interpolated between).
2. `## Keyframe` section, starting with a `## Constructor` sub-section (per the classes convention), then a table of the six setters (`setTime`, `setAngle`, `setScaleX`, `setScaleY`, `setAlpha`, `setPosition`) — beginner-friendly, no JS/internals, game-like example (a `.bas` snippet building two keyframes for something like a treasure chest lid).
3. `## play(sprite, frames, loop)`, `## stop(sprite)`, `## isPlaying(sprite)` sections — one-sentence description, parameter table, `**Returns:**` line for `isPlaying`, `.bas` code example for each.
4. Call out the position-default gotcha explicitly (`> **Note:**` callout, matching `assetmanager.md`'s and `collision.md`'s established callout convention): if a keyframe sequence uses position at all, every keyframe in it needs `setPosition` called, or the ones that skip it snap to `(0, 0)`.
5. Call out the "snap to first keyframe" behavior the same way: no implicit start-from-current-value frame.

- [ ] **Step 2: Add the manifest entry**

In `src/docs/manifest.ts`, add to the `softGfx` group's `topics` array (after the `pathfinding` entry, before `scene`):

```typescript
{ slug: 'tween', title: 'tween', file: 'api-reference/tween.md' },
```

- [ ] **Step 3: Build check**

```bash
npx vite build
```

Expected: builds cleanly.

- [ ] **Step 4: Manual check — the docs page renders**

Start the dev server, navigate to `/docs/api-reference/tween`, confirm the page renders with no console errors and the nav sidebar shows the new "tween" entry in the softGfx group.

- [ ] **Step 5: Commit**

```bash
git add src/docs/api-reference/tween.md src/docs/manifest.ts
git commit -m "docs: add tween/Keyframe API reference page"
```

---

### Task 7: Roadmap entry

**Files:**
- Modify: `docs/language/library-roadmap.md`

- [ ] **Step 1: Add a new `[DONE]` entry under "Lower Priority / Future"**

This isn't closing out an existing tracked `P##` item — it's a fresh capability — so add it as a new bullet in the same style as the existing `~~Vector math helpers~~ **[DONE]**` / `~~Circle collision~~ **[DONE]**` entries in that section:

```markdown
- ~~Keyframe (tween) animation~~ **[DONE]** — `Keyframe` class + `tween` module (`tween.play`/`stop`/`isPlaying`) shipped, animating a sprite's angle/scale/alpha/position over a sequence of keyframes, linearly interpolated. Built to unblock Dungeon Explorer's melee attack (player spin + sword swing), but scoped as a general-purpose reusable capability, not demo-specific. A free module rather than sprite instance methods — deliberately, since `animatedsprite` doesn't actually inherit from `sprite` in this codebase, so instance methods would've needed hand-duplicating onto both classes; a free module (mirroring `pathfinding.navigateTo`'s existing shape) sidesteps that entirely. Position keyframes have no safe default (unlike angle/scale/alpha, which default to neutral values) — a keyframe sequence using position must set it on every keyframe or the ones that skip it snap to `(0, 0)`, a deliberate documented constraint rather than a magic fallback. Design spec: `docs/superpowers/specs/2026-08-22-keyframe-animation-design.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/keyframe.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/tween.test.ts`, `tests/components/Runner/tween.test.ts`. Docs: `src/docs/api-reference/tween.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/language/library-roadmap.md
git commit -m "docs: mark keyframe/tween animation done in the library roadmap"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full Vitest suite**

```bash
npx vitest run
```

Expected: all tests pass, including every test added in Tasks 1–4 plus the modified `scene.test.ts`.

- [ ] **Step 2: Build**

```bash
npx vite build
```

Expected: builds cleanly.

- [ ] **Step 3: Manual end-to-end browser check**

Using the same throwaway/scratch project from Task 5, actually run it and drive a few frames (via the browser automation technique already established this session — `_sb._update(16.67)` in a loop): construct a plain `sprite`, build a 2-keyframe sequence (angle `0` → `360` over `1` second), call `tween.play(theSprite, frames, false)`, and confirm via `theSprite.transform` / the underlying handle's `.angle` that it's actually interpolating partway through and lands on `360` at the end, not just that it compiles. This is the layer that catches "compiles and runs with zero console errors" not proving "the interpolation is actually visually correct" — Task 2's unit tests already prove the math in isolation; this step proves the whole chain (`.bas` call → `_sb.tweenPlay` → `_tweenUpdate` wired into the real per-frame loop → visible sprite) is connected correctly end to end.

- [ ] **Step 4: Report and stop**

Report full results. Do not push — per `CLAUDE.md`, this needs a release-notes entry and version bump when the user asks to push (a new library module is runtime/language-visible, not exempt). The Dungeon Explorer integration (sword + spin attack) is a separate follow-up plan, not part of this one — don't start it without the user asking.
