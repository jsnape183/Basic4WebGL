# Raycaster per-scene settings (`RcSettings`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a raycaster scene create a mutable `RcSettings` object, tune ~18 behavioural knobs, and `bindSettings(cfg)` it into its Rc* objects — with every unbound scene rendering byte-identically to today.

**Architecture:** `RcConfig` stays a `const` block, reframed as *defaults + structural enums*. A new hand-written `RcSettings` class holds one `dim` + getter + setter per knob, seeded from `RcConfig` in its constructor. `RcWorld`, `RcCast`, `RcMover`, `RcRender`, `RcLights` each gain a `cfg` field (defaulted to `new RcSettings()` in their constructor) and a `bindSettings(s)` method; `RcRender` and `RcLights` forward the bind to the `RcCast` they own. Hot-path `RcConfig.RC_<knob>` reads become `self.cfg.<knob>()`. `RcLights.bindSettings` re-runs `bakeStatic()`; `RcWorld` switches per-cell ceiling/light-height defaults to a `RC_UNTAGGED` sentinel resolved at query time.

**Tech Stack:** softBASIC (`.bas` transpiled to JS), Vitest integration tests that transpile the whole `softRaycaster` package and run it via `new Function`. Build check: `npx vite build`.

**Reference:** `docs/superpowers/specs/2026-09-09-raycaster-per-scene-settings-design.md`

---

## softBASIC reminders for the implementer

- Every `dim` goes at the **top** of its function (or class body for fields). No `dim` mid-body.
- No `elseif`. Nest `if/else`. No `for … step`. `<>` not `!=`.
- Class fields: `dim cfg as RcSettings` in the class body; set with `self.cfg = …`.
- Method calls on self: `self.foo(x)`. Construct: `new RcSettings()`.
- Case-insensitive identifiers. Transpiled class `RcSettings` → JS `_sb_rcsettings`; a method `moveSpeed` → `.movespeed()`.
- `const … endconst` members are plain `NAME = <positive-int-or-float literal>` lines. No expressions, no negative literals — hence the sentinel is `999999`, not `-1`.
- Do **not** hand-edit descriptor-generated `.bas` files. None of the `Rc*` files are generated (`src/lib/Basic4WebGL/library/registry.ts` lists the generated set — `Rc*` is not in it), so all edits here are direct.

## Verification commands

- Transpile+run a single test: `npx vitest run tests/lib/Basic4WebGL/integration/<file> --no-coverage`
- Raycaster + drawing + generator subset: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster tests/components/Runner/drawing.test.ts tests/lib/Basic4WebGL/unit/generator`
- Full suite: `npx vitest run`
- Build: `npx vite build`

Note: this machine is loaded; `npx vitest run` (full) takes ~3 min and may print one benign `[vitest-worker]: Timeout calling "onTaskUpdate"` line — that is not a failure. Judge by the `Test Files … passed` / `Tests … passed` summary.

---

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/Basic4WebGL/defs/RcConfig.bas` | default values + structural enums | add `RC_UNTAGGED = 999999`; header paragraph |
| `src/lib/Basic4WebGL/defs/RcSettings.bas` | mutable per-scene knob holder | **new** |
| `src/lib/Basic4WebGL/defs/RcCast.bas` | ray march | `cfg` + `bindSettings`; `RC_MAX_DIST` → `cfg.maxDist()` |
| `src/lib/Basic4WebGL/defs/RcWorld.bas` | tagged tilemap → queryable world | `cfg` + `bindSettings`; sentinel-fill + query-time `stdCeil`/`lightDefaultZ` |
| `src/lib/Basic4WebGL/defs/RcMover.bas` | height-aware body | `cfg` + `bindSettings`; physics knobs via `cfg` |
| `src/lib/Basic4WebGL/defs/RcLights.bas` | ambient + baked/dynamic lights | `cfg` + `bindSettings` (re-bake); bake-array clear; light knobs via `cfg` |
| `src/lib/Basic4WebGL/defs/RcRender.bas` | first-person view | `cfg` + `bindSettings` (forward to `self.rc`); `eyeZ`/`maxPitch`/`stdCeil`/`maxDist`/`surfLightStep`/`surfSegMax`/`actorHeight` via `cfg` |
| `src/constants/packageModules.ts` | module name → `.bas` source | import + `rcsettings` entry |
| `src/constants/firstPartyPackages.ts` | package → module list | `rcsettings` in `moduleNames` |
| `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts` | regression guard | **new** |
| `src/docs/guides/raycaster-library.md` | user guide | "Per-scene tuning" section + 18-knob table |
| `docs/raycaster/api-reference.md` | internal agent ref | `RcSettings` row |
| `src/docs/language-guide/packages.md` | package module tables | `RcSettings` row |
| `docs/language/library-roadmap.md` | roadmap | mark shipped |

**Note:** the raycaster has no per-module API pages in the app (`src/docs/api-reference/` has none for `Rc*`, `src/docs/manifest.ts` references none) — it is documented entirely via the "Building a Raycaster" guide. `RcSettings` follows suit: no new app page, no manifest change.

---

## The 18 knobs (name → default constant → getter/setter)

`moveSpeed`/`RC_MOVE_SPEED`/2.6, `turnSpeed`/`RC_TURN_SPEED`/2.4, `lookSpeed`/`RC_LOOK_SPEED`/400.0, `gravity`/`RC_GRAVITY`/14.0, `jumpVel`/`RC_JUMP_VEL`/5.0, `stepUp`/`RC_STEP_UP`/0.35, `maxStepDt`/`RC_MAX_STEP_DT`/0.1, `maxPitch`/`RC_MAX_PITCH`/220, `eyeZ`/`RC_EYE_Z`/0.5, `maxDist`/`RC_MAX_DIST`/32, `staticLightRange`/`RC_LIGHT_RANGE`/6, `lightCap`/`RC_LIGHT_CAP`/4, `staticLightIntensity`/`RC_STATIC_INTENSITY`/0.9, `lightDefaultZ`/`RC_LIGHT_DEFAULT_Z`/0.85, `stdCeil`/`RC_STD_CEIL`/1.0, `surfLightStep`/`RC_SURF_LIGHT_STEP`/0.12, `surfSegMax`/`RC_SURF_SEG_MAX`/6, `actorHeight`/`RC_ACTOR_HEIGHT`/1.0.

Getter = the camelCase name (`moveSpeed()`), setter = `set` + PascalCase (`setMoveSpeed(v)`).

---

## Task 1: `RcSettings.bas` + package registration

