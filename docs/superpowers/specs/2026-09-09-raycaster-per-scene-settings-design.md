# Raycaster per-scene settings (`RcSettings`) — design

**Status:** approved for planning (2026-09-09)

## Problem

`RcConfig` is a `const … endconst` block. Every raycaster tunable —
movement speed, gravity, jump, step height, eye height, render distance,
static-light bake defaults, the standard ceiling height — is a compile-time
constant read directly as `RcConfig.RC_MOVE_SPEED` etc. across the library.
A scene cannot change any of them. Two scenes in one project (a tight indoor
area and an open exterior, say) are stuck with one movement feel and one
render distance.

## Goal

A scene builds a settings object, tweaks the knobs it cares about, and binds
it to the Rc* objects it constructs. Everything not bound keeps today's
behaviour exactly.

```basic
self.cfg = new RcSettings()
self.cfg.setStdCeil(3.0)
self.cfg.setMoveSpeed(3.4)
self.cfg.setMaxDist(48)

self.wld = new RcWorld(self.tm, "walls")
self.wld.bindSettings(self.cfg)
self.ren = new RcRender(self.wld)
self.ren.bindSettings(self.cfg)
self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
self.me.bindSettings(self.cfg)
self.lights = new RcLights(self.wld)
self.lights.bindSettings(self.cfg)
```

Non-goals:

- Not touching the shipped demos. The 11 `raycaster-p*` demos and
  `survival-slice` construct Rc* objects with no `bindSettings` call and must
  render byte-identically. A demo is migrated only if it actually wants a
  non-default value (none do today).
- Not replacing the existing feature setters (`setFlatFill`, `setFloorField`,
  `setFloorTexture`, `setWallTexture`, `setGradientShading`, `setFov`,
  `setAmbient`, per-light `setLightIntensity/Radius/Falloff`). Those already
  follow the default-plus-setter pattern correctly and stay as they are.
- No validation / clamping inside `RcSettings`. It is a dumb value object.
  Sensible ranges are documented, not enforced.

## Architecture

### `RcConfig` — unchanged file, clarified role

Stays a `const` block. Its role is now explicitly **(a) the default value for
every `RcSettings` field and (b) the structural constants that must never
change at runtime**:

- Span kinds `RC_SPAN_WALL` / `RC_SPAN_FLOORSTEP` / `RC_SPAN_CEILSTEP` /
  `RC_SPAN_SIDE_DIAG`
- Diagonal codes `RC_DIAG_NW/NE/SE/SW`
- Shade codes `RC_SHADE_FLOOR_TOP/PIT_FLOOR/CEIL_UNDER/SOFFIT`
- Hit codes `RC_HIT_NONE/WALL/ACTOR`
- Falloff codes `RC_FALLOFF_LINEAR/QUADRATIC`
- `RC_STRIP_W` (column width — a renderer invariant, not a quality knob)
- `RC_TEX_SIZE` (source texture sampling width)
- `RC_MAX_MARCH_ITERS` (safety cap; see the coupling note under `maxDist`)
- `RC_ACTOR_POOL` (fixed pool allocation size in `RcActors`)
- `RC_FLAT_FILL` (already has `RcRender.setFlatFill()`)

The comment header gains one paragraph stating this split and pointing at
`RcSettings`.

`RC_HITSCAN_RANGE` is dead (no reference anywhere in the library). Leave the
constant in place for now; it is out of scope here.

### `RcSettings` — new hand-written module

`src/lib/Basic4WebGL/defs/RcSettings.bas`. Hand-written (the `Rc*` set is not
descriptor-generated — see CLAUDE.md). A plain `Class` value object:

