# Raycaster Engine — Design Spec

**Date:** 2026-08-31
**Status:** design approved, ready for implementation planning
**Scope:** the foundational rendering / movement / collision layer for a
first-person raycaster, built **as a softBASIC library**. No gameplay, no
front-line simulation, no publicly-listed demo. Gameplay (see
`docs/raycaster-game-concept.md`) is built on top of this later and is explicitly
out of scope here. The deliverable is a set of `.bas` modules that a game project
includes, exercised by one unlisted demo per phase.

---

## 1. Goal & approach

Take the current grid raycaster — ~1170 lines of game-specific `.bas` in
`demo-src/raycaster/GameScene.bas` that mixes the cast, texturing, billboard
projection, z-buffer and hit detection — and rebuild it as a **clean, reusable
softBASIC library**: `RcWorld`, `RcCast`, `RcRender`, `RcMover`, `RcActors`,
`RcLights`. A game includes these and writes only rules on top.

It should deliver a "DOOM plus a bit" renderer: believable multi-level
environments authored inside honest, fixed boundaries.

"DOOM plus a bit" = DOOM's connected-sector feel (see across pits, through
windows, under walkways) **plus** a fixed diagonal-wall tile set and one level of
room-over-room. It is **not** the Build engine (Duke Nukem 3D): no arbitrary-angle
walls, no slopes, no N-deep sector stacking, no moving/rotating sectors.

### 1.1 The architecture rule (non-negotiable)

**This is a project for building *in* the language, not building out the
language.** The raycaster is written in softBASIC. This is deliberate dogfooding:
the friction a softBASIC author would hit building this is exactly the friction we
want to find and fix.

- **Default:** every part — the cast, span logic, occlusion, mover, collision,
  lighting math, LOS — is `.bas` code in the library.
- **When softBASIC can't express something, or a phase's demo measurably can't
  hold 60 fps:** the fix is a **generic improvement to an existing engine module**
  (`drawing`, `tilemap`, `math`, …), exposed through the normal softBASIC surface
  and useful to *every* game. Never a raycaster-specific JS module.
- **Explicitly rejected:** a bespoke `raycaster.js` engine module that implements
  the renderer in JS and is called from softBASIC. That builds a fast island and
  lets the shared engine stay weak. The softBASIC-first path forces the generic
  fixes that benefit everyone.
- Each generic engine change is its own small spec/task with its own JS unit tests
  (that part stays testable), triggered by a demonstrated need, not anticipated.

### 1.2 Accepted trade: weaker unit testing

There is no harness that *executes* compiled softBASIC under Vitest — transpiler
tests check output strings only; runtime behaviour is Cypress-only. So the
library's *logic* (world model, span builder, mover) does **not** get fast
pure-function unit tests. The per-phase Cypress demos with `print` assertions are
the safety net, backed by `tests/scratch/` checks on transpile output.

This is accepted because (a) it's the same constraint a real softBASIC author
lives with, so it keeps us honest, and (b) the project runs on short iteration
loops — each phase is small and independently verified, not a one-shot engine.

---

## 2. The capability ladder — where we land

| Rung | Reference game | Ray behaviour | In scope? |
|---|---|---|---|
| A | Wolfenstein 3D (1992) | one full-height wall hit per ray | current demo — being replaced |
| B | Rise of the Triad (1994) | one hit per ray + per-cell floor/ceiling height | subsumed by C |
| **C** | **DOOM (1993)** | **ray returns a sorted list of surface spans; renderer clips near-over-far per column** | **yes — the core** |
| C+ | — | C + fixed diagonal-wall tiles + one upper region per cell | **yes — "plus a bit"** |
| D | Duke Nukem 3D (1996) | arbitrary sectors, slopes, room-over-room | **no — ruled out** |

### 2.1 Feature disposition relative to full D