**Files:**
- Create: `src/lib/Basic4WebGL/defs/RcSettings.bas`
- Modify: `src/constants/packageModules.ts`
- Modify: `src/constants/firstPartyPackages.ts`
- Test: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`. Model the
harness on `tests/lib/Basic4WebGL/integration/raycasterFloorFieldRiser.test.ts`
(same `_sb` Proxy + `new Function` factory). Write it with **one reusable
`loadPkg` helper** that later tasks reuse:

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

type Marker = { row: number; col: number; tag: string };
type TileAt = (h: unknown, px: number, py: number) => number;

// Transpile the whole softRaycaster package and hand back its classes,
// wired to a tilemap defined by `tileAt` (pixel coords) + `markers`.
function loadPkg(tileAt: TileAt, markers: Marker[], cols: number, rows: number) {
  const tw = 16;
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) {
      if (p === Symbol.toPrimitive || p === 'then') return undefined;
      if (p in t) return t[p];
      return (..._a: unknown[]) => proxy;
    },
    set(t, p: string, v) { t[p] = v; return true; },
    apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => cols * tw;
  _sb.tileMapHeightPx = () => rows * tw;
  _sb.tileAt = tileAt;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) =>
    Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])];
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0,
    _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i),
    _sbRemove: () => {},
    _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i],
    _createDict: () => new Map(),
  };
  const factory = new Function(
    '_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcSettings: _sb_rcsettings, RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcCast: _sb_rccast, RcMover: _sb_rcmover, RcLights: _sb_rclights, RcRender: _sb_rcrender };`,
  );
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());
  return M as {
    RcSettings: new () => any;
    RcWorld: new (tm: any, layer: string) => any;
    TileMapSet: new (name: string) => any;
    RcCast: new () => any;
    RcMover: new (w: any, x: number, y: number, r: number, h: number) => any;
    RcLights: new (w: any) => any;
    RcRender: new (w: any) => any;
  };
}

const empty: TileAt = () => 0;

describe('RcSettings', () => {
  test('every getter returns the RcConfig default', () => {
    const { RcSettings } = loadPkg(empty, [], 12, 10);
    const s = new RcSettings();
    expect(s.movespeed()).toBe(2.6);
    expect(s.turnspeed()).toBe(2.4);
    expect(s.lookspeed()).toBe(400.0);
    expect(s.gravity()).toBe(14.0);
    expect(s.jumpvel()).toBe(5.0);
    expect(s.stepup()).toBe(0.35);
    expect(s.maxstepdt()).toBe(0.1);
    expect(s.maxpitch()).toBe(220);
    expect(s.eyez()).toBe(0.5);
    expect(s.maxdist()).toBe(32);
    expect(s.staticlightrange()).toBe(6);
    expect(s.lightcap()).toBe(4);
    expect(s.staticlightintensity()).toBe(0.9);
    expect(s.lightdefaultz()).toBe(0.85);
    expect(s.stdceil()).toBe(1.0);
    expect(s.surflightstep()).toBe(0.12);
    expect(s.surfsegmax()).toBe(6);
    expect(s.actorheight()).toBe(1.0);
  });

  test('each setter updates its getter', () => {
    const { RcSettings } = loadPkg(empty, [], 12, 10);
    const s = new RcSettings();
    s.setmovespeed(3.4); expect(s.movespeed()).toBe(3.4);
    s.setgravity(40); expect(s.gravity()).toBe(40);
    s.setstdceil(3.0); expect(s.stdceil()).toBe(3.0);
    s.setmaxdist(48); expect(s.maxdist()).toBe(48);
  });
});
```

- [ ] **Step 2: Run it — fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: FAIL — transpile diagnostics or `_sb_rcsettings is not defined` (module doesn't exist yet).

- [ ] **Step 3: Create `RcSettings.bas`**

Create `src/lib/Basic4WebGL/defs/RcSettings.bas` exactly:

```basic
Class
' RcSettings -- per-scene tunables for the raycaster (softRaycaster package).
'
' RcConfig holds the DEFAULTS (plus structural enums that never change).
' RcSettings is a mutable value object: a scene builds one, adjusts the knobs
' it cares about, and binds it to the Rc* objects it constructs --
'   self.cfg = new RcSettings()
'   self.cfg.setStdCeil(3.0)
'   self.wld.bindSettings(self.cfg)   ' + ren / me / lights
' Every Rc* class defaults its own `cfg` to `new RcSettings()`, so a scene that
' never calls bindSettings behaves exactly as before this module existed.
'
' Bind EARLY -- right after `new`, before the first step()/renderFrame()/
' bake. RcLights re-bakes its static lights on bindSettings; RcWorld resolves
' stdCeil / lightDefaultZ at query time.
'
' moveSpeed / turnSpeed / lookSpeed are read only by scene code
' (self.me.move(fwd * self.cfg.moveSpeed(), ...)); they live here so every
' movement knob has one home.

dim mvSpeed
dim tnSpeed
dim lkSpeed
dim grav
dim jump
dim stepUpH
dim maxDt
dim pitchCap
dim eye
dim dist
dim slRange
dim lCap
dim slIntensity
dim lDefZ
dim ceilStd
dim surfStep
dim surfSeg
dim actorH

Constructor()
    self.mvSpeed = RcConfig.RC_MOVE_SPEED
    self.tnSpeed = RcConfig.RC_TURN_SPEED
    self.lkSpeed = RcConfig.RC_LOOK_SPEED
    self.grav = RcConfig.RC_GRAVITY
    self.jump = RcConfig.RC_JUMP_VEL
    self.stepUpH = RcConfig.RC_STEP_UP
    self.maxDt = RcConfig.RC_MAX_STEP_DT
    self.pitchCap = RcConfig.RC_MAX_PITCH
    self.eye = RcConfig.RC_EYE_Z
    self.dist = RcConfig.RC_MAX_DIST
    self.slRange = RcConfig.RC_LIGHT_RANGE
    self.lCap = RcConfig.RC_LIGHT_CAP
    self.slIntensity = RcConfig.RC_STATIC_INTENSITY
    self.lDefZ = RcConfig.RC_LIGHT_DEFAULT_Z
    self.ceilStd = RcConfig.RC_STD_CEIL
    self.surfStep = RcConfig.RC_SURF_LIGHT_STEP
    self.surfSeg = RcConfig.RC_SURF_SEG_MAX
    self.actorH = RcConfig.RC_ACTOR_HEIGHT
EndConstructor

function moveSpeed()
    return self.mvSpeed
endfunction
function setMoveSpeed(v)
    self.mvSpeed = v
endfunction

function turnSpeed()
    return self.tnSpeed
endfunction
function setTurnSpeed(v)
    self.tnSpeed = v
endfunction

function lookSpeed()
    return self.lkSpeed
endfunction
function setLookSpeed(v)
    self.lkSpeed = v
endfunction

function gravity()
    return self.grav
endfunction
function setGravity(v)
    self.grav = v
endfunction

function jumpVel()
    return self.jump
endfunction
function setJumpVel(v)
    self.jump = v
endfunction

function stepUp()
    return self.stepUpH
endfunction
function setStepUp(v)
    self.stepUpH = v
endfunction

function maxStepDt()
    return self.maxDt
