# Raycaster Engine — Design Spec

**Date:** 2026-08-31
**Status:** design approved, ready for implementation planning
**Scope:** the foundational rendering / movement / collision engine only. No gameplay,
no front-line simulation, no shipped demo. Gameplay (see
`docs/raycaster-game-concept.md`) is built on top of this later and is explicitly
out of scope here. The deliverable is three engine modules working correctly and
measurably fast, exercised by a minimal test scene.

---

## 1. Goal

Replace the current grid raycaster — which lives as ~1170 lines of game-level
`.bas` in `demo-src/raycaster/GameScene.bas` and renders one freshly-allocated
`PIXI.Sprite` per column per frame — with a **black-box engine** that delivers a
"DOOM plus a bit" renderer: believable multi-level environments authored inside
honest, fixed boundaries, at a per-frame cost low enough to run alongside HUD,
particle and sprite layers.

"DOOM plus a bit" = DOOM's connected-sector feel (see across pits, through
windows, under walkways) **plus** a fixed diagonal-wall tile set and one level of
room-over-room. It is **not** the Build engine (Duke Nukem 3D): no arbitrary-angle
walls, no slopes, no N-deep sector stacking, no moving/rotating sectors.

Game code that sits on this engine should express **rules**, not rendering: today's
`GameScene.bas` equivalent should be a few hundred lines.

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

The world is a grid of cells. The grid is retained as the spatial index so DDA
traversal, mover collision, and `.stm` tilemap authoring all survive.

### 3.1 Cell

| Field | Meaning |
|---|---|
| `wall` | 0 = empty; >0 = wall texture id (full-height opaque blocker); a diagonal-tile id selects a 45° chord + rotation |
| `floorH`, `ceilH` | floor / ceiling height of this cell's **main region**, world units. Standard values reproduce today's flat behaviour. |
| `floorTex`, `ceilTex` | surface texture ids |
| `upper` | optional index into the **upper-region table**; null for most cells |
| `light` | baked static light level (author hint; dynamic lights add on top at runtime) |
| `flags` | bitset: `door`, `lift`, `water`, `sky` |

### 3.2 Upper-region table entry (the single portal hop)

`{ floorH, ceilH, floorTex, ceilTex, wallTex }` — describes the space **above** the
cell's `ceilH`, entered through a hole in that ceiling. Exactly one level. Enough
for: walkway over a room, vent above a corridor, sniper balcony, basement under a
lobby. Not enough for a multi-storey tower — acceptable, the concept's areas are
compact (32–48 grid).

### 3.3 Authoring — semantic, not pictorial

The `.stm` tilemap layer is a **top-down floorplan**, not a picture of the game:

- Tile palette is tiny: one "wall" placeholder, one "floor/open" placeholder, one
  "diagonal" placeholder with 4 rotations. No per-texture tilemap art.
- Everything else rides on **`TileMapSet` tags** on the cell:
  `tex:concrete`, `floor:2 ftex:grating`, `ceil:6 ctex:pipes`, `upper:vent`,
  `light:spot warm`, `door`, `water`, `sky`.
- The `raycaster` module owns the real texture atlas and resolves tag → atlas rect
  at map load. Retexturing an area = editing tags, no art changes.
- Same authoring workflow as the other demos; the tilemap editor's top-down view
  *is* the working view (walls as filled cells, tags as badges).

---

## 4. The cast

`raycaster` runs the cast once per screen column (≈120–200 columns, fixed at init).

### 4.1 Span builder (pure function — the testable core)

Input: cell grid + region tables + ray origin `(x, y)` + ray dir `(dx, dy)`.
Output: an ordered (near→far) list of **spans**.

1. DDA-march the grid exactly as the current demo does, but **do not stop at the
   first wall** — keep stepping.
2. At each cell boundary crossed, emit spans for the geometry between the previous
   cell and this one:
   - a **wall span** if the entered cell has `wall > 0` (or a diagonal segment test
     passes) — opaque, becomes the far clip
   - a **floor-step span** where `floorH` rises relative to the running floor level
   - a **ceiling-step span** where `ceilH` drops relative to the running ceiling
     level
   - if the cell has an `upper` region and the ray is beneath an open ceiling hole,
     also emit the upper region's floor/ceiling spans (the one portal hop)
