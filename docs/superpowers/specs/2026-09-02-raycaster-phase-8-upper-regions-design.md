# Raycaster Phase 8 — Upper Regions (Single Portal Hop) — Design Spec

**Status:** approved (brainstorm 2026-09-02) — ready for implementation plan.

**Amends:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §3.2 (upper-region storage becomes layer-based, not marker-name-based), §4 step 2 / §4.2-adjacent (the portal hop), §5 (render), §7 (mover region transitions), §11 (marks Phase 8 done).

**Scope:** `demo-src/raycaster/lib/` — `RcWorld`, `RcCast`, `RcRender`, `RcMover`, `RcConfig`. One small **generic** engine addition: `tilemapset.hasLayer(name)`. New `demo-src/raycaster-p8/` demo. `demo-src/raycaster-p1/` migrates its `upper:` probe to the new layer model.

**The pitch (from the brainstorm):** an upper region is a *level-design flourish* — a walkway you glimpse under, a balcony, a stairwell you peek down. Genuinely complex multi-level areas get a `scenemanager.switch()` instead. The design is deliberately kept in proportion with that.

---

## 1. The model

Every cell has up to **two stacked spaces**: a **lower** region (its existing `floorH` / `ceilH` / `walls`) and one optional **upper** region directly above it. A single hole connects them — the spec's "single portal hop". Three-deep stacking stays permanently cut (engine-spec §2.1).

"Above" and "below" are the same two boxes seen from opposite ends:
- **Mezzanine over a room** — you spawn in the lower box.
- **Basement under a lobby** — you spawn in the upper box; the lobby *is* the upper region, the basement is the lower.

Each cell's stack sits at its own heights, so a "sunken lounge you see down into" is the lower box of those cells with its *upper* box floor level with the surrounding main floor.

**Out of scope for v1** (all deferred, see §7): per-region lighting; `los()` / hitscan / light traversing the portal; climbing back up without authored stairs; mid-band occlusion (render-fidelity B); the full Phase-6b horizontal-surface treatment for geometry seen *through* the portal; a `lift` cell that carries you between regions.

---

## 2. Authoring & data model

### 2.1 The `upper` tile layer

The `.stm` gains one tile layer named exactly `upper`, painted top-down like `walls`. **Three tile ids** (the demo ships a 3-tile sheet; painting the first three tiles of the sheet gives ids 1/2/3):

| id | meaning |
|---|---|
| 1 | **upper floor** — solid mezzanine/walkway plank |
| 2 | **upper wall** — full-height blocker within the upper region (`upFloorH`→`upCeilH`) |
| 3 | **hole** — upper region exists over this cell, but its floor is open (see up / fall through) |
| 0 / empty | no upper region over this cell |

No flood-fill, no markers for geometry — all three are painted explicitly. Walkway = id-1 cells; stairwell peek = id-3 ringed by id-1; vent tube = id-1 floor + id-2 sides.

A demo without an `upper` layer behaves exactly as Phases 1–7 (this is how p2–p7 stay untouched).

### 2.2 `tilemapset.hasLayer(name)` — new generic method

`tilemapset.layer(name)` **throws** for a missing layer (engine `getTileMapSetLayer`), so `RcWorld` can't probe for `upper` by catching. Add a generic boolean:

- `src/components/Runner/engine/tilemap.js`: `hasLayer(handle, name)` → `!!handle._layerContainers[name]`.
- `src/lib/Basic4WebGL/defs/tilemapset.bas`: `function hasLayer(name)` → `call("_sb.hasLayer(this._handle, haslayer_name)")`. (Confirm `tilemapset` is **not** descriptor-generated — check `src/lib/Basic4WebGL/library/registry.ts`; it is expected to be hand-written.)
- Standard-library test + a docs mention (`src/docs/` tilemapset reference).

This is a legitimate generic addition — "does this map have a layer called X" is broadly useful, not raycaster-specific.

### 2.3 `RcWorld` changes