endfunction
function setMaxStepDt(v)
    self.maxDt = v
endfunction

function maxPitch()
    return self.pitchCap
endfunction
function setMaxPitch(v)
    self.pitchCap = v
endfunction

function eyeZ()
    return self.eye
endfunction
function setEyeZ(v)
    self.eye = v
endfunction

function maxDist()
    return self.dist
endfunction
function setMaxDist(v)
    self.dist = v
endfunction

function staticLightRange()
    return self.slRange
endfunction
function setStaticLightRange(v)
    self.slRange = v
endfunction

function lightCap()
    return self.lCap
endfunction
function setLightCap(v)
    self.lCap = v
endfunction

function staticLightIntensity()
    return self.slIntensity
endfunction
function setStaticLightIntensity(v)
    self.slIntensity = v
endfunction

function lightDefaultZ()
    return self.lDefZ
endfunction
function setLightDefaultZ(v)
    self.lDefZ = v
endfunction

function stdCeil()
    return self.ceilStd
endfunction
function setStdCeil(v)
    self.ceilStd = v
endfunction

function surfLightStep()
    return self.surfStep
endfunction
function setSurfLightStep(v)
    self.surfStep = v
endfunction

function surfSegMax()
    return self.surfSeg
endfunction
function setSurfSegMax(v)
    self.surfSeg = v
endfunction

function actorHeight()
    return self.actorH
endfunction
function setActorHeight(v)
    self.actorH = v
endfunction

EndClass
```

- [ ] **Step 4: Register the module**

In `src/constants/packageModules.ts`, add the import next to the other `Rc*` imports (after `import RcConfig …`):

```ts
import RcSettings from '../lib/Basic4WebGL/defs/RcSettings.bas?raw';
```

and add the entry to the exported `packageModules` object next to `rcconfig` (lowercase key — references resolve lowercased):

```ts
  rcsettings: RcSettings,
```

In `src/constants/firstPartyPackages.ts`, change the `softraycaster` package's `moduleNames` array to insert `'rcsettings'` right after `'rcconfig'`:

```ts
    moduleNames: ['rcconfig', 'rcsettings', 'rcworld', 'rccast', 'rcmover', 'rclights', 'rcactor', 'rcactors', 'rcrender'],
```

- [ ] **Step 5: Run test — passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: PASS (2 tests).

- [ ] **Step 6: Build check**

Run: `npx vite build`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcSettings.bas src/constants/packageModules.ts src/constants/firstPartyPackages.ts tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts
git commit -m "feat(raycaster): RcSettings value object + package registration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `RcConfig.bas` — sentinel + header

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcConfig.bas`

- [ ] **Step 1: Add the sentinel constant**

In the `const … endconst` block, add this line immediately after `RC_STD_CEIL = 1.0`:

```basic
    RC_UNTAGGED = 999999
```

- [ ] **Step 2: Add the header paragraph**

Insert this paragraph into the top comment block, immediately before the `const` line:

```basic
' RcConfig is now DEFAULTS + STRUCTURAL CONSTANTS. Behavioural knobs (movement,
' physics, static-light bake, render distance, standard ceiling, surface-light
' banding, actor height) are seeded from here into RcSettings, which a scene can
' mutate and bind per-object -- see RcSettings.bas. The enum-style constants
' (RC_SPAN_*, RC_DIAG_*, RC_SHADE_*, RC_HIT_*, RC_FALLOFF_*), RC_STRIP_W,
' RC_TEX_SIZE, RC_MAX_MARCH_ITERS, RC_ACTOR_POOL, RC_FLAT_FILL and RC_UNTAGGED
' are structural and stay fixed at runtime.
'
' RC_MAX_MARCH_ITERS caps ray-march steps at ~2x RcSettings.maxDist boundary
' crossings; a scene that raises maxDist past ~250 must raise this too (it is
' not an RcSettings knob).
```

- [ ] **Step 3: Sanity transpile**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: PASS (unchanged — nothing reads `RC_UNTAGGED` yet).

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcConfig.bas
git commit -m "refactor(raycaster): RcConfig = defaults + structural; add RC_UNTAGGED sentinel

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `RcCast` — cfg + `maxDist`

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcCast.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `raycasterSettings.test.ts` inside a new `describe`:

Append to `raycasterSettings.test.ts`, reusing the `loadPkg` helper from Task 1:

```ts
describe('RcCast honours cfg.maxDist', () => {
  // 40-wide corridor, wall at col 20. Ray east from (1.5,1.5): perp dist ~18.5.
  const tileAt = (_h: unknown, px: number, py: number) => {
    const c = Math.floor(px / 16), r = Math.floor(py / 16);
    if (r === 0 || r === 2 || c === 0) return 1;
    return c === 20 ? 1 : 0;
  };

  test('the wall is seen at default maxDist, gone below it, back above it', () => {
    const { RcWorld, TileMapSet, RcCast, RcSettings } = loadPkg(tileAt, [], 40, 3);
    const world = new RcWorld(new TileMapSet('c.stm'), 'walls');
    const cast = new RcCast();

    cast.cast(world, 1.5, 1.5, 1, 0);
    expect(cast.spancount()).toBeGreaterThan(0);       // wall at ~18.5 < default 32

    const near = new RcSettings();
    near.setmaxdist(10);
    cast.bindsettings(near);
    cast.cast(world, 1.5, 1.5, 1, 0);
    expect(cast.spancount()).toBe(0);                  // ~18.5 > 10

    near.setmaxdist(50);
    cast.cast(world, 1.5, 1.5, 1, 0);
    expect(cast.spancount()).toBeGreaterThan(0);       // back in range
  });
});
```

> Implementer: confirm the ray entry point and span-count accessor names with
> `grep -n "^function" src/lib/Basic4WebGL/defs/RcCast.bas` (expected `cast(wld,
> ox, oy, dx, dy)` and `spanCount()` → JS `.cast` / `.spancount`). If the DDA
> starts the player mid-cell such that col 20 sits at a different perp distance,
> nudge the wall column so the default case clearly hits and `maxdist(10)`
> clearly misses — the three-way transition is the assertion, the exact
> distance is not.

- [ ] **Step 2: Run it — fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: FAIL — `cast.bindsettings is not a function`.

- [ ] **Step 3: Add `cfg` field + constructor default + `bindSettings`**

In `src/lib/Basic4WebGL/defs/RcCast.bas`:

Add to the class-body `dim` list (with the other `dim m*` fields near the top):

```basic
dim cfg as RcSettings
```

Change the constructor from:

```basic
Constructor()
EndConstructor
```

to:

```basic
Constructor()
    self.cfg = new RcSettings()
EndConstructor

function bindSettings(s as RcSettings)
    self.cfg = s
endfunction
```

- [ ] **Step 4: Route `RC_MAX_DIST`**

