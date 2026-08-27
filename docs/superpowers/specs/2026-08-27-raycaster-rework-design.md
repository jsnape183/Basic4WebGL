# Raycaster Demo Rework — Design

## Goal

Fix a real rendering bug in the enemy sprite, and grow the Raycaster demo from a small single-room tech demo into a proper explorable game: a procedurally generated 32×32 maze, a start screen, and four patrolling/chasing enemies — while migrating it onto this project's standard demo-authoring workflow (`demo-src/` + `scripts/buildDemo.ts`) so it's maintained the same way as the other three demos.

This is scoped as one combined rework with four clearly separated pieces, built and verified together since they touch the same files.

## Background

Raycaster currently lives only as a hand-assembled `src/docs/demos/Raycaster.b4wgl.json` with a single `Main.bas` file — the only demo in this project not built via either the live-app-export workflow or `demo-src/` + `buildDemo.ts`. It has no `scenemanager`/`Extends scene` usage at all (unlike the other three demos): `Main.bas` is one flat script whose `onenter()`/`onupdate()` run the entire game directly. The map is an 8×8 grid (`cells(64)`), one open room with a solid border and two interior pillars. There is exactly one enemy, homing directly toward the player with simple per-axis wall collision (no patrol state, no pathfinding).

## 1. Enemy sprite rendering fix

**Root cause (confirmed via simulation against the real `enemy.png`):** `renderEnemy()` computes `spriteH = floor(SH / transformY)` — a real screen-pixel height — and reuses that same value as `spriteW` for a square billboard. `drawLeft`/`drawRight`/`texCol`, however, are computed in the same units as `spriteScreenX` and the wall-casting loop's `col` — **ray-column indices**, not screen pixels. Each ray-column is `STRIP` (4) screen pixels wide. Using the pixel-scale `spriteW` directly as a column-index delta makes the enemy's actual on-screen width 4× too wide relative to its height, at every distance — the stretched, splayed-out look.

**Fix:** convert to column units before using it for the loop bounds and texture-column math:

```bas
spriteWCols = spriteW / STRIP
drawLeft = math.floor(spriteScreenX - spriteWCols / 2)
drawRight = math.floor(spriteScreenX + spriteWCols / 2)
' ...
texCol = math.floor((sc - drawLeft) * ENIW / spriteWCols)
```

`destHeight` (still `spriteH`, real pixels) and each strip's `destWidth` (still `STRIP`) are unchanged — only the *number* of columns iterated and the texture-column mapping change. Verified this produces a correctly-proportioned (square) billboard via an offline simulation of the exact algorithm against the real asset.

This fix applies equally to every enemy once there are several (Section 4) — it's a property of the billboard math, not per-instance state.

## 2. Build workflow + file structure

Migrate to `demo-src/raycaster/` + `npm run build:demo -- demo-src/raycaster Raycaster`, per `docs/demo-authoring-guide.md` Path B (small enough to hand-write directly). Adding a real start screen means adopting the `scenemanager`/`Extends scene` pattern the other three demos already use, which means splitting into multiple files:

- **`Main.bas`** — `oninit()`, registers `"title"` and `"game"` scenes, switches to `"title"`. Mirrors every other demo's `Main.bas`.
- **`TitleScene.bas`** (`Class Extends scene`) — draws the game title, a controls reminder (WASD to move, Space to fire), and a "press any key to start" prompt; any keypress switches to `"game"`.
- **`MazeGrid.bas`** (plain module, no `Class`) — owns the `cells()` flat array and `mapW`, the recursive-backtracker maze generator, and `getCell(mx, my)`. Both `GameScene` and `Enemy` depend on this rather than keeping their own copies of grid state.
- **`Enemy.bas`** (plain `Class`, no `Extends` — same shape as Coins Platformer's `GameData.bas`) — one enemy's position, patrol/chase state, and movement (Section 4). Not a `sprite`/`animatedsprite` — Raycaster has no `world`, enemies are billboard-projected and drawn via `drawing.drawImageStrip` directly, the same as today's single enemy.
- **`GameScene.bas`** (`Class Extends scene`) — everything currently in `Main.bas`'s game loop: casting, HUD, particles (already `hud`-based per the prior particle-effects work), and now an `enemies()` array of `Enemy` instances instead of one fixed set of fields. All current top-level `dim`s become `self.` fields; all current top-level functions become `self.` methods.

Game-over stays exactly as it is today — an inline text overlay drawn in place when `playerHealth < 1`, not a separate scene. Only a start screen was asked for; no `GameOverScene`/`WinScene` is being added.

`src/docs/demos/raycaster.md` gets rewritten to match this project's other multi-file demo docs (a `## <File>.bas` section per file, in the same style as `dungeon-explorer.md`) rather than its current single-file-demo template. `demoRegistry.ts`'s description and `docs/manifest.ts` entry get updated to match (no longer "a single-file demo").

## 3. Bigger map: 32×32 procedurally generated maze

`mazegrid.generate()` runs a recursive-backtracker maze generation algorithm at `onenter()` — carve a spanning tree of 1-cell-wide corridors through a 32×32 grid of initially-all-solid cells, starting from a random cell, using randomized DFS with backtracking. This produces a "perfect maze" (exactly one path between any two open cells, fully connected, no isolated pockets) — which matters directly for Section 4, since it guarantees every spawn point chosen from an open cell is reachable from every other.

Generated fresh every time the game scene is entered (no fixed seed) — a different maze each playthrough. The player spawns at a fixed corner of the generated maze; each `Enemy` spawns at a randomly chosen open cell, re-rolled if too close to the player's spawn (so nobody spawns in melee range).

## 4. Four enemies with patrol + chase

Each `Enemy` instance carries its own `x`, `y`, `hp`, `state` ("patrol"/"chase"), a patrol target cell, `chaseRadius`/`giveUpRadius`, and a knockback/hit-flash timer — the same shape as Dungeon Explorer's `Enemy.bas` state machine (patrol → chase within `chaseRadius` → give up and return to patrol beyond `giveUpRadius`), adapted to this demo's own movement model instead of `pathfinding.navigateTo`.

**Why not the engine's real `pathfinding` module:** `pathfinding.setupNavGrid` requires a genuine `TileMapSet` instance and reads real tile-layer data (`_handle._layerContainers`, `._map` arrays) — there's no raw-grid entry point. Raycaster has no visual tilemap at all (walls are raycasted textures, not tiles); wiring up real pathfinding would mean building a whole parallel, invisible `TileMapSet` purely to satisfy that API. Given the user's own plan to test-and-tune enemy count/behavior rather than commit to a heavyweight system up front, this is deferred — see Open Questions.

**Movement instead:** each `Enemy.update(dt, playerX, playerY)`:
- **Patrol:** walks toward a patrol target chosen from a *nearby* open cell (checked via `mazegrid.getCell`), using the same per-axis-independent wall collision the current single enemy already uses (try X move, check `getCell`, try Y move, check `getCell`). A patrol timer re-picks the target periodically, which both gives natural wandering and unsticks anything that ends up wedged against a wall or dead-end.
- **Chase:** once within `chaseRadius` of the player, walks directly toward the player's exact position using the same per-axis collision. Since chase targets can be far across the maze (unlike patrol's nearby targets), a chasing enemy *can* get momentarily stuck rounding a corner it can't take in a straight line — an accepted, disclosed limitation of this lighter-weight approach, not a bug to chase down before shipping v1.
- Contact damage and the give-up-radius return-to-patrol logic mirror Dungeon Explorer's `Enemy.hit()`/`onupdate()` shape directly.

**Rendering and hit detection** in `GameScene` change from "the one enemy" to "loop over `enemies()`":
- Each frame, project every alive enemy to its billboard screen position/`transformY`, exactly as today's single-enemy `renderEnemy()` does.
- Sort by `transformY` descending (farthest first) before drawing, so nearer enemies paint over farther ones and the z-buffer occlusion against walls still applies per-column, per-enemy.
- `checkHit()` checks the centre aim column against every enemy's projected position, and resolves a hit against whichever candidate is both within the aim tolerance and closest to the camera (mirrors the current single-target check, generalized to "closest valid target" instead of "the fixed one").

## Testing

- `demo-src/raycaster/` gets built via `npm run build:demo -- demo-src/raycaster Raycaster`, then loaded and run in the browser per this project's established live-verification workflow (synthetic `KeyboardEvent`s + manually driving `app.ticker.update`, since real clicks/focus into the nested game iframe are unreliable in this sandboxed browser) — confirming: the title screen appears and a keypress starts the game; the maze generates as a fully-connected, gapless grid of corridors; all four enemies patrol, chase within radius, and are individually hittable/killable; the enemy sprite renders square (not stretched) at multiple distances; particles (muzzle flash / hit / death, from the prior particle-effects work) still fire correctly with multiple simultaneous enemies.
- Full suite: `npx vitest run`, `npx vite build` (never `tsc --noEmit`, per `CLAUDE.md`), and `cypress/e2e/demos.cy.ts`'s existing Raycaster `describe` block (needs its `runDemo` call point at the new build output — same file path, so no change expected there beyond the source having changed).
- Docs (`raycaster.md`'s embedded per-file source listings) verified byte-for-byte in sync with `demo-src/raycaster/*.bas`, per this project's established doc-sync convention.

## Open Questions / Deferred

- **Enemy count is a starting point, not final.** The user's own plan: ship 4, playtest, then adjust up or down based on how the maze feels. Not a fixed requirement.
- **Real `pathfinding` integration is explicitly deferred**, not rejected — if the simple movement's occasional corner-stuck behavior feels bad in playtesting, building a proper invisible `TileMapSet` bridge (or a custom lightweight A* directly over `MazeGrid`'s own array, avoiding the `TileMapSet` requirement entirely) is a reasonable follow-up, but is out of scope for this pass.
- **Sprite anchoring**: a separate, already-completed piece of work (commit `c72f423`) made `sprite` centre-anchored engine-wide and already recomputed Raycaster's `weaponSprite`/muzzle-flash offsets for it. This rework builds on top of that — no anchor-related changes are needed here, but the new `Enemy` billboard math (Section 1) and multi-enemy code (Section 4) should be written against the current (fixed) anchor behavior from the start, not the old top-left assumption.