- `build()`: after the `walls` pass, `if tm.hasLayer("upper") then` read the `upper` layer with the same `tileAt(col*tw + tw/2, row*th + th/2)` technique into a new `upKindArr(i)` (0–3). When absent, `upKindArr` stays all-0.
- **Upper floor height** for cell `i` = that cell's own `ceilHArr(i)` (the mezzanine floor sits on the room's ceiling line — the author raises it with the normal `ceil:N` marker). Not stored separately; `upperFloorAt` returns `ceilHeightAt`.
- **Upper ceiling height**: `upCeilHArr(i)`, default `ceilHArr(i) + RcConfig.RC_STD_CEIL`, overridable per cell by a new `uceil:N` marker key in `applyKv` (same shape as `ceil:N` → `math.val`).
- **Removed:** `upper:<name>` marker parsing (the `if k = "upper"` / `isUpper` two-pass branch in `applyTag`, the `if key = "upper"` branch in `applyKv`), `upNames`, `upFloorHArr` (the name-indexed array), `upCeilHArr`'s old meaning, `upperArr`, `upperRegion()`. The header comment's "Phase 1 scope — not yet implemented" upper-region paragraph is replaced.
- **New arrays:** `upKindArr(0)`, `upCeilHArr(0)` (repurposed: now per-cell, not per-region). Both pushed 0 / `1.0` in the per-cell init loop (the `+ RC_STD_CEIL` default is applied after `ceil:` markers are known — either a second pass, or store a sentinel and resolve in the accessor).
- **New / changed accessors:**
  - `upperKindAt(col, row)` → 0–3 (OOB → 0)
  - `upperFloorAt(col, row)` → `ceilHeightAt(col, row)` (the plane the mezzanine floor / hole sits at)
  - `upperCeilAt(col, row)` → `upCeilHArr` value (OOB → standard)
  - `hasUpperAt(col, row)` → `upperKindAt(col, row) > 0` (kept — p1's probe still calls it)
- `RcConfig`: add `RC_STD_CEIL = 1.0` (currently hardcoded as `1.0` in `RcWorld`; replace those literals too).

### 2.4 `raycaster-p1` migration

`p1testmap.stm` has `{ "row": 1, "col": 2, "tag": "upper:vent" }` and `MapProbeScene.bas` asserts `self.wld.hasUpperAt(2, 1) = 1`. Migration:
- `p1testmap.stm`: add an `upper` tile layer with a tile (id 1) at row 1 / col 2; remove the `upper:vent` marker.
- `MapProbeScene.bas`: the probe line is unchanged (`hasUpperAt(2, 1)` still returns 1). Optionally tighten it to also check `upperKindAt(2, 1) = 1`.
- `raycasterDemoProbes` P1 case (if one exists) / the Cypress p1 spec stay green.

---

## 3. `RcCast` — the portal hop

### 3.1 Signature

`cast(wld as RcWorld, ox, oy, dx, dy, region)` — new 6th param `region` (0 = camera in the lower region, 1 = upper). The **only** caller is `RcRender.renderFrame` (RcActors uses `los()`); it passes `camRegion`. The DDA march (`beginMarch` / `stepMarch`) is unchanged — one pass, each cell once.

### 3.2 Primary-region spans

The region the camera is in. Emitted exactly as today (wall / floor-step / ceiling-step / diagonal), but the height + wall source depends on `region`:

| | region 0 (lower) | region 1 (upper) |
|---|---|---|
| floor height | `wld.floorHeightAt` | `wld.upperFloorAt` |
| ceiling height | `wld.ceilHeightAt` | `wld.upperCeilAt` |
| wall test | `wld.wallAt(c,r) > 0` | `wld.upperKindAt(c,r) = 2` |
| diagonal | `wld.diagAt` (unchanged) | none in v1 (upper regions have no diagonals) |

For region 0, a cell with `upperKindAt = 1` (solid plank) reached *before* any hole simply means the lower `runCeil` there is `upperFloorAt` — the existing ceiling-step logic already produces that span if the author set `ceil:` correctly. No new span.

### 3.3 Portal spans (the other region)

Emitted only once the ray has crossed an **opening**:
- **region 0**, ray enters a cell with `upperKindAt = 3` (hole) → from here on, emit the upper region's geometry as new span kinds. Caps (stop emitting upper spans) on: a full lower wall (`wallAt > 0`, ends the march entirely), or a solid plank (`upperKindAt = 1`) beyond the hole (its underside blocks further upward view — emit one `RC_SPAN_UPPER_FLOOR` span at `upperFloorAt` and stop).
- **region 1**, ray enters a cell with `upperKindAt = 3` (hole) **or** `upperKindAt = 0` (the region's open edge) → emit the lower region's floor/walls as portal spans (looking *down* through the opening). Caps on a lower wall.

New span kinds (added to `RcConfig`, after the Phase-7 constants):
- `RC_SPAN_UPPER_WALL` — an id-2 cell reached while `seeUpper`; extent `[upperFloorAt, upperCeilAt]` at the cell's entry distance.
- `RC_SPAN_UPPER_CEIL` — the upper ceiling seen through a hole; height `upperCeilAt`.
- `RC_SPAN_UPPER_FLOOR` — a plank underside seen from below through a hole; height `upperFloorAt`.
- (region-1 primary reuses `RC_SPAN_WALL` / `RC_SPAN_FLOORSTEP` / `RC_SPAN_CEILSTEP` for its own geometry; the *lower* region seen through a downward hole reuses `RC_SPAN_UPPER_*` with the occlusion-side flag flipped — or symmetric `RC_SPAN_LOWER_*` kinds; the plan picks whichever keeps the renderer branch count lower. Recommendation: one pair of "portal" kinds + a side flag, not four kinds.)

**Occlusion-side flag:** each portal span carries whether the other region is *above* the primary (eat the screen window from the **top**) or *below* it (eat from the **bottom**). Store it in the span's existing `side` field (currently 0/1 for x/y-hit; portal spans don't need x/y, so overload it: `side = 2` "eat top", `side = 3` "eat bottom" — or a dedicated column if `side` is load-bearing elsewhere; the plan decides).

### 3.4 What does NOT change

`los()` — region-blind, ignores `upper` entirely. Light occlusion and hitscan do not traverse the portal (§7 deferred). `beginMarch` / `stepMarch` / `RC_MAX_DIST` / the span array layout (only new `kind` values, and possibly one new column for the occlusion-side flag).

---

## 4. `RcRender`

### 4.1 Per frame

- `camRegion` = `self.boundMover.regionId()` when a mover is bound, else derive: `1` if `self.wld.upperKindAt(camCol, camRow) > 0 and self.camZ >= self.wld.upperFloorAt(camCol, camRow)`, else `0`.
- Pass `camRegion` as the 6th arg to `self.rc.cast(...)`.
- Seed each column's running floor/ceiling heights from the **primary** region (`upperFloorAt` / `upperCeilAt` when `camRegion = 1`, else today's `floorHeightAt` / `ceilHeightAt`).