In `RcCast.bas` there are two live reads (find with `grep -n "RcConfig.RC_MAX_DIST" src/lib/Basic4WebGL/defs/RcCast.bas` — currently lines ~160 and ~233, both `if self.mEntryDist > RcConfig.RC_MAX_DIST then`). Change both to:

```basic
        if self.mEntryDist > self.cfg.maxDist() then
```

Leave the comment on line ~220 (`' within RcConfig.RC_MAX_DIST.`) as prose or update it to `' within cfg.maxDist().` — cosmetic.

- [ ] **Step 5: Run test — passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: PASS.

- [ ] **Step 6: Regression — the raycaster suite still transpiles**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster --no-coverage`
Expected: all `Test Files … passed`. (Every raycaster test transpiles the whole package; a `dim … as RcSettings` typo would break them all.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcCast.bas tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts
git commit -m "feat(raycaster): RcCast.bindSettings — maxDist via cfg

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `RcWorld` — cfg + query-time `stdCeil` / `lightDefaultZ`

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcWorld.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `raycasterSettings.test.ts`, reusing `loadPkg`:

```ts
describe('RcWorld resolves stdCeil / lightDefaultZ via cfg', () => {
  // 4x4 room: border walls, open interior.
  const room4: TileAt = (_h, px, py) => {
    const c = Math.floor(px / 16), r = Math.floor(py / 16);
    return (r === 0 || r === 3 || c === 0 || c === 3) ? 1 : 0;
  };

  test('untagged ceiling follows the bound stdCeil; tagged cells do not', () => {
    const { RcWorld, TileMapSet, RcSettings } = loadPkg(room4, [
      { row: 1, col: 1, tag: 'ceil:0.5' },
    ], 4, 4);
    const world = new RcWorld(new TileMapSet('c.stm'), 'walls');

    expect(world.ceilheightat(2, 2)).toBe(1.0);   // untagged, default
    expect(world.ceilheightat(1, 1)).toBe(0.5);   // tagged

    const cfg = new RcSettings();
    cfg.setstdceil(3.0);
    world.bindsettings(cfg);
    expect(world.ceilheightat(2, 2)).toBe(3.0);   // untagged now 3.0
    expect(world.ceilheightat(1, 1)).toBe(0.5);   // tagged unchanged
    expect(world.ceilheightat(-1, 0)).toBe(3.0);  // out of bounds follows cfg
  });

  test('bare light height follows lightDefaultZ; light:<h> does not', () => {
    const { RcWorld, TileMapSet, RcSettings } = loadPkg(room4, [
      { row: 1, col: 1, tag: 'light' },
      { row: 2, col: 2, tag: 'light:1.8' },
    ], 4, 4);
    const world = new RcWorld(new TileMapSet('c.stm'), 'walls');

    expect(world.lightheightat(1, 1)).toBe(0.85);
    expect(world.lightheightat(2, 2)).toBe(1.8);

    const cfg = new RcSettings();
    cfg.setlightdefaultz(2.4);
    world.bindsettings(cfg);
    expect(world.lightheightat(1, 1)).toBe(2.4);
    expect(world.lightheightat(2, 2)).toBe(1.8);
  });
});
```

- [ ] **Step 2: Run it — fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: FAIL — `world.bindsettings is not a function` (or, after step 3 partial, wrong values).

- [ ] **Step 3: Add `cfg` field + constructor default + `bindSettings`**

In `src/lib/Basic4WebGL/defs/RcWorld.bas`:

Add to the class-body `dim` list (near `dim heightVarSeen`):

```basic
dim cfg as RcSettings
```

Change the constructor from:

```basic
Constructor(tm as tilemapset, wallsLayerName)
    self.build(tm, wallsLayerName)
EndConstructor
```

to:

```basic
Constructor(tm as tilemapset, wallsLayerName)
    self.cfg = new RcSettings()
    self.build(tm, wallsLayerName)
EndConstructor

function bindSettings(s as RcSettings)
    self.cfg = s
endfunction
```

- [ ] **Step 4: Sentinel-fill instead of default-fill**

In `build()`, the per-cell init loop currently has:

```basic
        array.push(self.ceilHArr, RcConfig.RC_STD_CEIL)
```
```basic
        array.push(self.lightHArr, RcConfig.RC_LIGHT_DEFAULT_Z)
```

Change both to:

```basic
        array.push(self.ceilHArr, RcConfig.RC_UNTAGGED)
```
```basic
        array.push(self.lightHArr, RcConfig.RC_UNTAGGED)
```

- [ ] **Step 5: Resolve at query time**

Change `ceilHeightAt`:

```basic
function ceilHeightAt(col, row)
    dim v
    if self.inBounds(col, row) = 0 then
        return self.cfg.stdCeil()
    endif
    v = self.ceilHArr(row * self.cols + col)
    if v = RcConfig.RC_UNTAGGED then
        return self.cfg.stdCeil()
    endif
    return v
endfunction
```

Change `lightHeightAt`:

```basic
function lightHeightAt(col, row)
    dim v
    if self.inBounds(col, row) = 0 then
        return self.cfg.lightDefaultZ()
    endif
    v = self.lightHArr(row * self.cols + col)
    if v = RcConfig.RC_UNTAGGED then
        return self.cfg.lightDefaultZ()
    endif
    return v
endfunction
```

Leave the `applyKv` `ceil:` variation test (`if math.val(v) <> RcConfig.RC_STD_CEIL then self.heightVarSeen = 1`) **as-is** — it compares against the compiled default deliberately (documented caveat). Add a one-line comment above it:

```basic
    ' NB: compared to the compiled default, not cfg.stdCeil() -- bindSettings
    ' comes after parse. A scene that sets stdCeil AND tags cells to match will
    ' trip heightVarSeen (a small render cost, never wrong). See RcSettings docs.
```

- [ ] **Step 6: Run test — passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`
Expected: PASS.