| # | Build-engine feature | Verdict | Substitute |
|---|---|---|---|
| 1 | Arbitrary-angle walls (line segments) | **cut** | fixed diagonal-wall tiles: a cell whose wall is a 45° chord, 4 rotations |
| 2 | Sloped floors & ceilings | **cut** | fine stairs (6–10 shallow steps) |
| 3 | Per-cell floor + ceiling height | **keep** | — (this is rung C) |
| 4 | Room-over-room (N-deep sector stacking) | **limit** | exactly one optional "upper region" per cell, single portal hop |
| 5 | Moving / rotating sectors (crushers, sliding walls, trains) | **cut** | axis-aligned doors + vertical lifts only (cell whose `floorH` animates) |
| 6 | Parallax skyboxes, mirrors, camera screens, sloped sprites | **cut** | flat gradient sky on cells flagged `sky` |
| 7 | Billboard sprites with depth clipping | **keep (upgrade)** | clip against the per-column span list, not a single depth |
| 8 | Floor/ceiling-aligned decal sprites | **defer** | later sprite mode |
| 9 | Sector-based coloured / dynamic lighting | **keep (simple model)** | ambient scene light + capped nearest point/spot lights with wall occlusion — §6 |
| 10 | Volumetric / swimmable water sectors | **cut** | `water` floor flag → screen-line tint + splash overlay (cosmetic only) |

Deferred to post-foundation passes: decal sprites, per-sector coloured light beyond
the point/spot model, and the auto-revealing minimap (a separate item in
`docs/raycaster-game-concept.md`).

---

## 3. World / map data model

The world is a grid of cells, held in softBASIC arrays inside `RcWorld`. The grid
is the spatial index for DDA traversal, mover collision, and `.stm` authoring.

### 3.1 Per-cell data (parallel arrays in `RcWorld`, indexed `row * width + col`)

| Array | Meaning |
|---|---|
| `wall(i)` | 0 = empty; >0 = wall texture id (full-height opaque blocker); a diagonal-tile id selects a 45° chord + rotation |
| `floorH(i)`, `ceilH(i)` | floor / ceiling height of this cell's **main region**, world units. `0` / standard reproduce today's flat behaviour. |
| `floorTex(i)`, `ceilTex(i)` | surface texture ids (image names; resolution to a drawable is `RcRender`'s job) |
| `upper(i)` | index into the upper-region arrays, or `-1` |
| `light(i)` | baked static light level (author hint; dynamic lights add on top) |
| `flags(i)` | integer bitset: `1` door, `2` lift, `4` water, `8` sky |

(Parallel arrays rather than an array-of-objects because softBASIC array-of-class
access is slower and the cast loop touches these on every step.)

### 3.2 Upper-region arrays (the single portal hop)

`upFloorH()`, `upCeilH()`, `upFloorTex()`, `upCeilTex()`, `upWallTex()` — one entry
per distinct `upper:<name>` referenced. Describes the space **above** a cell's
`ceilH`, entered through a hole in that ceiling. Exactly one level. Enough for:
walkway over a room, vent above a corridor, sniper balcony, basement under a lobby.
Not a multi-storey tower — acceptable, the concept's areas are compact (32–48
grid).

### 3.3 Authoring — semantic, not pictorial

The `.stm` tilemap is a **top-down floorplan**, not a picture of the game:

- Tile palette is tiny: one "wall" placeholder tile, one "floor/open" placeholder,
  one "diagonal" placeholder with 4 rotations. No per-texture tilemap art.
- Everything else rides on **marker tags**: `tex:concrete`, `floor:2 ftex:grating`,
  `ceil:6 ctex:pipes`, `upper:vent`, `light:spot`, `door`, `water`, `sky`.
- `.stm` markers carry a single free-text `tag` string (`{ row, col, tag }`), not
  structured properties. `RcWorld` parses space-separated `key:value` / bare-flag
  tokens from that string and merges multiple markers on one cell. No `.stm`
  format or Tilemap Editor change.
- **Engine gap this exposes (phase 1):** `tilemapset.markersByTag(tag)` does exact
  string match and returns only `{x, y}` — a softBASIC library can't enumerate all
  markers and read their tags. Needs a generic addition (see §9.1).
- `RcRender` resolves texture ids (image names) to drawables; retexturing an area
  is editing tags, no art changes.

---

## 4. The cast (`RcCast`, softBASIC)

`RcCast` runs once per screen column (`RC_COLS` columns, default 160, fixed at
init). Per-column ray direction depends only on camera yaw — computed once per
frame into a shared array, not per column.

### 4.1 Span builder

Input: `RcWorld` + ray origin `(x, y)` + ray dir `(dx, dy)` + the caller's current
occlusion window. Output: spans appended to shared parallel arrays (reused each
call — no per-frame allocation in softBASIC either).

1. DDA-march the grid as the current demo does, but **do not stop at the first
   wall** — keep stepping.
