# Pathfinding Module Design

**Date:** 2026-08-07
**Status:** Approved

## Goal

Add a `pathfinding` module to softBASIC so sprites can navigate around obstacles defined by a `TileMapSet`'s layers, with a minimal API (`navigateTo` / `isNavigating`) suitable for driving enemy AI in a top-down bullet-hell shooter demo. This is groundwork for that demo, not the demo itself — the demo is a separate, later piece of work that will consume this module.

## Background

The engine currently has no concept of "solid" or "walkable" tiles anywhere. `collision` (`defs/collision.bas`, `engine/collision.js`) is purely geometric — `spriteCollide`, `boxCollide`, `circleCollide`, `raycast` — with no tile-awareness at all. `TileMapSet` (`defs/tilemapset.bas`, `engine/tilemap.js`) already stores each layer as a grid (`_map[row][col]`, 1-based tile IDs, `0` = empty) at a fixed `_tileW`/`_tileH`, which this module reuses as its walkability source rather than inventing a parallel authoring format.

The upcoming bullet-hell demo needs enemies that path around walls/obstacles toward the player. That requirement is the forcing function for this spec, but the module itself is general-purpose — not coupled to that demo.

---

## Scope decisions (from discussion)

- **Blocking granularity**: whole-layer. Any non-zero tile in a flagged layer blocks that cell; there's no per-tile-ID solid/non-solid distinction within a layer in this iteration.
- **Grid resolution**: 1:1 with the TileMapSet's tile size — one nav-grid cell per tile, no separate resolution.
- **Movement**: the module drives movement itself (auto-stepping the sprite each frame via its own `onupdate`), not just returning waypoints for the caller to consume.
- **Target tracking**: no separate "track this moving sprite" function. `navigateTo(sprite, x, y, speed)` is designed to be called every frame (e.g. from the caller's own `onupdate`, passing `player.x(), player.y()` for chase behavior); internally it's cheap unless the target has actually moved to a new cell.
- **Diagonal movement**: 8-directional, with corner-cutting prevented (a diagonal step is invalid if either flanking orthogonal cell is blocked).
- **Unreachable/off-grid targets**: `navigateTo` snaps to the nearest walkable cell to the given target rather than failing outright.
- **Misuse before setup**: calling `navigateTo`/`isNavigating`/`stopNavigating` before `pathfinding.setup()` throws a runtime error (`throw new Error(...)`, matching `audio.js`/`save.js`/`scene.js`'s existing convention), rather than silently no-op'ing.
- **Out of scope for this iteration**: shared flow-field/Dijkstra-map pathing for many-enemies-to-one-target (noted as a future extension below, not built now); dynamic obstacle avoidance (other sprites blocking a path); non-sprite pathfinding targets; per-tile-ID (as opposed to per-layer) blocking; inline array-literal syntax for the `blockingLayers` argument (softBASIC has no array literals today — tracked as a separate, unrelated language-feature exploration, not part of this spec).

---

## Algorithm

**A\*** on the precomputed nav grid, 8-directional with corner-cut prevention, octile-distance heuristic. Chosen over BFS (does equivalent-quality search but explores more nodes on open maps, for no quality benefit since the grid is uniform-cost) and Jump Point Search (faster at scale but meaningfully more complex to implement and to later extend with weighted terrain; not justified for a first version).

---

## softBASIC API

```basic
' Setup — call once per scene, after the TileMapSet is loaded
dim layers(0)
array.push(layers, "walls")
array.push(layers, "obstacles")
pathfinding.setup(tileMapSet, layers)

' Optional — defaults to 200ms if not called
pathfinding.setRecomputeInterval(200)

' Per-sprite navigation — call every frame, e.g. from an enemy's onupdate
pathfinding.navigateTo(enemy, player.x(), player.y(), 120)
pathfinding.isNavigating(enemy)      ' true/false
pathfinding.stopNavigating(enemy)    ' cancel, sprite stops in place
```

- `blockingLayers` is a softBASIC array of layer-name strings, built with `dim`/`array.push` (no inline array-literal syntax exists in softBASIC today).
- `setRecomputeInterval` is a separate setter rather than an optional/default parameter on `setup`, matching the existing convention (`setPosition`, `setScale`, etc. in `sprite.bas`/`transform.bas`) — softBASIC has no default-parameter or function-overload support (confirmed: `BaseParameterValidatorNode.ts` enforces strict arity, `VariableListRule.ts` has no `=`-default token handling).
- There is one active nav grid at a time. Calling `setup()` again (e.g. on a scene change) replaces it — matches how the engine already treats singletons like the camera.

---

## Engine Implementation

### `src/components/Runner/engine/pathfinding.js` (new)

**`setupNavGrid(tileMapSetHandle, blockingLayerNames)`**
- Reads `blockingLayerNames` off the `TileMapSet` handle's layer map (same lookup `getTileMapSetLayer` uses; unknown layer name throws, same as that function does today).
- Builds one flat `Uint8Array` (`1` = blocked, `0` = walkable), sized to the grid's row/col extent, by OR-reducing the flagged layers' `_map`s **once**, at setup time. No layer lookups happen after this — A* and all other nav operations only ever read this flat array. Stored as the single active nav grid (module-level state), replacing any previous grid.
- Also stores `tileW`/`tileH` and the grid's origin, reusing the same world↔local conversion logic `tileAt` already uses (walking the ancestor chain, stopping at `worldContainer`/`hudContainer`), so `navigateTo`'s world-pixel targets convert to grid cells identically to how `tileAt` resolves them.

**`setRecomputeInterval(ms)`** — sets the module-level cooldown (default `200`).

**`navigateTo(spriteHandle, worldX, worldY, speed)`**
- Throws if no nav grid has been set up yet.
- Converts `(worldX, worldY)` to a grid cell; if blocked or outside the grid, snaps to the nearest walkable cell (simple expanding-ring search from the target cell).
- Looks up (or creates) a per-sprite nav state entry: `{ targetCellX, targetCellY, path, waypointIndex, speed, lastRecomputeTime }`.
- Recomputes the A* path only if this is the sprite's first call, or the resolved target cell differs from the last-searched target cell **and** `lastRecomputeTime` is older than the recompute interval. Otherwise just updates `speed` and returns — cheap.
- If A* finds no path at all (sprite's own cell is fully enclosed), clears any existing nav state so `isNavigating` reports `false` immediately rather than leaving a stale/stuck path.

**`isNavigating(spriteHandle)`** — `true` if the sprite has nav state with a remaining path, `false` otherwise (including "never navigated" and "arrived").

**`stopNavigating(spriteHandle)`** — deletes the sprite's nav state immediately.

**Module-level `onupdate(delta)`** (auto-invoked by `_sbLifecycle`, same mechanism `collision`/`world` already rely on):
- Iterates all sprites with active nav state.
- Skips (and removes state for) any sprite no longer present in `_sbInstances` (handles `world.remove` mid-navigation without leaking state).
- Moves each sprite toward its current waypoint at `speed * delta` (straight-line lerp in world space between waypoint cell centers); on reaching a waypoint, advances `waypointIndex`; on reaching the final waypoint, clears the sprite's nav state (navigation complete).

### `src/components/Runner/softBasicEngine.js`

New `_sbPathfinding` mixin spread into `_sb`, following the same wiring pattern as `_sbTilemaps`/`_sbCollision`.

---

## BASIC Definition File

**New file: `src/lib/Basic4WebGL/defs/pathfinding.bas`**

```basic
function setup(tileMapSet, blockingLayers): call("_sb.setupNavGrid(setup_tileMapSet._handle, setup_blockingLayers)"):endfunction
function setRecomputeInterval(ms): call("_sb.setRecomputeInterval(setrecomputeinterval_ms)"):endfunction
function navigateTo(sprite, x, y, speed): call("_sb.navigateTo(navigateto_sprite._handle, navigateto_x, navigateto_y, navigateto_speed)"):endfunction
function isNavigating(sprite): return call("_sb.isNavigating(isnavigating_sprite._handle)"):endfunction
function stopNavigating(sprite): call("_sb.stopNavigating(stopnavigating_sprite._handle)"):endfunction
```

Exact call-emission syntax (parameter name-mangling conventions, `._handle` access) will be confirmed against current transpiler output during implementation — the pattern above mirrors how `collision.bas`/`tilemapset.bas` already call through to `_sb.*`.

---

## Package Integration

`pathfinding` is added to `moduleNames` in `src/constants/firstPartyPackages.ts`, in the `softgfx` package grouping (alongside `collision`, `tilemapset`, `world`), so it ships automatically wherever those do.

---

## Testing

Per project convention (TDD, tests first):

1. **`tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`** — verifies each `.bas` function transpiles to the correct `_sb.*` call shape and arity. Follows the `collision.test.ts` pattern.
2. **`tests/components/Runner/pathfinding.test.ts`** (new, engine-level, following the `tilemap.test.ts`/`camera.test.ts` "evaluate the raw script in a Function context" pattern) — tests the actual A* logic in isolation from PIXI/softBASIC:
   - Nav grid construction: OR-reduction across multiple flagged layers, unflagged layers correctly ignored, unknown layer name throws.
   - Path correctness on fixture grids (open grid, single wall, maze-like layout, fully enclosed target).
   - Corner-cutting prevention on diagonal moves.
   - Snap-to-nearest-walkable-cell for blocked/off-grid targets.
   - Recompute cooldown: repeated `navigateTo` calls with the same target cell within the interval don't re-run A*; a target-cell change after the interval does.
   - `isNavigating` transitions: false before first call, true during, false on arrival, false after `stopNavigating`.
   - Sprite removed from world mid-navigation: state cleaned up on next `onupdate`, no throw.
3. No Cypress e2e spec is added in this sub-project on its own — no published tutorial or demo uses `pathfinding` yet. Once the bullet-hell demo is built, that demo's own `cypress/e2e/demos.cy.ts` spec (mandatory per the demo-authoring guide) exercises this module at runtime, per the project's e2e conventions.

---

## Docs

- New API Reference page `src/docs/api-reference/pathfinding.md`, added to `src/docs/manifest.ts`, following the existing style (beginner-friendly, no JS/PIXI internals, parameter tables, `.bas` examples using game-like scenarios — e.g. an enemy chasing a player around walls).
- Cross-reference added to `tilemapset.md` pointing readers to `pathfinding` for navigation around tilemap obstacles.

---

## Roadmap Sync

- `docs/roadmap.md`: pathfinding/nav isn't currently tracked anywhere (confirmed absent from both the roadmap and the "Lower Priority / Future" list) — this spec adds it as a new completed-on-implementation entry rather than closing an existing deferred item.
- `docs/language/library-roadmap.md`: module table gains a `pathfinding` row alongside `collision`/`world`.
- `src/docs/roadmap.md` (public-facing): checked for any relevant claim and updated if needed during implementation.

---

## Constraints & Non-Goals

- Whole-layer blocking only — no per-tile-ID solid/non-solid distinction within a flagged layer.
- One active nav grid at a time (no simultaneous multi-map pathing).
- No dynamic obstacle avoidance — other sprites don't block computed paths, only the tilemap does.
- No shared flow-field/Dijkstra-map optimization for many-agents-to-one-target — every sprite computes and re-computes its own A* path independently (bounded by the recompute cooldown). If profiling on the actual bullet-hell demo shows this doesn't scale to the desired enemy count, a shared flow-field is the natural follow-up, targeting the same `navigateTo`-style API surface.
- No non-sprite navigation targets or agents in this iteration.
- Inline array-literal syntax for `blockingLayers` is a separate, unrelated language-feature idea — not part of this spec (tracked as its own exploration).

---

## Open Questions for Implementation

None outstanding — all scope questions were resolved during brainstorming (see "Scope decisions" above). Any transpiler-syntax specifics (exact `.bas` call-emission mangling) will be confirmed against the live transpiler during implementation, as is standard for this kind of spec.

---

## Amendments (found during implementation planning)

**2026-08-07 — Movement is not "auto-invoked by `_sbLifecycle`"; it's a hardcoded call from `scene.js`, same as camera.** This spec's "Engine Implementation" section originally claimed the module-level `onupdate` driving sprite movement would be auto-invoked "the same mechanism `collision`/`world` already rely on." That's wrong on inspection: neither `collision` nor `world` has any per-frame hook at all, and `_sbLifecycle._update`'s generic `_sbClasses`/`_sbInstances` dispatch loop only ever receives entries from *transpiled user-authored* softBASIC modules/classes — no built-in engine JS file registers itself there. The actual precedent is `camera`: `_cameraUpdate(delta)` is called by a hardcoded line inside `scene.js`'s own `_update(delta)`, driven by the PIXI ticker (`app.ticker.add((ticker) => _sb._update(ticker.deltaMS))` in `bootstrapper.html`). `pathfinding._pathfindingUpdate(delta)` follows the identical pattern — one hardcoded line in `scene.js`, right next to the `_cameraUpdate` call. See the implementation plan (`docs/superpowers/plans/2026-08-07-pathfinding.md`, Task 6) for the exact change. This also means `delta` there is milliseconds (matching `camera`'s documented convention), so `speed` in `navigateTo(sprite, x, y, speed)` is pixels **per second**, converted via `speed * (delta / 1000)` per frame — not stated explicitly in the original spec text above, now confirmed here.