- [ ] **Step 7: Regression**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster --no-coverage`
Expected: all passed. (`raycasterSurfaceColor`, `raycasterDiagWorld`, `raycasterUpperWorld`, `raycasterFloorField*` all exercise `ceilHeightAt` on untagged cells — they must still see `1.0`.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcWorld.bas tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts
git commit -m "feat(raycaster): RcWorld.bindSettings — stdCeil/lightDefaultZ resolved per query

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `RcMover` — cfg + physics knobs

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcMover.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

- [ ] **Step 1: Write the failing test**

Append a new `describe`, reusing the `loadPkg` helper from Task 1 (`loadPkg(tileAt, markers, cols, rows)`, `tileAt` is `(h, px, py) => number` in pixel coords):

```ts
describe('RcMover honours cfg', () => {
  const border = (_h: unknown, px: number, py: number) => {
    const c = Math.floor(px / 16), r = Math.floor(py / 16);
    return (r === 0 || r === 7 || c === 0 || c === 7) ? 1 : 0;
  };

  test('gravity: a stronger cfg.gravity makes the same fall drop further', () => {
    const { RcWorld, TileMapSet, RcMover, RcSettings } = loadPkg(border, [], 8, 8);
    const w = new RcWorld(new TileMapSet('c.stm'), 'walls');

    // No facing needed: warp to a spot, then just integrate gravity with step().
    // Give the body a starting height above the floor so it is falling.
    const m1 = new RcMover(w, 4.5, 4.5, 0.3, 0.6);
    m1.warpto(4.5, 4.5, 0);
    m1.jump();                       // launch upward so several steps are airborne
    for (let i = 0; i < 4; i++) m1.step(16);
    const zDefault = m1.z();

    const m2 = new RcMover(w, 4.5, 4.5, 0.3, 0.6);
    const fast = new RcSettings();
    fast.setgravity(42);             // 3x
    m2.bindsettings(fast);
    m2.warpto(4.5, 4.5, 0);
    m2.jump();
    for (let i = 0; i < 4; i++) m2.step(16);
    expect(m2.z()).toBeLessThan(zDefault); // heavier gravity -> lower after 4 steps
  });

  test('stepUp gates blocked() against a ledge', () => {
    const { RcWorld, TileMapSet, RcMover, RcSettings } = loadPkg(
      border, [{ row: 2, col: 3, tag: 'floor:0.3' }], 8, 8,
    );
    const w = new RcWorld(new TileMapSet('c.stm'), 'walls');

    // Body on the z=0 floor at cell (col 4, row 4). Test the ledge cell (3,2).
    const m = new RcMover(w, 4.5, 4.5, 0.3, 0.6); // ctor sets pz = floorHeightAt(4,4) = 0
    expect(m.blocked(3, 2)).toBe(0);  // 0.3 - 0 <= default stepUp 0.35 -> steppable

    const low = new RcSettings();
    low.setstepup(0.2);
    m.bindsettings(low);
    expect(m.blocked(3, 2)).toBe(1);  // 0.3 > 0.2 -> now blocked
  });
});
```

> Implementer: `blocked(col, row)` and `jump()` / `step(dt)` / `z()` / `warpTo`
> are existing `RcMover` methods (grep to confirm). The `jump()` test assumes
> `jump()` then `step()` launches the body upward and gravity brings it down —
> if `jump` needs a grounded body first, the ctor already sets `grounded = 1`.
> If step 4's `zDefault` and `m2.z()` come out equal (both already landed),
> reduce the loop to 2 iterations so both are still airborne. The direction of
> the inequality is the assertion.

- [ ] **Step 2: Run — fails** (`m.bindsettings is not a function`).

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts --no-coverage`

- [ ] **Step 3: Add `cfg` field + constructor default + `bindSettings`**

In `src/lib/Basic4WebGL/defs/RcMover.bas`:

Add to the class-body `dim` list (near `dim wantJump`):

```basic
dim cfg as RcSettings
```

In the constructor, add as the first line (before `self.wld = w`):

```basic
    self.cfg = new RcSettings()
```