2. At each cell boundary crossed, emit spans for the geometry between the previous
   cell and this one:
   - a **wall span** if the entered cell has `wall > 0` (or a diagonal segment test
     passes) — opaque, becomes the far clip
   - a **floor-step span** where `floorH` rises relative to the running floor level
   - a **ceiling-step span** where `ceilH` drops relative to the running ceiling
     level
   - if the cell has an `upper` region and the ray is beneath an open ceiling hole,
     also emit the upper region's floor/ceiling spans (the one portal hop)
3. Terminate on: opaque full-height wall hit, OR `RC_MAX_DIST`, OR the occlusion
   window has closed (§5.1).
4. Each span carries: `distance`, `screenTop`, `screenBottom`, `kind`, `texId`,
   `texU`, `worldMidY` (the point lighting samples, §6). Held in parallel arrays
   `spanDist()`, `spanTop()`, … capped at `RC_MAX_SPANS` (default 12) per column.

### 4.2 Diagonal tiles

DDA lands the ray in the cell; a single ray/segment intersection against the
tile's 45° chord (one of 4 canned segments) yields hit point, perpendicular
distance, wall-U. No change to the march.

### 4.3 Shared LOS path

`RcCast.los(x, y, dx, dy)` runs the same DDA march with no span construction,
returns distance to the first opaque hit or -1. Used by light occlusion (§6) and
weapon/enemy-fire (§8). One code path.

---

## 5. The render (`RcRender`, softBASIC calling `drawing.*`)

### 5.1 Per-column occlusion window

Walk the column's spans **far → near**, maintaining a vertical window
`[top, bottom]` in screen pixels (starts full-height):

1. Clip the span's `[screenTop, screenBottom]` to the window.
2. If anything's visible, draw it (§5.2).
3. Shrink the window by what the span occupies — walls / floor-steps eat from the
   bottom, ceiling-steps from the top.
4. When `top >= bottom`, the column is done — stop (and tell `RcCast` to stop).

### 5.2 Drawing a strip

Each visible strip is one `drawing.drawImageStrip(texImage, texU, destX, destY,
stripW, stripH)` call — exactly the primitive the current demo uses. Floor/ceiling
step surfaces use a flat-shaded `drawing.drawRect`. Sky spans use a gradient rect.

There is **no texture atlas** — each wall texture is its own preloaded image;
`drawImageStrip` samples the column. Multiple textures = multiple images, which is
fine.

Worst case per frame: `RC_COLS × RC_MAX_SPANS` ≈ 160 × 12 ≈ ~1900 strip calls, vs
~200 today.

### 5.3 Performance contingency (generic, measured, not pre-built)

Today's `drawing.js` allocates a new `PIXI.Texture` + `PIXI.Sprite` on every
`drawImageStrip` call and `destroy()`s them all each frame. At ~1900 calls that
will likely not hold 60 fps. The response, **in order, each gated on the phase-3
benchmark actually failing**:

1. **Measure first.** Build phase 3 in pure softBASIC; profile it.
2. **Generic `drawing.js` fix — sprite pooling.** Reuse strip `PIXI.Sprite` /
   `PIXI.Texture` objects across frames instead of create-and-`destroy()`. A
   handful of lines; every game that uses `drawing` in a loop benefits. Its own
   task + JS unit tests.
3. **Generic `drawing.js` fix — `tint` parameter on `drawImageStrip`.** Needed for
   per-strip lighting (§6) regardless; also lets lighting avoid a second
   translucent-rect pass. Generic.
4. **Only if still short: a generic batched-strip call in `drawing`** —
   `drawing.drawStrips(texImage, count, uArray, xArray, yArray, wArray, hArray,
   tintArray)` issuing one mesh update for many strips. Still not "raycaster"
   anything — a batched blit primitive any game can use.

Each rung is a separate spec, written only when the previous rung's benchmark
shows it's needed.

### 5.4 Per-span depth (sprite occlusion)

`RcRender` keeps a per-column, per-span depth in shared arrays (the current demo
already keeps a per-column `zbuffer` in softBASIC — this extends it). `RcActors`
clips billboards against it.

**As built (Phase 6):** the depth buffer is **per-column only** —
`RcRender.depthArr`, one nearest-wall perpendicular distance per screen column,
filled during the wall pass. There is no per-span depth list: a column's DDA
terminates at its first wall, and one nearest-wall distance per column is all
billboard occlusion needs.

### 5.5 The frame