3. Terminate on: opaque full-height wall hit, OR max ray distance, OR the caller's
   vertical occlusion window has fully closed (§5.1).
4. Each span: `{ distance, screenTop, screenBottom, kind, texId, texU, worldMidY }`.
   `worldMidY` is the point lighting samples (§6).

### 4.2 Diagonal tiles

DDA lands the ray in the cell; a single ray/segment intersection against the
tile's 45° chord (one of 4 canned segments) yields hit point, perpendicular
distance, and wall-U. No change to the march itself.

### 4.3 Shared LOS path

`raycast(x, y, dx, dy)` runs the same DDA march with no span construction and
returns the distance to the first opaque hit, or -1. Used by light occlusion (§6)
and by weapon/enemy-fire queries (§7). One code path, one set of tests.

---

## 5. The render

### 5.1 Per-column occlusion window

Walk the column's spans **far → near**, maintaining a vertical window
`[top, bottom]` in screen pixels (starts full-height):

1. Clip the span's `[screenTop, screenBottom]` to the current window.
2. If anything remains visible, draw it (§5.2).
3. Shrink the window by what the span now occupies — walls and floor-steps eat from
   the bottom, ceiling-steps from the top.
4. When `top >= bottom`, the column is complete — stop.

### 5.2 One persistent mesh for the whole wall + floor + ceiling layer

- Allocate **once** at init: vertex buffers sized
  `maxColumns × maxSpansPerColumn × 4` vertices. `maxSpansPerColumn` is a fixed
  cap; spans beyond it are dropped (occlusion means far spans rarely matter).
- Each frame the cast writes **positions, atlas-UVs and a per-vertex tint** (the
  lit colour) directly into typed arrays; the mesh uploads once.
- **Zero per-frame allocation. No `destroy()`. One draw call** (single atlas bound
  — see 5.3).
- Sky (`sky`-flagged ceiling spans) and the default ambient floor/ceiling fill are
  quads in the same mesh.

### 5.3 One texture atlas — fixed-size grid (option D)

Every wall / floor / ceiling texture is the same power-of-two size (default
128×128). The atlas is a plain grid — e.g. 8×8 = 64 textures on a 1024×1024 page,
with additional pages allocated if a map references more than 64. A texture's slot
is its index; UV math is `index → (row, col)`, identical and branch-free for every
strip. No rect table, no packer.

This is deliberately the **same model the 2D tilemap renderer already uses**:
`_sbAssets.getSlices(tileImage, tileW, tileH)` slices one tileset image into a
uniform grid addressed by index. The raycaster's atlas loader is a thin wrapper
over the same slicing, built at map load from the individually-preloaded,
tag-referenced images. Tag → slot index resolved at load.

Trade-off accepted: uniform texture size is enforced (idiomatic for the genre —
DOOM and classic raycasters have always used fixed-size wall textures), and an
atlas page with few textures wastes space.

### 5.3a General reusability note (not in scope)

The single-mesh rendering technique in §5.2 — replace N per-cell display objects
with one persistent mesh whose quads are written into typed-array vertex buffers
and uploaded once — is exactly what a batched 2D tilemap renderer
(`PIXI` `CompositeTilemap`) does. The current `tilemap.js` creates one
`PIXI.Sprite` per non-empty cell (~2,300 objects for a 48×48 map); draw-call
batching already works, but the scene-graph object overhead does not scale. If the
raycaster proves this pattern out, retrofitting it into `tilemap.js` is a strong
follow-on performance improvement for every 2D game. **Recorded here, not part of
this spec.**

### 5.4 Per-span depth

The z-buffer becomes **per-span depth per column**, not a single value per column,
so a billboard behind a near ledge but in front of a far wall clips correctly
(§7).

### 5.5 Cast loop implementation

JS inside the module, not `.bas`. Per-column ray directions recomputed once per
frame (they depend only on camera yaw). Typed arrays throughout, no `math.*`
indirection, sqrt-free perpendicular distance (the standard DDA identity, kept
from the current demo).

---

## 6. Lighting

