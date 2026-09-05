# Raycaster height-aware lighting — design

## Context

The floor/ceiling gradient shading redesign (`docs/superpowers/specs/2026-09-04-raycaster-floor-ceiling-gradient-shading-design.md`, commits `8bbc926`..`8ca5e44`) fixed a genuine rendering-pipeline bug and, in doing so, exposed a real gap in the underlying light *model* rather than its rendering: `RcLights.splatCell` computes distance as `sqrt(dx² + dy²)` — pure horizontal distance. Every `addPoint(x, y, z, ...)` call stores `z` in `lzArr`, but nothing ever reads it. `sampleAt(worldX, worldY)` has no height parameter at all. The entire light grid is a flat 2D field: one scalar brightness per `(col, row)` cell, with zero concept of height.

Consequence: a floor point and a ceiling point at the same `(x, y)` always get the *identical* light value, regardless of how far each surface actually is from the light vertically. Visually this reads as a light "flowing" as a shaft along the corridor's length rather than pooling as a circle around the light, and the ceiling's pattern directly mirrors the floor's ("the floor looks almost reflective"). This was always true, including through every prior fix in this saga — it only became visible once the gradient rendering was accurate enough to show what the data actually says.

This is a POC, scoped to `raycaster-p10-finale` only — same pattern as the gradient shading work, no other raycaster demo is touched behaviourally.

## Goal

Give the light model a genuine height dimension: falloff computed as true 3D distance (light position vs. the exact surface height being rendered), live against the light list, rather than baked into a flat 2D grid — opt-in, defaulting to the existing 2D behaviour everywhere it isn't explicitly turned on.

## Architecture

### `RcWorld.bas` — `light:` marker gains an optional height