`RcRender.renderFrame()` is called from the game's `onframe` (or an `RcEngine.tick`
helper): recompute per-column ray dirs → for each column, cast + resolve + draw →
draw billboards (§8). No auto-hook into the engine frameloop; the game drives it,
same as every other softBASIC pattern.

---

## 6. Lighting (`RcLights`, softBASIC)

One tint colour per drawn strip. No per-pixel work. With 160 columns, adjacent
strips sample slightly different world points, so flat per-strip tint still reads
as a gradient.

### 6.1 Light grid (decouples lighting cost from column count)

- **Static lights:** baked once at map load into a per-cell light value array.
- **Dynamic lights** (torch, muzzle flash, flicker): each frame, for every cell
  within the light's capped range (`RC_LIGHT_RANGE`, default 8), one
  `RcCast.los()` march from light to cell centre; accumulate into a dynamic-light
  array. ~8 × ~12 lights ≈ a couple thousand short marches, independent of screen
  resolution.
- A strip's tint = ambient + sample of (static + dynamic) arrays at the strip's
  `worldMidY` cell (nearest-cell in v1; bilinear later if it reads badly).
- **Wall occlusion of light falls out of the LOS march for free** — a cell the
  light can't see stays dark. "Light spilling under a door" works day one.
- **Light cap:** `RC_LIGHT_CAP` nearest lights per cell (default 4); rest ignored.

### 6.2 Light types

| Type | Fields |
|---|---|
| Scene / ambient | one global colour + intensity; per-area override allowed |
| Point | position `(x, y, z)`, colour, intensity, radius (smooth falloff) |
| Spot | point + direction + cone angle + softness |
| Player light | a spot / weak point parented to the camera — just a dynamic light |
| Muzzle flash / fx | a point light with a sub-100 ms intensity envelope |

### 6.3 Sprites

Billboards sample the same arrays at their base cell — one lookup per sprite.

### 6.4 Applying the tint

Requires the generic `drawImageStrip(tint)` parameter (§5.3 rung 3). Until that
lands, `RcLights` can fall back to a translucent `drawing.drawRect` over each
strip — correct, but doubles the draw count, so the tint parameter is the real
target.

---

## 7. The mover (`RcMover`, softBASIC) — locomotion + static scene collision

`RcMover.create(world, x, y, radius, height)` → an actor object. The caller
supplies **intent**; the mover resolves it against the world. **All
actor-vs-static-scene collision lives here** — one swept resolution, inseparable
from step-up and head-clearance.

- Intent: `actor.move(forward, strafe)`, `actor.turn(delta)`,
  `actor.look(delta)` (pitch, clamped), `actor.jump()`.
- Resolution each step:
  - horizontal: circle (`radius`) vs cell edges and diagonal segments,
    slide-along-wall
  - **step-up** onto floors within `RC_STEP_UP` (default 0.35); blocked by higher
  - **head clearance** against `ceilH` (and the upper region's `floorH` beneath a
    hole)
  - gravity + landing; falling into pits
  - riding a `lift` cell whose `floorH` animates
  - which region (main vs `upper`) the actor is in, by height
- Read-back: `actor.x()`, `y()`, `z()`, `angle()`, `pitch()`, `onGround()`,
  `regionId()`.
- `RcRender.bindCamera(actor)` — the view follows this actor. Player and enemies
  use the **same mover**; an enemy is an actor with no camera bound.

### 7.1 Actor-vs-actor collision

Opt-in `RcMover` flag. Resolved in the horizontal pass against the actor list, so
"what can I walk through" has one owner. (A spatial hash only if the actor count
makes the naive N² a measured problem.)

### 7.2 What is NOT in the mover

| Concern | Owner | Rationale |
|---|---|---|
| Ray / hitscan vs world + billboards (`RcCast.los`, `RcActors.hitscan`) | `RcCast` / `RcActors` | reuses the DDA + billboard depth; nothing is moving |
| Trigger volumes (pickup radius, zone entry, LOS-to-player) | game `.bas` | gameplay rules stay out of the library; game calls `RcActors.near(x, y, r)` / `actor.distanceTo(...)` |
| The `collision` engine module | **not used in a raycast scene** | it's 2D AABB/circle for the flat sprite world; the raycast collision surface is the height grid, owned by `RcMover`. Do not wire the two together. |

### 7.3 Camera

`RcRender` owns camera state (yaw, pitch, position, plane vectors, FOV). The
`camera` engine module is 2D-scroll-oriented and inert in a raycast scene —
different projection; reusing it would only constrain the design. `RcMover` writes
camera state through the bound actor.