The renderer picks one tint colour per drawn strip. No per-pixel work. With
120–200 columns, adjacent strips sample slightly different world points, so a flat
per-strip tint still reads as a smooth gradient across a surface.

### 6.1 Light grid (decouples lighting cost from column count)

- **Static lights:** baked once at map load into a per-cell-corner light value.
- **Dynamic lights** (player torch, muzzle flash, flicker): each frame, splat into
  a small overlay grid — for every cell within the light's capped range, one
  `raycast()` LOS march from light to cell centre. Range ~8 cells × ~12 active
  lights ≈ a couple thousand short DDA marches per frame, **independent of screen
  resolution**.
- A strip's tint = ambient + bilinear sample of (static + dynamic) grid at the
  strip's `worldMidY` position.
- **Wall occlusion of light falls out of the LOS march for free** — a cell the
  light can't see stays dark. "Dark room, light spilling under the door" works in
  v1.
- **Light cap:** the N nearest lights per grid cell contribute (e.g. 4); the rest
  are ignored, bounding cost regardless of how many an author places.

### 6.2 Light types

| Type | Fields |
|---|---|
| Scene / ambient | one global colour + intensity; per-area override allowed |
| Point | position `(x, y, z)`, colour, intensity, radius (smooth falloff to 0) |
| Spot | point + direction + cone angle + softness |
| Player light | a spot (and/or weak point) parented to the camera — just a dynamic light, no special case |
| Muzzle flash / fx | a point light with a sub-100 ms intensity envelope |

### 6.3 Sprites

Billboards sample the same light grid at their base point — one evaluation per
sprite — so enemies darken in shadow and take on firelight colour.

### 6.4 Static-light caching

The optimisation pass (§10, phase 9) caches per-(cell, light) contributions for
static lights across frames; only dynamic lights recompute every frame.

---

## 7. The mover — locomotion + static scene collision

`raycaster.createActor(x, y, radius, height)` → an actor. The caller supplies
**intent**; the mover resolves it against the world. **All actor-vs-static-scene
collision lives here** — it is one swept resolution and cannot be meaningfully
separated from step-up and head-clearance.

- Intent API: `actor.move(forward, strafe)`, `actor.turn(delta)`,
  `actor.look(delta)` (pitch, clamped), `actor.jump()`.
- Resolution each step:
  - horizontal: circle (`radius`) vs cell edges and diagonal segments,
    slide-along-wall
  - **step-up** onto floors within step height; blocked by higher floors
  - **head clearance** against `ceilH` (and the upper region's `floorH` when
    beneath a hole)
  - gravity + landing; falling into pits
  - riding a `lift` cell whose `floorH` animates
  - which region (main vs `upper`) the actor occupies, resolved by height
- Read-back: `actor.x() y() z() angle() pitch()`, `actor.onGround()`,
  `actor.regionId()`.
- `raycaster.bindCamera(actor)` — the view follows this actor. Player and enemies
  use the **same mover**; an enemy is an actor with no camera bound.

### 7.1 Actor-vs-actor collision

Opt-in via `raycaster.setActorCollision(true)`. Resolved inside the mover's
horizontal pass against a spatial hash of other actors, so "what can I walk
through" has a single owner.

### 7.2 What is NOT in the mover

| Concern | Owner | Rationale |
|---|---|---|
| Ray / hitscan vs world + billboards (`raycast()`, `actor.hitscan()`) | renderer / actors module | reuses the frame's DDA + billboard depth structures; nothing is moving |
| Trigger volumes (pickup radius, zone entry, line-of-sight-to-player) | game `.bas` | gameplay rules stay outside the black box; game calls `raycaster.actorsNear(x, y, r)` / `actor.distanceTo(...)` |
| The existing `collision` engine module | **not used in a raycast scene** | that module is 2D AABB/circle for the flat sprite world; the raycast collision surface is the height-aware grid, owned by the mover. The spec forbids wiring the two together. |

---

## 8. Actors / billboards / LOS

- `raycaster.addBillboard(imageName, x, y, z)` → billboard; `.setFrame(i)`,
  `.setPosition()`, `.setTint()`, `.remove()`. **Pooled** — no create/destroy per
  frame.
- Depth-sorted against the per-column span list; occluded by walls and ledges
  automatically; lit via §6.3.