The `light` marker tag gains an optional height value: `light:1.8` (a fixture at world height 1.8), alongside the existing bare `light` (no colon), which now gets a default height via a new constant, `RcConfig.RC_LIGHT_DEFAULT_Z = 0.85` — just under the standard ceiling (`RC_STD_CEIL = 1.0`), approximating a ceiling-mounted fixture rather than a light embedded in the ceiling surface itself. Parsing follows the exact pattern already used for `floor:`/`ceil:` (`math.val(v)` on the tag's value). A new accessor, `lightHeightAt(col, row)`, exposes it. New per-cell array `lightHArr`, populated alongside the existing `lightArr` in both `applyFlag` (bare `light`, gets the default) and `applyKv` (`light:value`, parses the value). Purely additive: `lightArr`'s existing semantics (a 0/1 flag consumed by `RcLights.bakeStatic()`'s scan) are unchanged, so nothing that already reads `lightAt()` is affected.

### `RcLights.bas` — a live, height-aware sampling path alongside the existing baked one

Two coexisting mechanisms, not a replacement:

- **The existing 2D baked grid** (`staticArr`/`dynArr`, `sampleAt`/`sampleCell`) stays exactly as it is today, for every demo including the finale — `bakeStatic()` still bakes static `light:` cells into it, `update()` still recomputes dynamic lights into it, nothing about this path's inputs, outputs, or callers changes.
- **A new live path**, added alongside it:
  - `bakeStatic()`'s existing scan (which currently only checks `lightAt(lc, lr) > 0` and calls `self.splat(...)`) additionally records each static light's position and height into new parallel arrays — `slxArr`, `slyArr`, `slzArr`, `sliArr` (intensity, from `RcConfig.RC_STATIC_INTENSITY`), `slrArr` (radius, from `RcConfig.RC_LIGHT_RANGE`), `slFalloffArr` (from `RcConfig.RC_FALLOFF_LINEAR`, matching `bakeStatic`'s existing choice) — mirroring the shape of the existing dynamic-light arrays (`lxArr` etc.) but with no "active" flag needed, since static lights never move or get removed.
  - New field `heightAwareOn` (default `0`), new setter `setHeightAware(v)`.
  - New method `sampleAtZ(worldX, worldY, worldZ)`:
    - If `heightAwareOn = 0`: `return self.sampleAt(worldX, worldY)` — byte-identical to today, ignoring `worldZ` entirely.
    - If `heightAwareOn = 1`: start from `self.ambient`, then sum the contribution of every static light (all of them, unconditionally — they're author-placed and bounded in number) and every *active* dynamic light (capped at `RcConfig.RC_LIGHT_CAP`, matching `update()`'s existing dynamic-light cap philosophy — dynamic lights already carry real `z` via the existing `lzArr`, no new data needed there). Each contribution: `dist = sqrt(dx² + dy² + dz²)` where `dz` is the light's height minus `worldZ`, fed into the *same* linear/quadratic falloff formula `splatCell` already uses (`t = 1 - dist/radius`, then `t` or `t²`). Wall occlusion still uses the existing 2D LOS check (`RcCast.los`, direction from the horizontal `dx,dy` only) — walls are vertical, so occlusion itself doesn't need a height term, only the falloff magnitude does. Result clamped 0..1, same as `sampleCell` today.

This is a genuinely different computation strategy for the height-aware path (live, per-query, no discretization) rather than a variation on the existing baked grid — deliberate, since the baked grid only ever stores one final summed scalar per cell, which can't be un-mixed back into per-light distances at query time. The trade this makes: O(lights) work with a wall-occlusion raycast per light, per sample, instead of an O(1) grid lookup. For the finale's ~7 static lights plus a small number of active dynamic ones, and given the explicit "quality over cost" priority for this POC, this is an accepted, stated cost — not an oversight. If it becomes a real problem later, baking two grids (one at a fixed floor reference height, one at a fixed ceiling reference height) remains available as a cheaper, less-accurate fallback, but is not part of this work.

### `RcRender.bas` — one call-site swap, inside an already-gated branch

The gradient-shading branch inside `drawFlatSeg` (added in the previous redesign, gated on `self.gradientShadeOn = 1`) calls `sampleAtZ(x, y, hh)` in place of the two existing `sampleAt(camX + rayX*d, camY + rayY*d)` calls — `hh`, the exact world height of the surface being rendered at that call, is already a parameter of `drawFlatSeg`. Since this branch only ever executes when `gradientShadeOn = 1` (true only for the finale today), this change is risk-free for every other demo regardless of `RcLights.heightAwareOn`'s value — they never reach this code path at all.

### `FinaleScene.bas`

The 7 `light:` markers in `finale.stm` gain real heights (values chosen per-fixture — e.g. higher for the Torch Hall's grander ceiling, lower for a wall-mounted feel where appropriate — an authoring decision made during implementation, not fixed in this spec). `onenter()` calls `self.lights.setHeightAware(1)` alongside the existing `setGradientShading(1)`/`setFlatFill(0)`.

## Testing

- **`RcWorld.bas`**: a test parsing a `light:1.8` marker and a bare `light` marker, asserting `lightHeightAt` returns the parsed value and the default respectively, and that `lightAt` (the existing flag) is unaffected either way.
- **`RcLights.bas`**:
  - `sampleAtZ` with `heightAwareOn = 0` returns exactly `sampleAt`'s value for the same `(x, y)`, regardless of `worldZ` — proves the default is a true no-op.
  - `sampleAtZ` with `heightAwareOn = 1`: a light directly above a query point (`dx = dy = 0`, real vertical offset) reads brighter than the same horizontal point queried at a height *further* from the light — proves the vertical term actually contributes to the falloff magnitude (this is the core "floor vs. ceiling get different values now" guarantee, tested directly rather than inferred).
  - A wall between a light and a query point still fully occludes it in height-aware mode (LOS still works) — proves occlusion wasn't accidentally dropped when the sampling path changed.
  - Static lights baked from `light:` markers contribute to `sampleAtZ` using their real parsed/default height, not a hardcoded one.
- **`RcRender.bas`**: extend the existing `raycasterGradientShading.test.ts`-style harness — with `gradientShadeOn = 1` and `heightAwareOn = 1`, a floor sample directly under a light and a ceiling sample directly above the *same* `(x, y)` at the *same* distance-to-light-horizontally now read different brightness (the direct regression test for "the floor looks reflective").
- Full suite + build + Cypress, as with every prior change in this saga.
- Manual visual re-test — the actual bar, as established: does the light now pool rather than shaft.

## Non-goals for this POC

- No change to any other raycaster demo's behaviour — `RcLights.bas`/`RcWorld.bas`/`RcRender.bas` stay single shared files, byte-identical across all demo copies (synced as always), with the new capability entirely opt-in.
- No per-cell floor/ceiling-height-aware *baking* (the two-fixed-reference-height alternative from brainstorming) — deferred unless the live-query cost proves to be a real problem.
- No change to how dynamic (`addPoint`) lights are declared or moved — they already carry real height; only the sampling path is new.
- No UI/tooling change to the Tilemap Editor for authoring a `light:` marker's height — it's typed directly into the marker's tag text, same as every other tag today.