---

## 8. Actors / billboards / LOS (`RcActors`, softBASIC)

- `RcActors.add(imageName, x, y, z, frameW, frameH)` → billboard object;
  `.setFrame(i)`, `.setPosition()`, `.setTint()`, `.remove()`.
  **As built:** billboards draw through `drawing.drawImageStrip` per column —
  whose engine layer already pools `PIXI.Sprite` and caches strip textures
  (Phase 5's `drawing.js` work) — so `RcActor` is pure data and there is no
  separate `sprite` pool to manage.
- Depth-clipped against the per-column wall depth (§5.4); occluded by walls and
  ledges; lit via §6.3.
- `RcCast.los(x, y, dx, dy)` → distance to first opaque hit or -1.
- `RcActors.hitscan(x, y, dx, dy, range)` → the hit `RcActor` or `0` (wall hit /
  miss), plus `hitKind()` / `hitDist()` / `hitX()` / `hitY()` / `hitActor()`
  accessors — matching `RcCast`'s span-accessor style. `rayhit.bas` was left
  unused.
- `RcRender.worldToScreenX(x, y)` → screen pixel X (or -1 if behind camera), for
  reticle / aim assist.

---

## 9. Engine changes (generic, contingent)

No new `_sb` module, no `packageModules` entry, no `raycaster.bas` def. The
library is `.bas` files in the game project. Engine work is limited to generic
improvements, each its own task, each triggered by a demonstrated need:

### 9.1 Known now (phase 1) — marker enumeration in `tilemap`

`tilemapset.markersByTag(tag)` does exact-string match and returns `{x, y}` only.
The raycaster needs to walk every marker and read its raw tag + cell coords. Add a
**generic** query — shape TBD in the phase-1 plan, options:

- `tilemapset.allMarkers()` → array of `{ col, row, tag }` (or `{x, y, tag}`)
- and/or `tilemapset.markersMatching(prefix)` for prefix/substring match

Useful for any marker-heavy game (entity tables, spawn metadata). Ships with its
own JS unit tests in `tests/components/Runner/tilemap.test.ts` and a
`docs/api-reference/` update.

### 9.2 Likely (phase 3+) — `drawing` throughput

See §5.3. Sprite pooling, then `drawImageStrip` `tint`, then a batched-strip call —
in that order, each gated on a benchmark. Each is generic and separately specced.

### 9.3 Possible (later phases)

- `math` helpers if a hot trig/vector op is missing and doing it in `.bas` is a
  measured bottleneck.
- Nothing else is anticipated.

### 9.5 As built — Phase 6

- **No `assetmanager` image-size accessor was needed.** `RcActors.add` takes
  explicit `frameW` / `frameH` arguments (the sprite's source frame size in
  pixels), so the library never has to ask the engine how big an image is.
- **One language fix was made:** `fix(transpiler)` `8098c42` — a method call with
  arguments on a function-local object, used in an *expression* context
  (`d = a.distanceTo(x, y)` where `a` is a `dim a as RcActor` local), now parses.
  It previously mis-scoped the argument list against the receiver's class, so an
  argument identifier that matched a zero-arg accessor on that class
  (`x` vs. `RcActor.x()`) parsed as a nested call and tripped on the comma. The
  sibling `arr(i).method(args)` shape on an *untyped* array is still open
  (`docs/roadmap.md` deferred issue #33 follow-up).

### 9.4 Resolved tuning constants

Defaults, tweakable, defined as `RC_*` constants in an `RcConfig.bas` (or `const`
at the top of the relevant module):

`RC_COLS = 160`, `RC_MAX_SPANS = 12`, `RC_MAX_DIST = 32`, `RC_LIGHT_CAP = 4`,
`RC_LIGHT_RANGE = 8`, `RC_MAX_DYN_LIGHTS = 12`, `RC_STEP_UP = 0.35`,
`RC_STRIP_W = 4` (screen px per column at 640-wide; `RC_COLS × RC_STRIP_W` spans
the viewport).

---

## 10. Testing

Per §1.2, the library's logic is not Vitest-unit-testable. Coverage is:

- **Per-phase unlisted demo (primary).** Every phase (§11) ships a small demo
  built and structured **exactly like the shipped demos** — a real `.b4wgl.json`
  under `src/docs/demos/` with real assets, built via `npm run build:demo`, plus a
  `describe` block in `cypress/e2e/demos.cy.ts` that seeds it and asserts no `ERR`.
  **Difference from a shipped demo: no `src/features/demos/demoRegistry.ts` entry
  and no `src/docs/demos/<slug>.md` page** — it never appears on `/demos`. A
  separate `src/features/demos/devDemoRegistry.ts` holds these so `__seedDemo` /
  Cypress can still reach them. The demos' `print` output carries assertions where
  possible (phase 1–2 especially).
- **Transpile-output scratch checks.** `tests/scratch/` files that compile a phase's
  `.bas` modules against `packageModules` and assert zero diagnostics — catches
  call-syntax errors before Cypress. Retired (`.skip`) once stable, per CLAUDE.md.
- **JS unit tests for every generic engine change** (§9) — `markersByTag`
  enumeration, `drawing` pooling/tint, etc. — in the existing
  `tests/components/Runner/` suites. This is the part that stays properly tested.
- **Frame-cost demo (phase 9).** A deliberately busy map with an on-screen
  frame-time readout; the reference for whether the §5.3 contingency rungs were
  enough.

Naming: `demo-src/raycaster-p1/` … `raycaster-p9/`; exports `RaycasterP1MapLoad`,
`RaycasterP2SpanCast`, … ; `describe('Dev demo: Raycaster P1 — …')`.

---

## 11. Build phasing

Each phase lands with its scratch transpile check green, any generic engine change
green in Vitest, **and** its unlisted demo running `ERR`-free in Cypress.

1. **`RcWorld` + map loader** + the generic `markersByTag` enumeration (§9.1).
   *Demo:* loads a tagged `.stm`, `print`s cell heights / flags / upper-region
   data with assertions. No renderer.
2. **`RcCast` span builder.**
   *Demo:* cast a fan of rays from a fixed point, draw the span lists as a
   top-down 2D debug view. No 3D yet.
3. **`RcRender`: occlusion window + strip drawing.** Triggers the §5.3 benchmark;
   the generic `drawing` fixes happen here **if** it fails.
   *Demo:* static camera in a stepped, pitted room with a window — first 3D view.
4. **`RcMover` + `RcRender`-owned camera.**
   *Demo:* free-walk that room — WASD + mouse-look, stairs, pit, low ceiling.
5. **`RcLights`: static bake + dynamic light grid + LOS occlusion.** Triggers the
   generic `drawImageStrip(tint)` need if not already done.
   *Demo:* dark room, camera flashlight + one flickering wall light, hard shadow
   edge.
6. **`RcActors`: billboard pool, depth-clip vs per-column wall depth, `los` /
   `hitscan` / `near`, `RcRender.worldToScreenX`.** **[DONE]**
   *Demo:* `raycaster-p6-actors` (`ActorScene.bas`) — 3 NPC billboards (floor /
   raised ledge / hidden behind a wall stub) + 6 probes on projection, hitscan,
   occlusion, `near`, and `los`.
7. **Diagonal-wall tiles** (`RcWorld` + `RcCast` + `RcMover`).
   *Demo:* an octagonal room + a canted corridor.
8. **One upper region per cell** (single portal hop).
   *Demo:* a walkway you see under; a room under a lobby you drop into.
9. **Optimisation + benchmark pass.** Whatever the accumulated demos show is slow —
   most likely the final `drawing` batched-strip rung, plus static-light caching in
   `RcLights`, plus constant tuning.
   *Demo:* busy stress map + on-screen frame-time readout.
10. **Docs + roadmap.** A `docs/` guide for the `.bas` library (not an API
    Reference page — it's project-level `.bas`, not an engine module), plus
    `docs/roadmap.md` / `docs/language/library-roadmap.md` updates. Any generic
    engine changes made along the way get their `src/docs/api-reference/` updates
    in their own phase, not deferred here.

Phases 1–6 are the foundation, 7–8 the "plus a bit", 9 proves the numbers.

---

## 12. Out of scope (explicit)

- All gameplay from `docs/raycaster-game-concept.md`.
- A `demoRegistry`-listed, published demo. Not until the library is complete and
  stable.
- The auto-revealing minimap (separate concept-doc ask).
- A bespoke `raycaster.js` engine module (§1.1).
- Slopes, arbitrary-angle walls, N-deep room-over-room, moving/rotating sectors,
  mirrors, skyboxes, volumetric water — permanently out per §2.1.