- `raycaster.raycast(x, y, dx, dy)` → distance to first opaque hit or -1.
- `actor.hitscan(range)` → `RayHit { billboard, distance, hitX, hitY }` — hits
  walls or billboards; for weapons and enemy fire. Reuses the existing `RayHit`
  class def (`src/lib/Basic4WebGL/defs/rayhit.bas`).
- `raycaster.worldToScreenX(x, y)` → column index, for reticle / aim assist.

---

## 9. softBASIC surface & engine wiring

Follows the six-step "adding a new library module" process in `CLAUDE.md`.

1. **Def file** `src/lib/Basic4WebGL/defs/raycaster.bas` — **hand-written**, not
   descriptor-generated (not added to `registry.ts`). Surface:
   - `raycaster.loadMap(tilemapName)` — build the world model from a tilemap and
     its `TileMapSet` tags
   - `raycaster.setAmbient(r, g, b, intensity)`
   - `raycaster.addLight(x, y, z, r, g, b, intensity, radius)` → light handle;
     `raycaster.addSpot(...)`; `light.setPosition()`, `light.setIntensity()`,
     `light.remove()`
   - `raycaster.createActor(x, y, radius, height)` → actor (§7 API)
   - `raycaster.bindCamera(actor)`, `raycaster.setActorCollision(flag)`
   - `raycaster.addBillboard(imageName, x, y, z)` → billboard (§8 API)
   - `raycaster.raycast(x, y, dx, dy)`, `raycaster.worldToScreenX(x, y)`,
     `raycaster.actorsNear(x, y, r)`
   - `raycaster.cellFloorHeight(x, y)`, `raycaster.cellCeilHeight(x, y)`
   - rendering is automatic on the frameloop once a map is loaded
2. **Engine file** `src/components/Runner/engine/raycaster.js` — world model, span
   builder, occlusion resolver, one-mesh renderer, atlas, light grid, mover,
   billboard pool.
3. **Bootstrapper** — register in `src/components/Runner/softBasicEngine.js`.
4. **Tests** — §10 below (written first, TDD).
5. **Docs** — new API Reference page under `src/docs/api-reference/`, added to
   `src/docs/manifest.ts`. A Language Guide topic is not needed (no new language
   construct).
6. **Roadmap** — update `docs/roadmap.md` and `docs/language/library-roadmap.md`
   if this closes or partially closes a tracked item; update
   `src/docs/roadmap.md` (public summary) too.

### 9.1 Resolved decisions

- **Camera.** `raycaster` owns its own camera state (yaw, pitch, position, plane
  vectors, FOV). The existing `camera` module is 2D-scroll-oriented and is inert
  inside a raycast scene — this is a fundamentally different projection and reusing
  it would only constrain the design. The mover writes camera state via the actor
  bound with `raycaster.bindCamera(actor)`.
- **Tuning constants.** Pick defaults now, expect authors/us to tweak against the
  phase-9 benchmark. Starting values: `maxColumns = 160` (≈ one ray per 8 px at
  1280 wide, strip-doubled), `maxSpansPerColumn = 12`, light-cap = 4 lights per
  grid cell, dynamic-light range = 8 cells, max active dynamic lights = 12,
  step-up height = 0.35 world units. All exposed as module constants, not magic
  numbers.

### 9.2 Resolved — atlas construction

Fixed-size grid atlas (option D), §5.3. Chosen for direct reuse of the existing
`_sbAssets.getSlices` uniform-grid tileset model. Remaining sub-decision for the
plan: default tile size (128×128 assumed) and whether floor/ceiling textures share
the wall atlas page or get their own.

---

## 10. Testing

The renderer's pixels cannot be Vitest-tested (project convention: Vitest checks
transpiler output, not runtime). The design therefore **extracts the engine logic
as pure functions**:

| Unit (pure, Vitest) | Input → output |
|---|---|
| map loader | tilemap + tags → cell grid + region tables |
| **span builder** | grid + ray origin/dir → ordered span list (the core; many hand-built map cases) |
| occlusion resolver | span list → visible clipped strips |
| light grid | lights + occluder grid → per-corner light values, including LOS blocking |
| mover resolution | position + intent + grid → new position / z / region |

