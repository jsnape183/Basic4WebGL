# Kinematic movement + tile collision — design

Supersedes the parked exploration in `docs/superpowers/specs/2026-08-12-tile-collision-design.md`, which stopped at an unresolved prerequisite question. That question is now resolved — see "Resolved prerequisite" below — and this doc is the actual design.

## Problem

Sprites visibly overlap tilemap walls instead of stopping cleanly (bullet-hell-shooter samples a single point at the sprite's center; coins-platformer hand-rolls several edge-sample points with hardcoded per-sprite margins). Both are fragile, and every author would have to reinvent this correctly — the exact mistake the coins-platformer already shipped once. Root-caused in `docs/superpowers/specs/2026-08-12-tile-collision-design.md`; not repeated here.

## Resolved prerequisite: three movement tiers

Making tile collision genuinely invisible to the author (not a helper you still have to call correctly) requires something to push back against — `setPosition()` teleports, with no notion of "was blocked." Rather than build a full physics engine (deliberately rejected — wrong fit for a beginner-focused, "build games simply" tool, and no physics library is in `package.json` today), softBASIC gets three explicit, coexisting movement tiers:

1. **`setPosition`** — exactly as today. No added complexity, collision entirely the author's own responsibility if they use it.
2. **Kinematic (this design)** — `setVelocity(vx, vy)`; the engine applies it every frame and clips against solid tiles. More capable, still simple: no mass, no forces, no impulses.
3. **Rigid body** — full physics (mass, forces, impulses, sprite-vs-sprite dynamic response). **Explicitly parked, not designed, not part of this doc.** Sprite-vs-sprite kinematic collision *response* (two moving sprites blocking/pushing each other) is real future work in this same direction, but needs a collision-mask/category concept first (which sprites should collide with which) — out of scope here to keep this increment focused.

These are independent and coexist: a sprite that never calls `setVelocity` behaves exactly as it does today, unaffected by any of this.

## Component 1: Collision layer (Tilemap Editor + `.stm` format)

A new layer kind, `'collision'`, alongside today's `'tile'` and `'marker'`. Painted with a single "solid" brush — boolean per cell, no tile art.

**On-disk format:** `{type: 'collision', data: number[][]}` (nonzero = solid) — its own distinct shape, **not** a bare array. This matters: the current `.stm` loader (`tilemap.js`) treats *any* bare `number[][]` as a tile-art layer (`frames[id-1]` rendered as a real sprite per nonzero cell) and *any* non-array value as a marker layer (`{type: 'markers', ...}`). A collision layer reusing the bare-array shape would render as phantom tile art. Mirrors how marker layers already opted out of the bare-array default the same way.

**Runtime loading (`tilemap.js`):** the layer-parsing loop gains a third branch for `type === 'collision'` — stores the grid the same way a tile layer's `_map` is stored (so it's readable by grid position) but creates **no PIXI children** — data-only, never rendered. Storing it the same way a tile layer stores `_map` is deliberate: it means the identical layer can be handed to `pathfinding.setup(tileMapSet, [layerName])` as a blocking layer with **zero changes to pathfinding** — that code already treats "any non-zero cell in a named layer" as blocking, and doesn't care how the layer was authored.

