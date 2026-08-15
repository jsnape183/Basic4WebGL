# Zelda-style adventure demo — design

## Concept

A new demo showcasing **discrete room-to-room exploration** — a mechanic none of the existing three demos (Wolfenstein-style raycaster, Collect the Coins platformer, Bullet-Hell Shooter) demonstrate. Structure: explore an overworld of connected rooms, fight a handful of regular enemies along the way, find a key, unlock a locked door, defeat a boss in the gated final room to win.

This also motivates one small, well-scoped addition to the already-shipped kinematic movement/collision system: the ability to toggle a tile's solidity at runtime, needed for the locked door to actually open.

## New engine feature: runtime collision toggling

**Problem:** `collision.setupTileCollision(tileMapSet)` bakes a merged solid-cell grid once, from every `'collision'`-kind layer in the tilemap, and stores it as the `collision` module's own singleton active-grid state (mirroring `pathfinding.setup`'s existing `_navGrid` state — only one tilemap's collision can be active at a time, an existing, accepted constraint carried over unchanged). There is currently no way to flip a single cell's solidity after that — needed for "this door tile is solid until the player has the key, then it isn't."

**API — two new module-level functions, added to `collision` (not `tilemapset`)**, because they must mutate the *already-merged* active grid `_applyKinematics` reads every frame, not a tilemap's raw per-layer data (mutating raw layer data wouldn't affect movement unless `setupTileCollision` were re-run, defeating the purpose of a cheap toggle):

```bas
collision.setTileSolid(x, y, solid)
```
Flips the solidity of whichever cell of the *active* collision grid the world position `(x, y)` falls in. `solid` is `true`/`false`. Throws (matching `pathfinding.navigateTo`'s existing "call setup first" pattern) if `collision.setupTileCollision` hasn't been called yet.

```bas
collision.isTileSolid(x, y)
```
Returns `true`/`false` for whichever cell `(x, y)` falls in, reading the *active* grid (so it reflects any prior `setTileSolid` calls — this is why it can't just be `tileMapSet.tileAt("collision", x, y)`, which only ever reads the original static `.stm` data). Same "call setup first" error if there's no active grid.

**Implementation sketch** (engine side, `src/components/Runner/engine/collision.js`): both functions convert `(x, y)` to `(row, col)` using the exact same world→grid math `_resolveAxis` already performs via `_tileGridOffset(grid.reference)` and `grid.tileW`/`grid.tileH` — no new coordinate-conversion logic, just the existing helper reused. `setTileSolid` writes directly into `grid.solid[row * grid.cols + col]`; `isTileSolid` delegates to the already-existing `_isSolidCell(grid, row, col)`.

This goes through the full six-step "Adding a new language feature" process from `CLAUDE.md`: engine JS (above), `.bas` def additions to `collision.bas` (hand-written, not descriptor-generated — same as `setupTileCollision` itself), Vitest unit tests for both functions (grid mutation, out-of-range handling, the "no active grid" error), API reference docs (`src/docs/api-reference/collision.md`), and a roadmap note once shipped.

## Map & room transitions

One `.stm` tilemap for the whole overworld, divided into a grid of fixed-size rooms (exact tile dimensions decided during build — generous enough to comfortably fill a typical preview/fullscreen view; exact edge-of-room visibility will vary slightly with window size since the canvas fills whatever container it's in, same as every other demo — an accepted simplification, not a pixel-perfect fixed-resolution game).

"Current room" is computed every frame as `floor(player position / room size)`. When it changes from the previous frame, the game calls `camera.setPosition(roomOriginX, roomOriginY)` — already instant, no new camera code needed. No panning or scroll animation; this is a deliberate hard-cut, matching classic Zelda 1's screen-to-screen feel (the option explicitly chosen over continuous scrolling during design).

Walls between rooms, obstacles, and the locked door are all just tiles on the same shared `'collision'` layer, painted once in the Tilemap Editor exactly like any other collision layer — no new authoring workflow.

## Combat

Facing-direction melee, not mouse-aim (unlike Bullet-Hell Shooter) — the player faces whichever direction they last moved. An attack key triggers a brief hitbox check one tile in front of the player, using `collision.boxCollide` against nearby enemies (no projectile sprite spawned, unlike Bullet-Hell's bullets).

**Regular enemies:** scattered across the non-boss rooms, chase the player via `pathfinding.navigateTo` and deal contact damage — the same pattern already proven in Bullet-Hell Shooter's `Mob.bas`.

**Boss:** same enemy shape, more HP, a simple periodic attack (e.g. a short lunge toward the player), fought alone in the room the locked door gates.

## Keys, doors, and the win condition

- The key is a marker-placed pickup (same pattern as Bullet-Hell's weapon pickups — `tileMapSet.markersByTag`), likely positioned behind or near one of the regular-enemy encounters.
- The locked door is a tile on the collision layer, solid by default in the `.stm` file. Picking up the key calls `collision.setTileSolid(doorX, doorY, false)` to open it — this is the feature this whole design exists to support.
- Defeating the boss wins the game (reuses the existing `WinScene`-style pattern from other demos).
- Player death (HP reaches 0) reuses the existing `GameOverScene`-style pattern.

## HUD

A hearts-based HP display, adapted from Bullet-Hell Shooter's health bar pattern.

## Out of scope for v1 (explicitly, not forgotten)

- NPC dialogue / text-box interaction.
- Pushable-block puzzles.
- Multiple keys, multiple dungeons, or any multi-key gating.
- Relaxing the "one active tilemap's collision at a time" constraint — confirmed during design discussion as fine to keep as-is; this demo only ever has one tilemap active regardless.

## Testing

- The new `collision.setTileSolid`/`isTileSolid` functions get Vitest unit tests (engine-level, mirroring `setupTileCollision`'s existing test file) and transpiler tests (mirroring `collision.bas`'s existing test file), following the same TDD + two-stage-review discipline used for every engine addition this session.
- The demo itself follows `docs/demo-authoring-guide.md`'s mandatory production checklist in full: `.b4wgl.json` verified with zero console `ERR`, a `.md` write-up, a `demoRegistry.ts` entry, a `docs/manifest.ts` nav entry, and a `cypress/e2e/demos.cy.ts` `describe` block — none of these are optional.