Plus:

- **Transpiler tests** — `tests/lib/Basic4WebGL/unit/transpiler/raycaster.test.ts`:
  the `raycaster.bas` surface compiles to the expected `_sb.*` calls.
- **Frame-cost benchmark** — a `tests/scratch/` harness measuring per-frame cast +
  buffer-write + light-grid cost on a representative map. Not committed to the
  suite; the reference point for the phase-9 optimisation pass.
- **Per-phase demo** — every phase (§11) ends with a small, self-contained demo
  that exercises exactly what that phase added, built and structured **exactly like
  the shipped demos**: a real `.b4wgl.json` export under `src/docs/demos/` with its
  real assets, plus a `describe` block in `cypress/e2e/demos.cy.ts` that seeds the
  export and asserts no `ERR` entries. **The one difference: no entry is added to
  `src/features/demos/demoRegistry.ts` and no `src/docs/demos/<slug>.md` page is
  written**, so the demo never appears on the public `/demos` page. It exists as a
  runnable, e2e-verified artifact only. These phase demos are the raycaster
  engine's browser-level regression coverage — they replace the single "test
  scene" idea with an accumulating set, one per capability.
- Naming: `RaycasterP1SpanCast`, `RaycasterP2Rooms`, … under `src/docs/demos/`;
  matching `describe('Raycaster P1 — …')` blocks. A later real, registry-listed
  showcase demo is a separate gameplay-era task, out of scope here.

---

## 11. Build phasing (engine only)

Each phase lands with its unit tests green **and** its unlisted demo (§10) running
`ERR`-free in Cypress before the next begins.

1. **World model + map loader** — pure, fully tested.
   *Demo:* loads a tagged `.stm`, prints cell heights / region data to the console
   — proves the loader without a renderer.
2. **Span builder** (DDA + span collection) — pure, fully tested with hand-built
   maps.
   *Demo:* casts a fan of rays from a fixed point, draws the returned spans as a
   2D top-down debug view (span list visualised) — proves the cast without the 3D
   renderer.
3. **Renderer**: occlusion window + one-mesh buffer writer + grid atlas.
   *Demo:* a static camera in a stepped, pitted room with a window — the first
   real 3D view. No movement yet.
4. **Mover + raycaster-owned camera**.
   *Demo:* free-walk that height-varied room — WASD + mouse-look, step up stairs,
   fall in the pit, bonk your head on a low ceiling.
5. **Lighting**: static bake + dynamic light grid + LOS occlusion.
   *Demo:* the same room, dark, with a camera-parented flashlight and one flickering
   wall light casting a hard shadow edge.
6. **Actors**: billboard pool, depth-sort vs spans, `raycast()` / `hitscan()`.
   *Demo:* a few billboards on different floor levels, correctly occluded by
   ledges; click to `hitscan` and log what was hit.
7. **Diagonal-wall tiles.**
   *Demo:* an octagonal room + a canted corridor.
8. **One upper region per cell** (single portal hop).
   *Demo:* a walkway over a room you can see under, and a room under a lobby you
   drop into.
9. **Optimisation + benchmark pass**: batching, buffer upload strategy, static
   light caching, constant tuning.
   *Demo:* a deliberately busy stress map + an on-screen frame-time readout.
10. **Docs** (API Reference page, added to `manifest.ts`) + roadmap update
    (`docs/roadmap.md`, `docs/language/library-roadmap.md`, `src/docs/roadmap.md`).
    No new demo; the phase-9 stress demo stands as the reference.

Phases 1–6 are the foundation. 7–8 are the "plus a bit". 9 proves the performance
numbers.

---

## 12. Out of scope (explicit)

- All gameplay from `docs/raycaster-game-concept.md`: front-line simulation, area
  states, safe zones, resources, enemy roster, weapons, narrative, the day clock,
  the persistent save blob.
- A shipped, published demo. The concept is not proven with a playable demo until
  this engine foundation is complete and stable.
- The auto-revealing minimap (separate concept-doc engine ask).
- Slopes, arbitrary-angle walls, N-deep room-over-room, moving/rotating sectors,
  mirrors, skyboxes, volumetric water — permanently out per §2.1.