### 4.2 Per-column span walk

The existing near→far walk with `winTop` / `winBot`, plus handling for the portal span kinds:
- Project via `projectY` (unchanged), draw a flat strip via `drawStrip`.
- Eat the window from the **top** (`side = 2`) or **bottom** (`side = 3`) — the same clamp the existing ceiling-step (top) and floor-step / wall (bottom) cases already do. **No mid-band split** (render-fidelity A).

### 4.3 Shading

`drawStrip`'s shade table: reuse where it reads acceptably —
- `RC_SPAN_UPPER_WALL` → the existing y-face wall grey (115),
- `RC_SPAN_UPPER_CEIL` → an existing ceiling-step grey,
- and add **one** new kind, `RC_SHADE_UPPER_FLOOR` (a plank underside seen from below — pick a grey distinct from `RC_SHADE_CEIL_UNDER` so a walkway reads as a separate object; e.g. 70).

### 4.4 v1 limits (documented)

- **Lighting is region-blind** — an upper-region strip samples the same `(col,row)` light-grid entry as the room below it. Mezzanines aren't separately lit; a room torch's glow doesn't stop at a plank. *Flagged for revisit once there are real demo environments to judge whether this is a real blocker.*
- **Billboard occlusion** (`depthArr`) — set to the nearest opaque surface in the column regardless of region (a plank underside, an upper wall, or a lower wall). Correct for the common case (an enemy on a walkway clipped by the walkway's own edge), not for pathological stacked cases.
- **Through-portal geometry** gets flat strips, not the full Phase-6b horizontal-surface fill (which applies only to whichever region is primary).

---

## 5. `RcMover`

### 5.1 State

- New field `region` (0/1). At construction: `1` if the spawn cell has an upper region and the spawn `z` sits at/above `upperFloorAt`, else `0` (default; matches p2–p7).
- `function enterRegion(r)` — snaps `self.pz` to that region's floor at the current cell and sets `self.region`. Additive; p2–p7 constructors and call sites unchanged. p8's scene calls `self.me.enterRegion(1)` when the demo wants a lobby spawn (the p8 demo spawns in the *lower* region, so it won't — but the API exists for the basement-under-lobby pattern).
- `function regionId()` → `self.region`. (Spec §7 already lists this accessor.)

### 5.2 Collision reads the current region

`blocked(cx, cy)` and the vertical resolver in `step()` read:
- `region = 0` → `wallAt` / `floorHeightAt` / `ceilHeightAt` (today, incl. the Phase-7 diagonal push-out)
- `region = 1` → `upperKindAt(cx,cy) = 2` as wall, `upperFloorAt` as floor, `upperCeilAt` as ceiling; `upperKindAt` of 0 or 3 = **no floor underfoot**

### 5.3 Region transition — one rule

Checked at each cell boundary in `step()`, both directions:

> If the destination cell's **current-region** floor isn't walkable (wall / step too high / no floor) **but the other region's floor there is within `RC_STEP_UP` of the body's current `z`**, switch `region` and snap `pz` to that floor.

Covers every case the flourish needs:
- **Drop through a hole:** step off a plank (region 1) over a cell whose `upperKindAt` is 3 → current-region floor gone, lower floor is far below (not within step) → **no switch yet**; instead `region` stays 1 but there's no floor, so the vertical resolver applies gravity. As `pz` falls to within `RC_STEP_UP` of `floorHeightAt`, the rule fires → `region = 0`, land. (Equivalently: the moment `upperKindAt` underfoot is not 1, force `region = 0` and let lower-region gravity take over — the plan picks the cleaner of the two; both land you on the room floor.)
- **Sunken lounge / level walkway:** walk from the main floor onto a walkway whose `upperFloorAt` equals the floor you're leaving → other-region floor is *at* your `z` → seamless switch, no jump.
- **Stairs up to a mezzanine:** `floor:N` step cells climb to `upFloorH`; the top step is within `RC_STEP_UP` of the adjacent id-1 plank → switch on that boundary.

### 5.4 Unchanged

Head clearance (now against the current region's ceiling), gravity, jump, the Phase-7 diagonal push-out (region 0 only — upper regions have no diagonals).

---

## 6. The `raycaster-p8` demo

### 6.1 `demo-src/raycaster-p8/`

- `assets/p8room.stm` — one room:
  - `walls` layer: outer wall ring; open interior; `ceil:1.4` on the room cells (headroom under the walkway).
  - `floor:` markers: a 3-step staircase up one side — `floor:0.4`, `floor:0.8`, `floor:1.2` on successive cells — reaching the walkway height.
  - `upper` layer: a walkway strip from the stair-top across to the far wall — id-1 planks, id-2 railing along the long edges, one id-3 hole partway along.
  - `uceil:` on the walkway cells for headroom up there (e.g. `uceil:2.4`).
  - one or two `light` markers.
- `assets/rc_placeholder_tiles.png` — copied from p6 (needs ≥3 tiles; the BulletHell sheet has plenty).
- `PortalScene.bas` — `Class` / `Extends scene`. Spawn in the **lower** region at the room centre. `RcWorld` (auto-reads `upper`), `RcRender`, `RcMover`, `RcLights`, torch follows the player. WASD/QE. `runProbes()`.
- `Main.bas` — bootstrap (copy the p6/p7 pattern).
- Byte-identical copies of the lib files p8 needs for a standalone transpile — same set as p7 (`RcConfig RcWorld RcCast RcRender RcMover RcLights RcActor RcActors`, because `RcRender.bas` has `dim a as RcActor`). `raycasterDemoLibSync` enforces.

### 6.2 `PortalScene.runProbes()` — 6 probes

Copy the `probe(label, passed, y)` helper verbatim (throws a caught runtimeError on failure so the Cypress "no ERR" guard sees it).

1. **layer read** — `upperKindAt` returns 1 at a known plank cell, 3 at the hole cell, 0 at a room cell.
2. **heights** — `upperFloorAt` equals the walkway cell's `ceilHeightAt`; `upperCeilAt` equals the authored `uceil:` value.
3. **portal hop fires** — a `RcCast` fired from the spawn (region 0) toward the hole produces at least one span whose kind is one of `RC_SPAN_UPPER_*`.
4. **plank caps it (control)** — the same cast aimed under a solid plank produces **no** `RC_SPAN_UPPER_*` span.
5. **climb → upper** — an `RcMover` spawned at the room floor, driven up the staircase for N steps, ends with `regionId() = 1` and feet at ≈ the walkway height.
6. **fall → lower** — an `RcMover` placed on the walkway (`enterRegion(1)`), driven into the hole, ends with `regionId() = 0` and feet at ≈ the room floor height.

Numeric thresholds derived from `p8room.stm`; the plan spells them out and notes "re-derive from the grid, don't loosen" if one fails.

### 6.3 Wiring

- `src/features/demos/devDemoRegistry.ts` — `raycaster-p8-upper` entry, `file: 'RaycasterP8Upper'`.
- `tests/ui/features/demos/devDemoRegistry.test.ts` — presence test.
- `cypress/e2e/demos.cy.ts` — `DEV_DEMOS` entry (`waitMs: 4000`).
- `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts` — P8 case (`_sb_portalscene`, `probeCount: 6`). The probes-test `makeSbStub` needs `hasLayer` (return true only for the demo's real layers) and per-layer `tileAt` (it currently stubs a single `walls` grid — extend it to serve the `upper` layer grid too).
- `npm run build:demo -- demo-src/raycaster-p8 RaycasterP8Upper`.

### 6.4 Tests beyond the demo

- `raycasterDemoSmoke.test.ts` — a `stubWorldUpper` duck-world (adds `upperkindat` / `upperfloorat` / `upperceilat`) + new `test.each(phaseDirs)` blocks: `cast(region=1)` runs without throwing; a portal span appears when a ray crosses a stub hole cell; `RcMover` region transition (drive onto a stub upper floor at matching height → `regionid()` flips). Add `upperkindat: () => 0` etc. to the **existing** `stubWorld` / `stubWorld2` / `stubWorldDiag` so the region-blind path stays green.
- `raycasterDiagWorld.test.ts` style — optionally a focused `raycasterUpperWorld.test.ts` building a real `RcWorld` from an inline two-layer stm and asserting `upperKindAt` / `upperCeilAt`.
- Full `npx vitest run` + `npx vite build` + the Cypress `demos.cy.ts` spec.

---

## 7. Out of scope / deferred

- **Per-region lighting** — v1 is region-blind (§4.4). *Revisit once real environments exist* — the brainstorm explicitly left this open pending evidence it's a real blocker.
- **`los()` / hitscan / light through the portal** — a bullet or torchlight from the room does not reach the mezzanine. Region-blind `los()`.
- **Climbing back up without authored stairs** — once you drop through a hole you're in the lower region; there's no auto "climb back". A `lift` cell that carries you between regions is deferred.
- **Mid-band occlusion** (render-fidelity B — per-column interval list) — permanently unless a real demo shows the single-window approximation is unacceptable.
- **More than two stacked levels** — permanently cut (engine-spec §2.1).
- **Diagonals in the upper region** — not supported; `diag:` is region-0 only.
- **Full Phase-6b horizontal-surface fill for through-portal geometry** — the far region gets flat strips.
- **`upper`-layer tile textures / per-region `tex:`** — flat-shaded, like the rest of the current renderer.

---

## 8. Six-step process mapping (per CLAUDE.md)

1. **`.bas` defs** — `tilemapset.bas` gains `hasLayer` (hand-written def — confirm not in `registry.ts`). No new module.
2. **Engine JS** — `tilemap.js` gains `hasLayer`. No other engine change (the raycaster library is softBASIC).
3. **Bootstrapper** — none (no new engine module).
4. **Tests** — TDD: `raycasterDemoSmoke` stub-world blocks, `raycasterDemoProbes` P8 case, optional `raycasterUpperWorld`, a standard-library test for `tilemapset.hasLayer`. Cypress `demos.cy.ts` P8 entry + manual run (this phase changes the engine/render — run it).
5. **Docs** — `src/docs/guides/raycaster-library.md` gains an "Upper regions" section (the `upper` layer, the 3 tile ids, the region model, the v1 limits); `tilemapset` API reference gains `hasLayer`.
6. **Roadmap docs** — `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §3.2/§4/§5/§7/§11 reconciled with "As built"; `docs/roadmap.md` item 28 + `docs/language/library-roadmap.md` get a "Phase 8 shipped" clause; the deferred items in §7 above recorded as tracked gaps (per-region lighting especially).

---

## 9. Phasing

Phase 8 per engine-spec §11. After Phase 7 (diagonals) — the two don't interact (diagonals are region-0 only). Phase 9 (optimisation + benchmark pass) is the last.