**Which layer(s) are "the" collision source:** implicit, not named. Every layer of kind `'collision'` in a given `TileMapSet` is merged (OR'd) into one solid-cell grid automatically — no layer-name parameter, no chance to typo one. A collision layer is unambiguous by construction (its only purpose is being collision data), so there's nothing to disambiguate. (Explicitly deferred: tooling to auto-build a collision layer from N existing layers — a second-iteration convenience, not this increment.)

**Editor UI:** `LayersPanel` gains a third "add" option alongside "+layer"/"+tag" (e.g. "+collision"). Painting reuses the existing grid/paint-drag mechanism (`usePaintDrag`, already generic over cell coordinates) with a single-brush "solid" tool instead of a tile palette — closer to the marker layer's UI (one paintable state) than the tile layer's UI (many tile choices).

## Component 2: Kinematic movement (runtime)

**API:** `self.setVelocity(vx, vy)`, `self.velocityX()`, `self.velocityY()` on `sprite`. Also added to `animatedsprite` — it is **not** `Extends sprite` in this codebase (a fully separate hand-written class with its own `_handle`), so these land on both `.bas` files independently. The underlying engine logic (velocity storage, applying it, resolving against solid tiles) is shared and keyed off the PIXI `_handle` itself, not which softBASIC class wraps it — no duplicated engine logic, just duplicated thin method wrappers.

**Per-frame application:** hooks into the existing central `_update(delta)` dispatch in `lifecycle.js`, which already calls every instance's `onupdate` each frame. Immediately after an instance's own `onupdate` runs, if it has non-zero velocity, the engine applies `velocity * dt` to its position. No new per-frame call for the author — `setVelocity` once (or whenever velocity changes) is enough. Sprites that never call `setVelocity` are completely unaffected (velocity defaults to zero — a no-op add).

**Collision resolution:** if `collision.setupTileCollision(tileMapSet)` has been called (anywhere, any time before movement is applied — typically a scene's `onenter()`, mirroring how `pathfinding.setup` is already called there), every velocity-driven sprite automatically clips against the merged solid-cell grid from Component 1. Resolution is **axis-separated**: X moves and clips first, then Y moves and clips independently, using the sprite's own rendered width/height (read via `getBounds()`, same as `collision.spriteCollide` already does — no extra size parameters needed from the author). Axis separation gives "sliding along a wall" for free — a sprite moving diagonally into a wall continues along the unblocked axis rather than stopping dead — the same technique both existing demos already hand-roll, now built in.

Only one tile-collision map is active at a time (mirrors `pathfinding.setup`'s existing single-map model) — a multi-scene game calls `setupTileCollision` again in each scene's `onenter()`, exactly like `pathfinding.setup` already is in bullet-hell-shooter today.

**Blocked feedback:** `self.isBlockedUp()`, `isBlockedDown()`, `isBlockedLeft()`, `isBlockedRight()` — reflect the last-resolved frame's clipping, readable any time afterward. Deliberately genre-neutral (not Godot's `is_on_floor()`/`is_on_wall()`/`is_on_ceiling()`, which assume platformer gravity-down orientation and don't fit a top-down shooter). Platformer "grounded" becomes `isBlockedDown()` while falling; bullet-hell "hit a wall" becomes any of the four being true.

**Deliberately not built in:** gravity, friction, acceleration curves. Velocity is applied exactly as set; an author wanting gravity still writes `self.setVelocity(self.velocityX(), self.velocityY() + gravity * dt)` in their own `onupdate` — same shape as today's hand-rolled `self.vy = self.vy + 400 * dt`, just building on top of the new primitive instead of raw position math.

## Out of scope (explicitly)

- Rigid-body / full physics (mass, forces, impulses) — tier 3, parked.
- Sprite-vs-sprite kinematic collision *response* (two moving sprites blocking each other) — needs a collision-mask/category concept first; `collision.spriteCollide()` (report-only) is unaffected and still the tool for this today.
- Pixel-perfect / shaped collision masks beyond per-cell solid/not-solid.
- Tooling to auto-derive a collision layer from existing tile layers.
- Multiple simultaneous active tile-collision maps.

## Files touched (implementation-plan-level detail, not exhaustive)

- `src/components/TileMapEditor/types.ts` — `EditorLayer` union gains `kind: 'collision'`.
- `src/components/TileMapEditor/index.tsx` — `decodeStmContent`/`exportStmDoc` handle the new `{type: 'collision', ...}` shape; `LayersPanel` wiring for the new add-layer option.
- `src/components/TileMapEditor/LayersPanel.tsx` — third add-layer control.
- A collision-layer canvas/paint component (new, or an adapted `MarkerCanvas`-style single-brush grid).
- `src/components/Runner/engine/tilemap.js` — loader's third branch for `type: 'collision'`.
- `src/components/Runner/engine/collision.js` — `setupTileCollision`, internal solid-grid storage, axis-separated resolve step.
- `src/components/Runner/engine/lifecycle.js` — hook into `_update(delta)` to apply velocity + resolve collision per instance after `onupdate`.
- `src/lib/Basic4WebGL/defs/collision.bas` — `setupTileCollision` def.
- `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts` (+ regenerate `sprite.bas`) — `setVelocity`/`velocityX`/`velocityY`/`isBlockedUp/Down/Left/Right`.
- `src/lib/Basic4WebGL/defs/animatedsprite.bas` — same methods, hand-added (not descriptor-generated).
- Docs: `src/docs/api-reference/` entries for the new sprite/animatedsprite methods and `collision.setupTileCollision`; Tilemap Editor guide update for the collision layer kind.

## Testing

- Vitest: `.stm` encode/decode round-trip for the new collision layer shape (mirrors existing `stmCodec.test.ts` coverage for marker layers); `tilemap.js` loader test confirming a collision layer produces no PIXI children but is readable by grid position (mirrors existing `tests/components/Runner/tilemap.test.ts`); a new engine test file for velocity application and axis-separated resolution (zero-velocity sprites unaffected; sprites unaffected when `setupTileCollision` was never called; sliding behavior on diagonal approach; all four `isBlocked*` directions independently correct); transpiler unit tests for the new `.bas` method signatures (matching the existing per-module convention in `tests/lib/Basic4WebGL/unit/transpiler/`); `LayersPanel`/`TileMapEditor` component tests for the new add-collision-layer control.
- Cypress: this is real per-frame runtime movement and collision behavior — the exact category of bug (`delta` units, instance-update dispatch) this project's own history shows Vitest's transpiler-output-only checks cannot catch. A new e2e spec should drive an actual sprite with velocity into an actual solid tile in a real browser and assert final position/blocked-state, not just "no `ERR`."

## Sequencing note (for the implementation plan)

Component 1 (collision layer) is independently shippable and testable before Component 2 exists — it's a real editor feature and `pathfinding.setup` can already consume it, on its own, immediately. Component 2 depends on Component 1 existing. The implementation plan should build and verify Component 1 first as a checkpoint, then layer Component 2 on top, rather than attempting both simultaneously.