Add the method (anywhere at class scope, e.g. right after the constructor's `EndConstructor`):

```basic
function bindSettings(s as RcSettings)
    self.cfg = s
endfunction
```

(No forward — `RcMover` owns no `RcCast`.)

- [ ] **Step 4: Route the physics reads**

Make these exact replacements in `RcMover.bas` (confirm line numbers with `grep -n "RcConfig.RC_" src/lib/Basic4WebGL/defs/RcMover.bas` — ignore comment lines):

`look()`:
```basic
    self.pit = math.clamp(self.pit + dPitch, 0 - RcConfig.RC_MAX_PITCH, RcConfig.RC_MAX_PITCH)
```
→
```basic
    self.pit = math.clamp(self.pit + dPitch, 0 - self.cfg.maxPitch(), self.cfg.maxPitch())
```

`blocked()`:
```basic
    if self.wld.floorHeightAt(cx, cy) - self.pz > RcConfig.RC_STEP_UP then
```
→
```basic
    if self.wld.floorHeightAt(cx, cy) - self.pz > self.cfg.stepUp() then
```

`step()` dt clamp:
```basic
    if dsec > RcConfig.RC_MAX_STEP_DT then
        dsec = RcConfig.RC_MAX_STEP_DT
    endif
```
→
```basic
    if dsec > self.cfg.maxStepDt() then
        dsec = self.cfg.maxStepDt()
    endif
```

`step()` jump:
```basic
            self.vz = RcConfig.RC_JUMP_VEL
```
→
```basic
            self.vz = self.cfg.jumpVel()
```

`step()` step-up test:
```basic
        if groundH - self.pz <= RcConfig.RC_STEP_UP then
```
→
```basic
        if groundH - self.pz <= self.cfg.stepUp() then
```

`step()` gravity:
```basic
        self.vz = self.vz - RcConfig.RC_GRAVITY * dsec
```
→
```basic
        self.vz = self.vz - self.cfg.gravity() * dsec
```

Leave `RcConfig.RC_DIAG_*` in `step()` untouched (structural).

- [ ] **Step 5: Run test — passes.** Tune the behavioural assertions until green.

- [ ] **Step 6: Regression**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster --no-coverage`
Expected: all passed (`raycasterMover*` / demo-smoke tests step movers with default settings — trajectories must be unchanged).

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcMover.bas tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts
git commit -m "feat(raycaster): RcMover.bindSettings — gravity/jump/stepUp/maxStepDt/maxPitch via cfg

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `RcLights` — cfg + re-bake

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcLights.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('RcLights honours cfg via re-bake', () => {
  test('raising staticLightIntensity after bind lifts the baked peak', () => {
    const { RcWorld, TileMapSet, RcLights, RcSettings } = loadPkg(
      (_h: unknown, px: number, py: number) => {
        const c = Math.floor(px / 16), r = Math.floor(py / 16);
        return (r === 0 || r === 9 || c === 0 || c === 9) ? 1 : 0;
      },
      [{ row: 3, col: 3, tag: 'light' }],
      10, 10,
    );
    const w = new RcWorld(new TileMapSet('c.stm'), 'walls');
    const lights = new RcLights(w);
    lights.setambient(0.0);
    const peakDefault = lights.peaklevel();       // ambient 0 + baked static
    expect(peakDefault).toBeGreaterThan(0);

    const bright = new RcSettings();
    bright.setstaticlightintensity(2.0);          // vs default 0.9
    lights.bindsettings(bright);
    expect(lights.peaklevel()).toBeGreaterThan(peakDefault); // re-bake happened
  });

  test('re-bind does not duplicate static-light entries', () => {
    const { RcWorld, TileMapSet, RcLights, RcSettings } = loadPkg(
      (_h: unknown, px: number, py: number) => {
        const c = Math.floor(px / 16), r = Math.floor(py / 16);
        return (r === 0 || r === 9 || c === 0 || c === 9) ? 1 : 0;
      },
      [{ row: 3, col: 3, tag: 'light' }, { row: 6, col: 6, tag: 'light' }],
      10, 10,
    );
    const w = new RcWorld(new TileMapSet('c.stm'), 'walls');
    const lights = new RcLights(w);
    lights.setheightaware(1); // exercises the slxArr path
    const before = lights.staticlightcount();     // accessor already exists (2)
    lights.bindsettings(new RcSettings());
    lights.bindsettings(new RcSettings());
    expect(lights.staticlightcount()).toBe(before);
  });
});
```

> `staticLightCount()` / `peakLevel()` already exist in `RcLights.bas` (confirm with grep). If `staticLightCount` is named differently, use that name.

- [ ] **Step 2: Run — fails** (`lights.bindsettings is not a function`).

- [ ] **Step 3: Add `cfg` field + constructor default + `bindSettings` (with re-bake + forward)**

In `src/lib/Basic4WebGL/defs/RcLights.bas`:

Add to the class-body `dim` list (near `dim peakAdd`):

```basic
dim cfg as RcSettings
```

In the constructor, add as the first line (before `self.wld = w`):

```basic
    self.cfg = new RcSettings()
```

The constructor already ends with `self.bakeStatic()` then `EndConstructor`. Add the method after `EndConstructor`:

```basic
function bindSettings(s as RcSettings)
    self.cfg = s
    self.rc.bindSettings(s)
    self.bakeStatic()
endfunction
```

- [ ] **Step 4: Make `bakeStatic()` re-runnable — clear the parallel arrays first**

At the very top of `bakeStatic()` (after its `dim` lines, before the `for lr` loop), add:

```basic
    array.clear(self.slxArr)
    array.clear(self.slyArr)
    array.clear(self.slzArr)
    array.clear(self.sliArr)
    array.clear(self.slrArr)
    array.clear(self.slFalloffArr)
```

(`staticArr` is fully overwritten at the end of `bakeStatic` from the `dynArr` scratch, and `dynArr` is zeroed there too, so those need no clear. Only the `array.push`-ed parallel arrays would accumulate on a re-run.)

- [ ] **Step 5: Route the light knobs**

`bakeStatic()` splat + pushes (confirm with `grep -n "RcConfig.RC_" src/lib/Basic4WebGL/defs/RcLights.bas`):

```basic
                self.splat(lc + 0.5, lr + 0.5, RcConfig.RC_STATIC_INTENSITY, RcConfig.RC_LIGHT_RANGE, RcConfig.RC_FALLOFF_LINEAR)
```
→
```basic
                self.splat(lc + 0.5, lr + 0.5, self.cfg.staticLightIntensity(), self.cfg.staticLightRange(), RcConfig.RC_FALLOFF_LINEAR)
```

```basic
                array.push(self.sliArr, RcConfig.RC_STATIC_INTENSITY)
                array.push(self.slrArr, RcConfig.RC_LIGHT_RANGE)
```
→
```basic
                array.push(self.sliArr, self.cfg.staticLightIntensity())
                array.push(self.slrArr, self.cfg.staticLightRange())
```

Both `RC_LIGHT_CAP` guards (in `update()` and in `sampleAtZ()` — `if count < RcConfig.RC_LIGHT_CAP then`):

```basic
            if count < RcConfig.RC_LIGHT_CAP then
```
→
```basic
            if count < self.cfg.lightCap() then
```

> Naming note: `RcLights` already has a per-baked-light accessor
> `staticLightIntensity(i)` / `staticLightRange(i)` (indexed, from the
> height-aware POC). `self.cfg.staticLightIntensity()` / `.staticLightRange()`
> (no arg, on the `RcSettings`) is a different call — the default those baked
> values are recorded at. Don't confuse `self.cfg.X()` with `self.X(i)`.

Leave `self.ambient = RcConfig.RC_AMBIENT` in the constructor **as-is** (ambient is not an `RcSettings` knob — `setAmbient()` owns it). Leave `RcConfig.RC_FALLOFF_LINEAR` everywhere (structural).

- [ ] **Step 6: Run test — passes.**

- [ ] **Step 7: Regression**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster --no-coverage`
Expected: all passed (`raycasterLights*`, `raycasterSurfaceLightGradient`, demo-smoke all build `RcLights` with defaults).

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcLights.bas tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts
git commit -m "feat(raycaster): RcLights.bindSettings — re-bake with cfg light knobs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: `RcRender` — cfg + render knobs

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('RcRender honours cfg', () => {
  test('bindSettings forwards to the owned RcCast (far wall drops with maxDist)', () => {
    // corridor: wall at col 30; player col 1 facing east.
    const { RcWorld, TileMapSet, RcRender, RcMover, RcSettings } = loadPkg(
      (_h: unknown, px: number, py: number) => {
        const c = Math.floor(px / 16), r = Math.floor(py / 16);
        if (r === 0 || r === 3 || c === 0 || c === 31) return 1;
        return c === 30 ? 1 : 0;
      },
      [], 32, 4,
    );
    const w = new RcWorld(new TileMapSet('c.stm'), 'walls');
    const ren = new RcRender(w);
    const me = new RcMover(w, 1.5, 1.5, 0.3, 0.6);
    me.warpto(1.5, 1.5, 0);
    ren.bindcamera(me);
    ren.renderframe();
    const farDefault = ren.surfacecount(); // wall visible at default maxDist 32? col30 -> d~28.5 yes

    const near = new RcSettings();
    near.setmaxdist(10);
    ren.bindsettings(near);
    ren.renderframe();
    // with the wall past maxDist the column now has no wall span; the
    // renderer draws floor+ceiling to the horizon instead. surfacecount
    // differs from the wall-hit frame.
    expect(ren.surfacecount()).not.toBe(farDefault);
  });

  test('eyeZ changes the horizon (projectY of h=0 at a fixed distance)', () => {
    const { RcWorld, TileMapSet, RcRender, RcSettings } = loadPkg(
      (_h: unknown, px: number, py: number) => {
        const c = Math.floor(px / 16), r = Math.floor(py / 16);
        return (r === 0 || r === 9 || c === 0 || c === 9) ? 1 : 0;
      }, [], 10, 10,
    );
    const w = new RcWorld(new TileMapSet('c.stm'), 'walls');
    const ren = new RcRender(w);
    const y0 = ren.projecty(0, 4);
    const tall = new RcSettings();
    tall.seteyez(1.5);
    ren.bindsettings(tall);
    expect(ren.projecty(0, 4)).toBeGreaterThan(y0); // eye higher -> floor point lower on screen
  });
});
```

> `surfaceCount()` / `projectY(h, d)` are existing `RcRender` methods (grep to confirm names). `projectY` is the cleanest deterministic probe for `eyeZ`.

- [ ] **Step 2: Run — fails** (`ren.bindsettings is not a function`).

- [ ] **Step 3: Add `cfg` field + constructor default + `bindSettings` (forward to `self.rc`)**

In `src/lib/Basic4WebGL/defs/RcRender.bas`:

Add to the class-body `dim` list:

```basic
dim cfg as RcSettings
```

In the constructor, add as the first line (before `self.wld = w`):

```basic
    self.cfg = new RcSettings()
```

Add the method next to `bindLights` / `bindCamera`:

```basic
function bindSettings(s as RcSettings)
    self.cfg = s
    self.rc.bindSettings(s)
endfunction
```

- [ ] **Step 4: Route `eyeZ`**

Replace every live `RcConfig.RC_EYE_Z` (6 sites — `grep -n "RcConfig.RC_EYE_Z" src/lib/Basic4WebGL/defs/RcRender.bas`, skip comments) with `self.cfg.eyeZ()`. The sites:
- `emitFloorField` — the `drawing.drawPlaneField(…, RcConfig.RC_EYE_Z, …)` arg
- `projectY` — `(self.camZ + RcConfig.RC_EYE_Z - h)`
- `depthAtScreenY` — `k = (self.camZ + RcConfig.RC_EYE_Z - hh) * self.viewH`
- `drawWallStrip` — `eyeZ = self.camZ + RcConfig.RC_EYE_Z`
- the two step-riser cull checks — `if self.camZ + RcConfig.RC_EYE_Z >= runFloorH` and `if self.camZ + RcConfig.RC_EYE_Z <= runCeilH`

- [ ] **Step 5: Route `maxPitch`**

`setCamera()`:
```basic
    self.camPitch = math.clamp(pitch, 0 - RcConfig.RC_MAX_PITCH, RcConfig.RC_MAX_PITCH)
```
→
```basic
    self.camPitch = math.clamp(pitch, 0 - self.cfg.maxPitch(), self.cfg.maxPitch())
```

- [ ] **Step 6: Route `stdCeil`**

Replace every live `RcConfig.RC_STD_CEIL` (`grep -n "RcConfig.RC_STD_CEIL" src/lib/Basic4WebGL/defs/RcRender.bas`, skip comments) with `self.cfg.stdCeil()`. Sites:
- `sampleAtZ(wx, wy, RcConfig.RC_STD_CEIL - 0.05)` → `self.cfg.stdCeil() - 0.05`
- `if self.wld.ceilHeightAt(camCol, camRow) = RcConfig.RC_STD_CEIL then` → `= self.cfg.stdCeil()`
- the three `scH <> RcConfig.RC_STD_CEIL` skip-guard clauses → `scH <> self.cfg.stdCeil()`

- [ ] **Step 7: Route `maxDist`**

Replace every live `RcConfig.RC_MAX_DIST` in `RcRender.bas` with `self.cfg.maxDist()` (`grep -n "RcConfig.RC_MAX_DIST"`, skip comments). Sites: the `depthArr` init push, the `depthAtScreenY` horizon return + `d > … then d = …` clamp, the per-column `self.depthArr(col) = …` reset, and the two `hitWall = 0` far-surface `drawSurface(… , RcConfig.RC_MAX_DIST, …)` + `floorBandClean/ceilBandClean(0, RcConfig.RC_MAX_DIST, …)` calls. `self.cfg` is set to defaults in the constructor before the `depthArr` push loop, so the init read is safe.

- [ ] **Step 8: Route `surfLightStep` / `surfSegMax`**

In `renderFrame()`:
```basic
        self.surfSegN = math.ceil((self.boundLights.peakLevel() - self.boundLights.ambientLevel()) / RcConfig.RC_SURF_LIGHT_STEP)
```
→
```basic
        self.surfSegN = math.ceil((self.boundLights.peakLevel() - self.boundLights.ambientLevel()) / self.cfg.surfLightStep())
```
```basic
        if self.surfSegN > RcConfig.RC_SURF_SEG_MAX then
            self.surfSegN = RcConfig.RC_SURF_SEG_MAX
        endif
```
→
```basic
        if self.surfSegN > self.cfg.surfSegMax() then
            self.surfSegN = self.cfg.surfSegMax()
        endif
```

- [ ] **Step 9: Route `actorHeight`**

`drawActors()`:
```basic
        headY = self.projectY(a.z() + RcConfig.RC_ACTOR_HEIGHT, depth)
```
→
```basic
        headY = self.projectY(a.z() + self.cfg.actorHeight(), depth)
```

- [ ] **Step 10: Run test — passes.**

- [ ] **Step 11: Regression — this is the big one**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster tests/components/Runner/drawing.test.ts --no-coverage`
Expected: all passed. `raycasterFloorField*`, `raycasterFloorFieldRiser`, `raycasterSurfaceColor*`, `raycasterWindowOcclusion`, `raycasterDemoSmoke`, `raycasterBench` all render frames with default settings — every `projectY`, every ceiling-step guard, every `eyeZ` must produce identical output. If any fail, a `self.cfg.X()` was substituted where the value differs from the compiled default — recheck the `RcSettings` constructor seeds against `RcConfig`.

- [ ] **Step 12: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts
git commit -m "feat(raycaster): RcRender.bindSettings — eyeZ/maxPitch/stdCeil/maxDist/surf*/actorHeight via cfg

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Docs

**Files:**
- Modify: `src/docs/guides/raycaster-library.md`
- Modify: `docs/raycaster/api-reference.md`
- Modify: `src/docs/language-guide/packages.md`

- [ ] **Step 1: "Per-scene tuning" section in the guide**

In `src/docs/guides/raycaster-library.md`, add a `## Per-scene tuning` section
immediately after the `RcWorld` setup section (search for where `new RcWorld`
is first shown). Match the guide's existing prose voice. Content:

````markdown
## Per-scene tuning

`RcConfig` holds the raycaster's default numbers. `RcSettings` lets one scene
override them without affecting another — a cramped indoor area and an open
exterior can have different movement feel, render distance and ceiling height
in the same project.

Build one, set the knobs you care about, and `bindSettings` it to every
raycaster object **right after you create that object** — before the first
`step` / `renderFrame`:

```bas
self.cfg = new RcSettings()
self.cfg.setStdCeil(3.0)      ' every untagged cell is 3 units tall
self.cfg.setMoveSpeed(3.4)

self.wld = new RcWorld(self.tm, "walls")
self.wld.bindSettings(self.cfg)
self.ren = new RcRender(self.wld)
self.ren.bindSettings(self.cfg)
self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
self.me.bindSettings(self.cfg)
self.lights = new RcLights(self.wld)
self.lights.bindSettings(self.cfg)
```

Bind the **same** `RcSettings` object to all of them — `RcWorld` and `RcRender`
both consult `stdCeil` and must agree. An object you never bind uses the plain
defaults, and mixing bound-with-defaults and unbound is fine, but two *different*
tuned objects on the same scene will disagree.

Then in `onupdate`, read the movement knobs off it:

```bas
self.me.move(controls.readFwd() * self.cfg.moveSpeed(), controls.readStrafe() * self.cfg.moveSpeed())
```

| getter / setter | effect | default |
|---|---|---|
| `moveSpeed` / `setMoveSpeed` | forward/strafe speed (cells/sec) — your `onupdate` applies it | `2.6` |
| `turnSpeed` / `setTurnSpeed` | yaw speed | `2.4` |
| `lookSpeed` / `setLookSpeed` | look up/down speed | `400` |
| `gravity` / `setGravity` | downward acceleration | `14` |
| `jumpVel` / `setJumpVel` | jump launch speed | `5` |
| `stepUp` / `setStepUp` | tallest ledge you can walk straight onto | `0.35` |
| `maxStepDt` / `setMaxStepDt` | movement sub-step cap (collision safety — leave it) | `0.1` |
| `maxPitch` / `setMaxPitch` | how far the view can tilt up/down | `220` |
| `eyeZ` / `setEyeZ` | camera height above the floor | `0.5` |
| `maxDist` / `setMaxDist` | how far rays look for walls | `32` |
| `staticLightRange` / `setStaticLightRange` | radius (cells) of a `light:` marker's pool | `6` |
| `lightCap` / `setLightCap` | max dynamic point lights at once | `4` |
| `staticLightIntensity` / `setStaticLightIntensity` | brightness of a `light:` marker | `0.9` |
| `lightDefaultZ` / `setLightDefaultZ` | height of a bare `light` marker | `0.85` |
| `stdCeil` / `setStdCeil` | ceiling height of every cell you didn't tag `ceil:` | `1.0` |
| `surfLightStep` / `setSurfLightStep` | floor/ceiling light-banding step | `0.12` |
| `surfSegMax` / `setSurfSegMax` | cap on those bands | `6` |
| `actorHeight` / `setActorHeight` | drawn height of an `RcActors` billboard | `1.0` |

**`setStdCeil` is the easy way to make a whole level tall** — no need to tag
every cell `ceil:` (see the ceiling-height notes above). One caveat: if you
*also* tag cells `ceil:3` to match a `stdCeil` of 3, the renderer still counts
those as height variation and takes a slightly slower path that frame — never
wrong, just leave them untagged.

**`maxDist`** controls wall render distance only; the floor and ceiling always
fill to the horizon. Beyond ~250 you also need to raise `RC_MAX_MARCH_ITERS`
in `RcConfig.bas` (it is not an `RcSettings` knob).
````

- [ ] **Step 2: Internal agent ref**

In `docs/raycaster/api-reference.md`, add an `RcSettings` row to the module
table, and a short note near it:

> `bindSettings(s)` on `RcWorld` / `RcCast` / `RcMover` / `RcRender` /
> `RcLights`; `RcRender` & `RcLights` forward to the `RcCast` they own.
> `RcLights.bindSettings` re-runs `bakeStatic()` (idempotent — `bakeStatic`
> clears its `sl*Arr` first). `RcWorld` resolves `stdCeil` / `lightDefaultZ`
> at query time via the `RC_UNTAGGED` (999999) sentinel — no re-init needed.
> `moveSpeed`/`turnSpeed`/`lookSpeed` are scene-consumed only.

- [ ] **Step 3: Packages table**

In `src/docs/language-guide/packages.md`, in the `softRaycaster` module table,
add a row (keep it in dependency order, right after `RcConfig`):

```markdown
| `RcSettings` | Per-scene overrides for the `RcConfig` defaults |
```

- [ ] **Step 4: Build check**

Run: `npx vite build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/docs/guides/raycaster-library.md docs/raycaster/api-reference.md src/docs/language-guide/packages.md
git commit -m "docs(raycaster): RcSettings per-scene tuning guide + package tables

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Roadmap + full-suite regression

**Files:**
- Modify: `docs/language/library-roadmap.md`
- (maybe) Modify: `docs/roadmap.md`

- [ ] **Step 1: Roadmap note**

In `docs/language/library-roadmap.md`, find the raycaster section. If a "config is immutable / no per-scene tuning" limitation is tracked, mark it resolved (date 2026-09-09, `RcSettings`). Otherwise add a one-paragraph "Shipped 2026-09-09 — per-scene `RcSettings`" note listing the 18 knobs and the `bindSettings` fan-out. Check `docs/roadmap.md` for a raycaster milestone bullet that needs the same one-liner.

- [ ] **Step 2: Full suite**

Run: `npx vitest run`
Expected: `Test Files … passed` with **0 failed** (skipped is fine; the one `onTaskUpdate` timeout line is benign). Baseline before this plan was 214 files / ~2133 tests passing + 6/8 skipped; this plan adds `raycasterSettings.test.ts` (one more file) and its tests.

- [ ] **Step 3: Build**

Run: `npx vite build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/language/library-roadmap.md docs/roadmap.md
git commit -m "docs(roadmap): per-scene RcSettings shipped

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Final review pass**

Dispatch a code-review subagent (or review inline) against the spec
`docs/superpowers/specs/2026-09-09-raycaster-per-scene-settings-design.md`:
every one of the 18 knobs is seeded from the right `RcConfig` constant and read
via `self.cfg.<knob>()` at its documented site; no structural constant was
accidentally routed; every unbound path is byte-identical (the full suite green
is the proof); `bakeStatic()` re-run is idempotent.

---

## Self-review notes (already applied)

- **Spec coverage:** all 18 knobs (Task 1 table + Tasks 3/5/6/7 routing), both ordering wrinkles (Task 4 sentinel, Task 6 re-bake + array-clear), both caveats documented (Task 4 Step 5 comment + Task 8 Step 1 guide), package registration (Task 1), tests (Tasks 1/3/4/5/6/7), docs in the guide not a new app page — the raycaster has no per-module app pages (Task 8), roadmap (Task 9). Spec's maxDist routing: RcCast is the source of truth (Task 3); Task 7 Step 7 also routes RcRender's `RC_MAX_DIST` sentinels/clamps through `cfg` for consistency so a raised `maxDist` doesn't leave the floor depth-clamp at 32.
- **`moveSpeed`/`turnSpeed`/`lookSpeed`:** held by `RcSettings`, never read by the library — Task 1 only. Scenes opt in by writing `self.cfg.moveSpeed()` in their own `onupdate`; not something this plan can test beyond the getter/setter.
- **Naming:** getters are the bare camelCase knob name, setters `set` + PascalCase, consistently across Task 1 (definition) and Tasks 3–7 (call sites). Field `dim` names inside `RcSettings` are private and differ (`mvSpeed` etc.) — deliberate, they never appear outside that file.
- **`RcActors`/`RcActor`:** untouched — they read only `RC_ACTOR_POOL` (structural). `actorHeight` is consumed in `RcRender.drawActors` (Task 7 Step 9), not in `RcActors`.