- One `dim` field per knob.
- `Constructor()` seeds every field from its `RcConfig.RC_*` default.
- One getter (`moveSpeed()`) and one setter (`setMoveSpeed(v)`) per field.
  camelCase, `RC_` prefix dropped. Setters return nothing (no chaining — the
  existing Rc setters don't chain).

#### The 18 knobs

| `RcSettings` field | default (`RcConfig`) | read by | read site |
|---|---|---|---|
| `moveSpeed` | `RC_MOVE_SPEED` 2.6 | *scene only* | scene multiplies `controls.readFwd()` |
| `turnSpeed` | `RC_TURN_SPEED` 2.4 | *scene only* | scene multiplies `controls.readTurn()` |
| `lookSpeed` | `RC_LOOK_SPEED` 400.0 | *scene only* | scene multiplies `controls.readLook()` |
| `gravity` | `RC_GRAVITY` 14.0 | `RcMover` | `step()` vz integration |
| `jumpVel` | `RC_JUMP_VEL` 5.0 | `RcMover` | `step()` jump impulse |
| `stepUp` | `RC_STEP_UP` 0.35 | `RcMover` | `step()` / collision step-up test (2 sites) |
| `maxStepDt` | `RC_MAX_STEP_DT` 0.1 | `RcMover` | `step()` dt clamp (2 sites) |
| `maxPitch` | `RC_MAX_PITCH` 220 | `RcMover`, `RcRender` | `RcMover.look()` clamp, `RcRender.setCamera()` clamp |
| `eyeZ` | `RC_EYE_Z` 0.5 | `RcRender` | `projectY`, `depthAtScreenY`, `drawWallStrip` eye calc, both step-riser cull checks, `drawPlaneField` arg (6 sites) |
| `maxDist` | `RC_MAX_DIST` 32 | `RcCast`, `RcRender` | `RcCast` march cutoff (2), `RcRender` depth sentinel + `depthAtScreenY` clamp + far-surface draws (several) |
| `staticLightRange` | `RC_LIGHT_RANGE` 6 | `RcLights` | `bakeStatic()` splat radius + `slrArr` push |
| `lightCap` | `RC_LIGHT_CAP` 4 | `RcLights` | `update()` and `peakLevel()` dynamic-light count guard (2 sites) |
| `staticLightIntensity` | `RC_STATIC_INTENSITY` 0.9 | `RcLights` | `bakeStatic()` splat + `sliArr` push (2 sites) |
| `lightDefaultZ` | `RC_LIGHT_DEFAULT_Z` 0.85 | `RcWorld` | `lightHeightAt()` fallback for a bare `light` marker |
| `stdCeil` | `RC_STD_CEIL` 1.0 | `RcWorld`, `RcRender` | `RcWorld.ceilHeightAt()` fallback + `applyKv` variation test; `RcRender` ~6 "is this the standard ceiling" comparisons + `sampleAtZ` height |
| `surfLightStep` | `RC_SURF_LIGHT_STEP` 0.12 | `RcRender` | `renderFrame` sub-band count |
| `surfSegMax` | `RC_SURF_SEG_MAX` 6 | `RcRender` | `renderFrame` sub-band cap (2 sites) |
| `actorHeight` | `RC_ACTOR_HEIGHT` 1.0 | `RcRender` | `drawActors()` billboard top projection |

Classes that read at least one knob and therefore get `bindSettings`:
**`RcWorld`, `RcCast`, `RcMover`, `RcRender`, `RcLights`**.
`RcActors` / `RcActor` read only `RC_ACTOR_POOL` (structural) — **no
`bindSettings`**.

`moveSpeed` / `turnSpeed` / `lookSpeed` are held for the scene's convenience
(one home for every movement knob) even though the library never reads them —
a scene writes `self.me.move(fwd * self.cfg.moveSpeed(), …)`.

### Wiring each class

Each of the five classes:

1. `dim cfg as RcSettings` field.
2. Constructor: `self.cfg = new RcSettings()` — always a valid defaults
   object, so an unbound class behaves exactly as today.
3. `function bindSettings(s as RcSettings)` — `self.cfg = s`, then any
   re-init (below), then for the two classes that own an `RcCast`
   (`RcRender`, `RcLights`) also `self.rc.bindSettings(s)`. `RcMover` owns no
   `RcCast` (its collision reads `self.wld` directly) — no forward.
4. Every `RcConfig.RC_<knob>` in a hot path → `self.cfg.<knob>()`.
   Structural `RcConfig.RC_*` references are left untouched.

### The two construction-order wrinkles

**`RcLights` bakes in its constructor.** `Constructor(w)` calls
`self.bakeStatic()`, which reads `staticLightIntensity`, `staticLightRange`
and (via `wld.lightHeightAt`) `lightDefaultZ`. A later `bindSettings` would
be too late. Fix: `RcLights.bindSettings()` re-runs `self.bakeStatic()` after
swapping `self.cfg`. `bakeStatic()` is one grid pass — the file's own comment
calls it "negligible". `bindSettings` must be called before the first
`update()` / `sampleAt*()` of the frame, same as `setAmbient` today.

**`RcWorld` pre-fills per-cell defaults in its constructor.** Today
`Constructor` pushes `RC_STD_CEIL` into `ceilHArr` and `RC_LIGHT_DEFAULT_Z`
into `lightHArr` for every cell, then `applyKv` overwrites tagged cells.
Binding a different `stdCeil` afterwards would leave those pre-filled cells
stale. Fix: **resolve the default at query time instead of pre-filling.**

- Constructor pushes a sentinel `RC_UNTAGGED = -999999` (new structural
  constant in `RcConfig`) into `ceilHArr` / `lightHArr` for every cell.
- `applyKv` for `ceil:` / `light:` writes the real value as now.
- `ceilHeightAt(col,row)`: out of bounds → `self.cfg.stdCeil()`; in bounds
  and cell holds `RC_UNTAGGED` → `self.cfg.stdCeil()`; else the stored value.
- `lightHeightAt(col,row)`: same shape with `self.cfg.lightDefaultZ()`.
- `floorHeightAt` is unaffected (its default is `0`, a real value, not a
  config knob).

This removes the ordering problem for `RcWorld` entirely — `bindSettings`
just swaps the ref.

**`heightVarSeen` caveat (accepted, documented).** `applyKv` sets
`heightVarSeen = 1` when a `ceil:` value differs from `RcConfig.RC_STD_CEIL`
(the compiled default), computed at parse time before any `bindSettings`. A
scene that sets `stdCeil` to 3.0 and also tags cells `ceil:3` will trip
`heightVarSeen` even though those cells now match the scene default. Effect:
`RcRender` skips its flat single-height floor/ceiling fast-fill and takes the
per-column path — a small render cost, never a visual error. Not worth
deferring the parse; documented in `RcWorld.bas` and the guide.

**`maxDist` / `RC_MAX_MARCH_ITERS` coupling (documented).** `RC_MAX_MARCH_ITERS`
(512) stays a source constant. It caps ray-march steps at roughly
`2 × maxDist` boundary crossings, so a `maxDist` beyond ~250 can clip long
rays. Documented in `RcConfig.bas` and the `maxDist` API entry; a scene that
needs both a huge draw distance and correctness raises the source constant.

### Package registration

- `src/constants/packageModules.ts`: `import RcSettings from
  '../lib/Basic4WebGL/defs/RcSettings.bas?raw';` and entry
  `rcsettings: RcSettings` (lowercase key).
- `src/constants/firstPartyPackages.ts`: `softraycaster.moduleNames` becomes
  `['rcconfig', 'rcsettings', 'rcworld', 'rccast', 'rcmover', 'rclights',
  'rcactor', 'rcactors', 'rcrender']` — `rcsettings` right after `rcconfig`
  (it depends only on `RcConfig`).

## Testing

New: `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts`

Harness: the existing `Object.entries(packageModules)` lib + `compiler.transpile`
+ `new Function` factory pattern used by `raycasterSurfaceColor.test.ts` /
`raycasterFloorFieldRiser.test.ts`.

1. **Defaults unchanged.** `new RcSettings()` — every getter returns the
   matching `RcConfig` value. (Guards against a default drifting.)
2. **Unbound behaviour is identical.** Build an `RcMover` with no
   `bindSettings`, `step()` a fixed number of frames off a ledge; record the
   fall. Same scene with an explicitly-bound default `RcSettings`: identical
   trajectory to the last decimal.
3. **`gravity` reaches `RcMover`.** Bind `setGravity(40)`; the same fall is
   measurably faster than the default within N frames.
4. **`stepUp` reaches `RcMover`.** A 0.3-tall ledge is climbable at default
   `stepUp` 0.35, not climbable after `setStepUp(0.2)`.
5. **`stdCeil` reaches `RcWorld`.** `wld.ceilHeightAt(untagged)` returns 1.0
   unbound; returns 3.0 after binding `setStdCeil(3.0)`; a cell tagged
   `ceil:0.5` still returns 0.5 either way.
6. **`lightDefaultZ` reaches `RcWorld`.** `wld.lightHeightAt` of a bare
   `light` cell tracks the bound value; a `light:1.8` cell stays 1.8.
7. **`staticLightIntensity` reaches `RcLights` via re-bake.** Peak baked
   level at a `light:` cell rises after `bindSettings` with a higher
   `staticLightIntensity` (proves the constructor bake was re-run).
8. **`maxDist` reaches `RcCast`.** A wall at distance 20 is in the span list
   at default `maxDist` 32; absent after `setMaxDist(12)`.
9. **`RcCast` forwarding.** `RcRender.bindSettings(cfg)` then read
   `self.rc`'s effective `maxDist` behaviour (a far wall drops out of the
   render's span consumption) — proves the forward to the owned `RcCast`.

Regression: full `npx vitest run` green (the multi-plane floor field,
riser, surface-colour and demo-smoke suites all transpile the whole library
and must be unaffected — every structural `RcConfig.*` reference is left
alone and every demo path is unbound).

Cypress `demos.cy.ts` / `tutorials.cy.ts` are unaffected (no demo binds
settings) — not run for this change.

## Docs

The raycaster has **no per-module API pages** in the app (no
`src/docs/api-reference/rc*.md`, nothing in `src/docs/manifest.ts`) — it is
documented entirely through the "Building a Raycaster" guide. `RcSettings`
follows that: no new app page, no manifest change.

1. **`src/docs/guides/raycaster-library.md`** — new "Per-scene tuning"
   section after the `RcWorld` setup section: what `RcSettings` is, the
   bind-early rule, the **full 18-knob table** (name / effect / default /
   which object consumes it), the `stdCeil` shortcut for "tall everywhere"
   (ties back to the earlier `ceil:` guidance), the `heightVarSeen` and
   `maxDist` caveats, and a worked "tight room vs open yard" two-scene example.
2. **`docs/raycaster/api-reference.md`** (internal agent ref) — `RcSettings`
   row in the module table; note the `bindSettings` fan-out and the two
   re-init points.
3. **`src/docs/language-guide/packages.md`** — add `RcSettings` to the
   `softRaycaster` module table.
4. **Release notes** + version bump — only when the user asks to push
   (per CLAUDE.md).

## Roadmap

- `docs/language/library-roadmap.md`: if a "config is immutable / no per-scene
  tuning" limitation is tracked, mark it resolved with this design; otherwise
  add a short "shipped" note under the raycaster section.
- `docs/roadmap.md` (public summary): one line if the raycaster milestone
  section lists tuning.

## File-by-file change summary

| File | Change |
|---|---|
| `src/lib/Basic4WebGL/defs/RcConfig.bas` | header paragraph on the split; add `RC_UNTAGGED = -999999`; note the `maxDist` coupling |
| `src/lib/Basic4WebGL/defs/RcSettings.bas` | **new** — value object, 18 fields, ctor from `RcConfig`, get/set per field |
| `src/lib/Basic4WebGL/defs/RcWorld.bas` | `cfg` field + `bindSettings`; sentinel-fill `ceilHArr`/`lightHArr`; `ceilHeightAt`/`lightHeightAt` resolve via `cfg` |
| `src/lib/Basic4WebGL/defs/RcCast.bas` | `cfg` field + `bindSettings`; `RC_MAX_DIST` → `cfg.maxDist()` (2 sites) |
| `src/lib/Basic4WebGL/defs/RcMover.bas` | `cfg` field + `bindSettings` (no forward — owns no `RcCast`); `gravity`/`jumpVel`/`stepUp`/`maxStepDt`/`maxPitch` via `cfg` |
| `src/lib/Basic4WebGL/defs/RcLights.bas` | `cfg` field + `bindSettings` (re-bake + forward to `self.rc`); `staticLightIntensity`/`staticLightRange`/`lightCap` via `cfg` |
| `src/lib/Basic4WebGL/defs/RcRender.bas` | `cfg` field + `bindSettings` (forward to `self.rc`); `eyeZ`/`maxDist`/`maxPitch`/`stdCeil`/`surfLightStep`/`surfSegMax`/`actorHeight` via `cfg` |
| `src/constants/packageModules.ts` | import + `rcsettings` entry |
| `src/constants/firstPartyPackages.ts` | `rcsettings` in `moduleNames` |
| `tests/lib/Basic4WebGL/integration/raycasterSettings.test.ts` | **new** |
| `src/docs/guides/raycaster-library.md` | "Per-scene tuning" section + 18-knob table |
| `docs/raycaster/api-reference.md` | `RcSettings` row |
| `src/docs/language-guide/packages.md` | `RcSettings` in the table |
| `docs/language/library-roadmap.md` | mark resolved / shipped note |
