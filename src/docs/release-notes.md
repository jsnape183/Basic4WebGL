# Release Notes

## v0.7.2 — 2026-09-02

### Raycaster library: diagonal walls

- A cell tagged `diag:nw`, `diag:ne`, `diag:se`, or `diag:sw` is now a 45° wall — the named corner is solid, the opposite half is open floor you can walk on. Leave the `walls` tile at `0`; the marker *is* the wall. Line several up for a canted corridor, or put one in each corner of a square room to make it an octagon. Rays, line-of-sight, and player/enemy collision all understand the angled face, and a body slides smoothly along it. Diagonal faces are flat-shaded (no texture yet) and can't also carry a `floor:` / `ceil:` step. New demo: **Raycaster P7 — Diagonal Tiles**.

### Raycaster library: upper regions (a second level per cell)

- A cell can have a second space stacked on top of it — a walkway you glimpse under, a balcony, a room above a lobby. You draw it as its own tile layer named `upper`, top-down like `walls`, with three tile types: solid upper floor, upper wall, and a hole. Raise `ceil:` on the cells under the walkway to set its height; `uceil:3` sets the headroom up there. `RcWorld` picks up the `upper` layer automatically. `RcMover` tracks which level you're on (`me.regionId()`): walk onto a level walkway or climb a staircase onto it and you step up; walk off the edge or into a hole and you fall back down. Current limits — the two levels share one light grid, light and shots don't pass through the hole, and you need authored stairs to climb back up. New demo: **Raycaster P8 — Upper Regions**.

### Raycaster library: renderer rework

- The first-person renderer's occlusion model was rebuilt from a single visible "window" per screen column to a list of visible slices. This is what lets you see the room *below* a walkway and the ceiling *above* it through a hole at the same time — the old model could only show one. Floor and ceiling lighting is now smoothly blended between cells instead of stepping in hard ~1-metre bands (which used to look like shadows of walls that weren't there); walls and sprites are still lit per-cell.

### New: `tilemapset.hasLayer(name)`

- `hasLayer("<layer>")` returns `true` / `false` — check whether a tilemap has an optional layer before reading it (calling `layer()` on a missing layer is an error).

### Tooling

- `npm run build:demo` now assigns deterministic ids, so re-running it doesn't churn the committed demo export files.

## v0.7.1 — 2026-09-02

### New: softBASIC raycaster library

- A set of reusable softBASIC modules for building a first-person, DOOM-style raycaster entirely in game code — no engine changes. `RcWorld` reads a tagged tilemap into a queryable world; `RcCast` marches rays and returns an ordered near→far list of wall / floor-step / ceiling-step spans plus a shared line-of-sight check; `RcRender` draws the first-person view (flat-shaded columns, per-column occlusion, floor/ceiling surfaces, distance + light shading); `RcMover` is a height-aware body with circle-vs-wall collision, step-up, gravity and jumping; `RcLights` is a per-cell light grid with ambient, baked static lights and wall-occluded dynamic point lights; `RcActors` is a billboard pool with depth-clipped sprites and `los` / `hitscan` / `near` ray queries. **45° diagonal-wall tiles** are supported — tag a cell `diag:nw` / `diag:ne` / `diag:se` / `diag:sw` and the named corner becomes a solid 45° face that rays, line-of-sight and the mover all understand (a body slides along it). New in-app guide: **Docs → Building a Raycaster**. The library ships as the unlisted `raycaster-p1`…`raycaster-p7` demos.

### New: tilemap marker and metric accessors

- `tilemapset` gains `allMarkers()` (every marker in the map), `tileWidth()` and `tileHeight()`. A `Marker` now carries `col`, `row` and `tag`, so you can read a marker layer as structured per-cell data instead of only matching by tag.

### Fixes

- **Transpiler: a collection field on a class was shared between all instances of that class.** `dim scores(0)` (or a `dim … as dictionary`) written directly in a class body was created once and attached to the class prototype, so every object of that class read and wrote the *same* array or dictionary — pushing to one enemy's inventory pushed to all of them. Collection fields are now initialised per-instance in the constructor, like every other field. Scalar fields were never affected.
- **Transpiler: `result = thing.doSomething(a, b)` could fail to parse.** A method call *with arguments* on a local object, used inside an expression, broke when one of the argument names matched a zero-argument accessor on that object's class (e.g. passing `x` to a method on a class that also has an `x()` accessor). It now parses correctly.
- **`.stm` and `.json` assets failed to load in some cases** — a tilemap or JSON asset stored without a MIME type made the loader hand back `null`, surfacing later as `Cannot read properties of null (reading 'tileWidth')`. These text assets are now decoded directly rather than relying on the browser/PIXI guessing their type.

### Performance

- The `drawing` module now pools its `Graphics` and `Sprite` objects and caches stripped sub-textures per scene, instead of allocating and destroying them every frame. This also fixes a slow per-frame texture memory leak. Any game that draws shapes or image strips in a loop benefits; games that only move sprites are unaffected.

## v0.7.0 — 2026-08-31

### New: controller / gamepad support

- Games now use an **action map** on `input`: you give each thing the player can do a name — `"jump"`, `"move_left"` — and bind one or more physical inputs to it with `input.bind(action, "key"|"button"|"axis", code)` once at startup, then query the action everywhere else. Keyboard and controller run the exact same game code with no `if keyboard… else if gamepad…` branching. Queries: `input.held` / `input.pressed` / `input.released` (true/false), `input.strength` (0–1, for analog sticks and triggers), `input.axis(negAction, posAction)` (−1..1, two opposing actions as one value). Plus `input.clearBindings` for rebind menus, `input.padConnected()`, and `input.setDeadzone(value)` (default 0.15). Standard-mapping controllers (Xbox, PlayStation, most modern pads) work out of the box; the engine polls the pad at the top of every fixed simulation step and folds it into the same input model the keyboard already uses. `input.getKeyDown` / `keyPressed` / `keyReleased` still work but are deprecated in the docs with migration examples

### New: named constants (`const … endconst`) and a `keyboard` module

- A `const … endconst` block (or single-line `const NAME = value`) declares named constants at the top level of a file. Literals only — numbers, strings, `true`/`false`. Reference them by bare name inside the declaring file or `module.NAME` from another file, exactly like calling a function from another module. Constants can't be reassigned, redeclared, or shadowed by a `dim` / loop variable / function parameter. Names are written in `UPPER_SNAKE_CASE` by convention (softBASIC is case-insensitive, so it's a readability signal, not a rule)
- New `keyboard` module — a pure set of named key codes (`keyboard.SPACE`, `keyboard.LEFT`, `keyboard.A`, `keyboard.DIGIT_0` …) so `input.bind("jump", "key", keyboard.SPACE)` reads clearly instead of `input.bind("jump", "key", 32)`. New `controller` module does the same for gamepad buttons and stick directions (`controller.A`, `controller.DPAD_UP`, `controller.LSTICK_LEFT` …). Both ship in softGfx alongside `input`

### Changed: asset & project storage moved to IndexedDB

- Editor projects and their asset files (images, audio, tilemaps) are now stored in IndexedDB instead of a single `localStorage` slot. That slot was capped at roughly 5 MB per browser, which a modestly-sized project could exceed — the Raycaster demo's audio alone was enough to break saving. Projects can now be tens of MB. Asset binaries are stored as raw bytes, not base64-inflated text. The project export/import format (`.b4wgl.json`) is unchanged — existing exports import identically. In-game `save`/`file` storage is untouched (still per-project `localStorage`, a deliberately separate path)

### Performance

- The four demo project files are no longer bundled into the initial page load — each is fetched on demand when you open that demo. The main app bundle dropped from ~5.5 MB to ~1.7 MB (gzip ~2.7 MB → ~480 kB)

### Raycaster demo

- Migrated to the new action map: keyboard controls are unchanged (WASD move, Q/E strafe, A/D turn, Space fire), and a controller now works too — left stick moves and strafes, right stick turns, right trigger or A fires, all with analog speed scaling

### Fixes

- Fixed the "fullscreen on run" toggle: arming it before clicking Run stopped taking effect after the storage change (the preview iframe now mounts a moment later, once its assets resolve, and the fullscreen request wasn't re-checked at that point)

## v0.6.17 — 2026-08-25

### Fixes

- The editor's live diagnostics/autocomplete rebuild was being torn down and recreated on every re-render of the edit page — cursor moves, tab switches, any unrelated Redux update — not just on real source edits, which could delay diagnostics updates well past the intended debounce window. It's now only rebuilt when the project's files or packages actually change

## v0.6.16 — 2026-08-24

### New: fixed-timestep simulation with interpolated rendering

- The game loop now steps simulation (movement, tile collision, pathfinding, tween) in constant 16.667ms chunks, however many real time actually calls for each rendered frame, instead of applying whatever variable, real-world frame delta the browser happened to hand it that frame. What's drawn on screen is a smooth interpolated blend between the last two simulated positions, not the raw simulated position itself — so a sprite's true position, collision checks, and every other piece of game logic are completely unaffected, but on-screen motion is no longer at the mercy of frame-time jitter (a GC pause, a tab losing focus, a slow frame) showing up as a visible jolt. `sprite.setPosition` keeps working as a movement primitive exactly as tutorials teach it (no unwanted smoothing lag), while an out-of-band jump (spawning, a scene's own `onenter`, a hard teleport) still renders instantly with no smear. `camera.follow` is interpolated along with everything else — `camera.setPosition`'s hard room-cut transitions stay instant

### New: keyframe animation (`tween`)

- New `Keyframe` class and `tween` module: `tween.play(sprite, keyframes, loop)` animates a sprite's angle, scale, alpha, and/or position smoothly across a sequence of `Keyframe`s over time; `tween.stop`/`tween.isPlaying` round it out. Each channel (angle, scaleX, scaleY, alpha, position) is only ever written to the sprite if some keyframe in the sequence actually set it — a tween that only animates rotation, say, never touches position, leaving it free for `setVelocity`-driven movement (or anything else) to keep controlling at the same time

### New: sprite attachment (`attachTo` / `detach`)

- `sprite.attachTo(parent)` and `animatedsprite.attachTo(parent)` reparent one sprite under another using PIXI's own container hierarchy, so the child's position/angle are automatically interpreted relative to its parent — a held weapon, a turret on a vehicle, anything that should move and rotate together with zero hand-computed trig. `detach()` restores it to its original parent

### New: change a tilemap's tiles at runtime (`setTile`)

- `tilemap.setTile(x, y, tileId)` and `tilemaplayer.setTile(x, y, tileId)` change which tile is drawn at a given position while the game is running — a locked door swapping to its open art once a key is collected, a switch flipping a floor tile, breaking open a wall. Pairs naturally with `collision.setTileSolid` for changing both the art and whether a tile blocks movement together

### New: Dungeon Explorer demo

- Added "Dungeon Explorer" to the Demos page — a room-by-room dungeon crawl with a 360° spin-and-swing melee attack, patrol/chase enemy AI with telegraphed attacks and knockback, a boss fight, a key-and-locked-door puzzle, and discrete room-to-room camera transitions instead of continuous scrolling

### Tile Map Editor

- Hovering a tile in the palette now shows its numeric ID in a tooltip, and hovering the map canvas shows the hovered cell's row/column and world x/y in the toolbar — both make it much easier to find the exact coordinates and IDs a script needs to reference

### Fixes

- A sprite's melee-style hit detection (and similar "did this touch that" checks meant to cover a whole swing or window of time, not just one instant) is now far more forgiving of exactly when a moving target enters range, checked continuously rather than only at the single frame an action began
- Fixed a sprite's velocity-driven movement being able to freeze solid while a `tween` was also animating it, even for a channel (like rotation) the tween never touched — `tween` no longer claims channels a keyframe sequence doesn't actually set (see "New: keyframe animation" above)
- Fixed enemy knockback never fully stopping, permanently pinning an enemy against whatever wall it was pushed into
- Fixed a sprite reparented via `attachTo` before it had ever been added to a container failing to detach correctly

## v0.6.15 — 2026-08-15

### New: change collision at runtime

- `collision.setTileSolid(x, y, solid)` lets a game change whether a tile blocks movement while it's running — a tilemap's collision layer is now just the *starting* state. `collision.isTileSolid(x, y)` reads it back, reflecting any changes already made. The classic use case: a locked door tile that becomes passable once the player picks up a key

## v0.6.14 — 2026-08-14

### Fixes

- Fixed kinematic tile collision (`setVelocity` + `collision.setupTileCollision`) breaking entirely for any sprite that rotates or sits under a zoomed/panning camera — the sprite could pass straight through walls, or its movement could stutter as it neared one. The collision check was using the sprite's on-screen bounding box, which grows with rotation and shifts with camera zoom/pan; it now uses the sprite's stable, unrotated size and position instead, matching how the tile grid is measured

## v0.6.13 — 2026-08-14

### New: tile collision layers

- The Tilemap Editor can now paint a dedicated "collision" layer kind, alongside your regular tile layers — a simple solid/not-solid grid, independent from what's rendered. Every collision layer in a tilemap merges automatically, so there's no separate name or list to keep track of

### New: kinematic sprite movement

- `sprite` and `animatedsprite` now support velocity-driven movement: `setVelocity(vx, vy)` sets a sprite's speed in pixels per second, and the engine moves it automatically every frame — no need to update its position by hand
- Call `collision.setupTileCollision(tileMapSet)` once (typically when a level loads) and every sprite using `setVelocity` will automatically slide to a stop against solid tiles instead of passing through them, sliding along a wall approached at an angle rather than stopping dead
- `isBlockedUp()`, `isBlockedDown()`, `isBlockedLeft()`, `isBlockedRight()` report which side (if any) a sprite's movement was stopped on the most recent frame — useful for detecting "standing on the ground" in a platformer or "hit a wall" in any top-down game
- New `math.normalizeX(x, y)` and `math.normalizeY(x, y)` scale a direction vector to length 1, making it easy to keep movement speed the same in every direction, including diagonally

### Updated: Bullet-Hell Shooter demo

- The player's movement now uses the new kinematic movement system instead of hand-rolled collision checks — smoother wall sliding, correctly capped diagonal speed, and one shared source of truth for walls between the player and the enemies' pathfinding

## v0.6.12 — 2026-08-12

### New: layer visibility in the Tilemap Editor

- Every visible layer now composites on screen at once — the layer you're actively painting on shows at full opacity, and every other visible layer is dimmed underneath for reference, so you can see how a spawn marker lines up with the walls beneath it without switching back and forth
- Each layer in the Layers panel gets a hide/show toggle to remove it from view entirely; selecting a hidden layer to edit automatically shows it again

## v0.6.11 — 2026-08-12

### New: export a single tilemap

- The Tilemap Editor now has an **Export** button next to Save, which downloads just the tilemap you're currently editing as a standalone `.stm` file — no need to export the whole project to grab one updated map

### Fixes

- Fixed a white background showing below the first screen's worth of content on pages taller than one viewport (e.g. the Demos page once it had enough demos to scroll)

## v0.6.10 — 2026-08-12

### New demo

- Added "Bullet-Hell Shooter" to the Demos page — a three-level top-down shooter with pathfinding-driven mobs that route around walls to chase the player, weapon pickups placed via tagged tilemap markers, and a persistent best-time leaderboard

### Fixes

- A typed parameter in a `Constructor(...)` signature (`Constructor(x, y, target as sprite)`) — or an array/dict-typed one (`Constructor(items() as Item)`) — now compiles to a real parameter, instead of emitting a JavaScript syntax error (`this.target`/`constructor.items` as the literal parameter name) that only surfaced when the game actually ran in a browser
- A plain `dim` local declared inside a `Constructor(...)` body now compiles to a properly declared variable, instead of an undeclared assignment that threw a runtime error the moment the object was constructed

## v0.6.9 — 2026-08-10

### New: tilemap markers

- The Tilemap Editor can now paint tagged position markers (like "spawn" or "pickup") directly onto a level, as a new kind of layer alongside your regular tile layers. Query them from your game with `tileMapSet.markersByTag(tag)`, which returns every matching marker as an array of `Marker` objects with `x`/`y` positions — perfect for placing enemy spawn points or item pickups visually instead of hardcoding coordinates in code

## v0.6.8 — 2026-08-10

### New: pathfinding

- New `pathfinding` module lets sprites navigate around obstacles instead of moving in a straight line. `pathfinding.setup(tileMapSet, blockingLayers)` builds a navigation grid from whichever layers you flag as solid; `pathfinding.navigateTo(sprite, x, y, speed)` moves a sprite toward a target while routing around walls — safe and cheap to call every frame, even with a moving target like a chasing player. `isNavigating(sprite)` and `stopNavigating(sprite)` round out the API

### New: array literals

- Arrays can now be written inline as `{1, 2, 3}` (or `{"walls", "obstacles"}`) directly in an expression, including as a function-call argument — no need to declare with `dim arr(N)` and build it up with repeated `array.push` calls first

## v0.6.7 — 2026-08-06

### Fixes

- Fixed a typo and a stray character in the message shown for an unexpected internal compiler error

## v0.6.6 — 2026-08-06

### Fixes

- The same fix from v0.6.5 now also applies at the top level of a file — declaring a module-level array/dictionary field with the same name as a module-level function (e.g. `dim items(3)` and `function items()` both outside any class, in the same file) now fails to compile with a clear error instead of crashing at runtime

## v0.6.5 — 2026-08-06

### Fixes

- A class declaring an array or dictionary field with the same name as one of its methods (e.g. `dim items(3)` and `function items()` in the same class) now fails to compile with a clear error, instead of compiling silently and crashing at runtime the first time the member was used. This also applies across inheritance — a subclass field/method colliding with a same-named method/field on a parent class is caught too. Overriding a parent method with a same-named method in a subclass is unaffected

## v0.6.4 — 2026-08-06

### Fixes

- `tilemap`, `animatedsprite`, and `TileMapSet` no longer re-slice their spritesheet into a fresh set of frames on every single object created — instances that share the same image and cell size now reuse the same slices, reducing unnecessary work when spawning many objects off one spritesheet
- Fixed cropping a region with `assetmanager.defineRegion` and passing it into `tilemap`/`animatedsprite` — the resulting tiles/frames were previously sliced from the wrong part of the original image, ignoring where the region itself was cropped from

## v0.6.3 — 2026-08-06

### New: assetmanager.defineRegion

- New `assetmanager.defineRegion(newName, sourceName, x, y, width, height)` — crop a named region out of an already-loaded image (or out of another region you defined earlier) and use it anywhere a filename is expected, including `sprite`, `tilemap`, and `animatedsprite` constructors. Lets a single combined spritesheet (tiles, character frames, icons all in one file) be used as-is instead of requiring it to be manually split into separate files first

## v0.6.2 — 2026-08-05

### New: chained calls on typed array elements through an instance reference

- Chaining a method call onto an element read from another instance's typed array field now works (`ship.bullets(0).getX()`), matching the existing support for `self`'s own typed array fields

## v0.6.1 — 2026-08-05

### New: dictionary and array fields through `self` and instance references

- `self.scores["key"]` now works for reading and writing a class's own dictionary field, alongside the existing array field support
- Array and dictionary fields declared on a class can now be read and written from outside the class through an instance reference (`enemy.hitpoints(0)`, `enemy.flags["stunned"]`)
- Chaining a method call onto an element read from a class's own typed array field now works (`self.bullets(0).getX()`), matching the existing support for plain (non-`self`) typed arrays

### Fixes

- Fixed calling a method with a capital letter in its name (e.g. `.setPosition()`) on an element read out of a typed array or dictionary (`enemies(0).setPosition(x, y)`, `players["Alice"].setPosition(x, y)`) — this previously crashed at runtime with "is not a function" and no compile error, because the call was emitted with its original casing while the method itself is always declared lowercase

## v0.6.0 — 2026-08-05

Closes out Milestone 12 (Tilemap editor).

### New: visual tilemap editor

- Load a tileset image, auto-split by tile width/height, and paint or erase tiles onto a grid with gridlines and a cell hover highlight
- Manage multiple named layers — add, rename, remove, and reorder
- Create new `.stm` tilemap assets directly from the sidebar, and open existing ones into the editor from the file tree
- The "Collect the Coins" demo now uses `.stm`/`TileMapSet` for its level data instead of bare-array `.json`

### Fixes

- Fixed clicking a code file in the sidebar file tree while an asset tab (tilemap, image, audio, or text) was open — it previously left the asset editor showing instead of switching to the code file; switching via the top tab strip already worked correctly

## v0.5.1 — 2026-08-05

### New: oninit and camera zoom

- New `oninit()` — the only lifecycle hook that runs before your assets finish loading, so you can configure the runtime (like pixel-art scaling) before any texture exists
- New `world.setPixelPerfect(true)` — crisp, non-blurry scaling for pixel art; call it from `oninit()`
- New `camera.setZoom(z)` / `camera.zoom()` — magnify the whole world uniformly around the camera, independent of any object's own position or collision

### New: array.sort()

- New `array.sort()` — basic alphanumeric sort, in place

### Fixes

- Fixed calling a method on an object stored in a local variable and using its return value in an expression (e.g. `print string.str(s.width())`) — this previously produced `undefined` at runtime with no compile error
- Fixed reading a class's own array field by index from inside one of its own methods (`self.coins(i)`) — this previously miscompiled into a method call instead of an array lookup, crashing at runtime with no compile error
- Fixed a bug where an object's `onupdate`, `onkeydown`, and `onkeyup` could silently stop being called after removing any object from the world or HUD, or after switching scenes — objects added afterwards were never updated again, and removed objects could keep running invisibly in the background
- Fixed `delta` — the value passed to every `onupdate(delta)` was a frame count instead of milliseconds as documented, making every moving object in every game run about 16x slower than intended

### New demo

- Added "Collect the Coins: A Platformer" to the Demos page — a three-level scrolling platformer showing off scene switching, tilemap levels, hand-rolled tile collision, and a persistent save-based leaderboard

## v0.5.0 — 2026-08-03

Closes out Milestone 3 (public beta readiness — save/load). Your games can now remember things between play sessions.

### File and save storage

- New `file` module — `write(path, content)`, `read(path)`, `exists(path)`, `delete(path)` for saving and loading plain text in the player's browser, persisting between visits
- New `save` module, built on top of `file` — `set(key, value)`, `get(key)`, `exists(key)`, `delete(key)` for saving numbers, strings, arrays, and dictionaries directly, without converting them to text yourself; `setAll(dict)` / `getAll()` save or load a project's entire save data as one dictionary
- Each project's saved data is kept separate automatically — no setup needed

### Fixes

- Fixed `dict.keys`, `dict.values`, and `dict.joinKeys` — documented and implemented, but never actually usable in a real project, since the `dict` module had been left out of the list of modules a project can compile against

## v0.4.3 — 2026-08-02

### Fixes

- Fixed a compiler bug where a plain `dim state` variable that received a dictionary or array back from a function call (e.g. `state = save.getAll()`, `k = dict.keys(scores)`) could not be indexed — `state["key"]` or `k(i)` was a compile error with no workaround, since indexing only worked on a variable declared up front as `dim x[]`/`dim x(N)`, and those couldn't be reassigned from a function's return value either. Both reads and writes now work on such a variable, with a clear error message if the value turns out not to actually be a dictionary or array at runtime.
- `save.md`'s `getAll()` example now reads back a value with direct indexing instead of the `array.length()` workaround it previously needed.

## v0.4.2 — 2026-08-02

### Fixes

- Fixed autocomplete filtering breaking as soon as any prefix was typed — `ship.setSc` would silently fall back to unrelated suggestions instead of showing `setScale`, and bare-word completion (e.g. typing `sco` toward a `score` variable) could surface an unrelated match instead of the intended one. Both bugs only appeared once you typed past the trigger character, which is normal usage. Hover was unaffected.

## v0.4.1 — 2026-08-02

### Fixes

- Fixed autocomplete (and hover/signature help) returning nothing for dot-completion on object instances — `ship.` for a sprite, or any user-defined class instance — instead of the object's actual members. The editor was matching the active file's raw name (`Main.bas`) against the symbol table's normalized scope name (`main`), so the lookup never matched. Static module completions (`string.`) and bare-word completion of globals were unaffected, which is why the break wasn't total.

## v0.4.0 — 2026-08-02

Closes out Milestone 2 (editor intellisense).

### Editor

- New inline error underlining — compile diagnostics now surface live as squiggles in the active file (debounced ~450ms), not just in the bottom console. Console error entries with a location are now clickable, jumping straight to the file and line
- New dynamic symbol resolution — autocomplete, hover, and parameter hints now understand your own functions, classes, and in-scope variables, not just the built-in library API
- Fixed a bug where errors from bare-identifier lookups pointed at the wrong line

## v0.3.4 — 2026-07-31

### Text

- New `text.setFont(fontFamily)` and `text.setAlign(align)` — expose font family and left/center/right alignment, previously only settable via `setStyle(size,r,g,b)` for size and colour

## v0.3.3 — 2026-07-31

### Input

- New `input.keyPressed(keycode)` / `input.keyReleased(keycode)` — frame-synced, edge-triggered checks for one-shot actions like jumping or firing, complementing the existing continuous `input.getKeyDown(keycode)`

### Fixes

- Fixed `onkeydown` firing repeatedly while a key was held (browser key-repeat) instead of once per physical press, as documented

## v0.3.2 — 2026-07-31

### Camera system

- New `camera.shake(intensity, duration)` — jitters the view with a decaying random offset, for impacts, explosions, or damage feedback. A fresh call restarts the effect from full intensity rather than stacking

### Fixes

- Fixed the Raycaster demo failing to build in production (`vite build`) due to a case-mismatched import path

## v0.3.1 — 2026-07-31

### Documentation

- Reconciled `docs/roadmap.md` and `docs/language/library-roadmap.md` with the actual v0.3.0 shipped work — scene management and camera/viewport were still listed as open items after they'd already landed
- Added a required step to `CLAUDE.md`'s feature-completion checklist: roadmap docs must be updated in the same commit as any feature that closes a tracked roadmap item

## v0.3.0 — 2026-06-24

### Scene management

- New `scene` base class — extend it to create named game states (menu, game, game-over) with `onenter`, `onupdate`, `onexit`, `onkeydown`, `onkeyup` lifecycle hooks
- New `scenemanager` module — `register(name, obj)` to add scenes, `switch(name)` to activate one; transitions clear the stage automatically

### Camera system

- New `camera` module — `follow(target, speed)` for smooth or instant tracking, `setPosition(x, y)` to jump the view, `setBounds(width, height)` to clamp against world edges, `x()` / `y()` to read the current position
- Camera position is updated automatically every frame via the scene update loop

### World and HUD layers

- New `world` module — replaces `stage` as the primary layer for game objects that scroll with the camera
- New `hud` module — a separate layer pinned to the screen; HUD objects remain fixed regardless of camera position
- `world.width()`, `world.height()`, `world.setBackground(r, g, b)` provide the canvas utilities previously on `stage`
- `stage.*` is now fully deprecated; all calls continue to work as aliases but new code should use `world.*` and `hud.*`

### animatedsprite additions

- `stop()` — halts playback and clears the active animation name
- `setSpriteSheet(imagePath, frameW, frameH)` — swaps to a different sprite sheet at runtime and resets all defined animations

### Documentation

- Three new advanced concept tutorials: **13. Scenes, World, and HUD**, **14. Camera and Scrolling**, **15. Animated Sprites**
- Tutorial sidebar reorganised into two groups: *Making your first game* (1–12) and *Advanced concepts* (13–15)
- New API reference pages: `world`, `hud`, `camera`
- `stage` API reference page updated to a deprecation table

---

## v0.2.4 — 2026-06-18

### Editor UI polish

- Project card accent stripes now use the pink/magenta palette instead of blue

---

## v0.2.3 — 2026-06-18

### Editor UI polish

- Gradient accent colours from the landing page are now applied consistently throughout the editor, project list, docs, and asset panel

---

## v0.2.2 — 2026-06-18

### Internal cleanup

- Removed the `reorderFiles` Redux action and the `useFilesForProject` hook — both were made obsolete by automatic alphabetical sorting

---

## v0.2.1 — 2026-06-18

### File tree alphabetical sorting

- Files within each folder are now sorted A→Z automatically — no manual ordering needed
- Folders are also sorted A→Z within each nesting level
- Drag-and-drop now only applies to moving files between folders; dragging within the same folder snaps back to alphabetical position

---

## v0.2.0 — 2026-06-18

### Automatic file dependency ordering

- The compiler now resolves file compile order automatically — you no longer need to arrange files manually in the file panel
- Dependencies are detected by scanning for `new ClassName`, `as ClassName`, `ClassName.method()`, and `Extends ClassName` patterns
- Transitive and diamond dependency chains are handled correctly
- Circular dependencies (A depends on B, B depends on A) produce a clear error in the console panel

---

## v0.1.1 — 2026-06-17

### Error tracking

- Integrated Sentry for production error visibility
- React component crashes are captured automatically via the error boundary
- Runtime errors from user games are forwarded to Sentry with the full project source attached, making bugs reproducible from the dashboard

---

## v0.1.0 — 2026-06-17

First stable release of the softBASIC language.

### softBASIC language

- **Classes** — define reusable game objects with `Class / EndClass`
- **Inheritance** — extend built-in types with `Extends sprite`, `Extends text`, etc.
- **Constructors** — initialise objects with `Constructor() / EndConstructor`; call parent with `super()`
- **`self.`** — explicit self-reference required inside class methods
- **Functions** — `function / endfunction` with `return`
- **Control flow** — `if / then / else / endif`, `for / next`
- **Arrays** — `dim arr(N)` declaration, parenthesis indexing `arr(i)`, `array.*` module for operations
- **Dictionaries** — `dim d as dict`, `d["key"]` access
- **Typed variables** — `dim x as MyClass`, `dim sounds as audio("file")`; typed element access for arrays and dicts
- **`new` keyword** — `new MyClass()` to instantiate user-defined classes
- **Multi-file projects** — classes defined in separate files are available across the project

### softCore package

| Module   | Highlights                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `math`   | `floor`, `ceil`, `round`, `abs`, `sqrt`, `sin`, `cos`, `min`, `max`, `clamp`, `random`, `randomint`, `pi` |
| `string` | `str`, `len`, `upper`, `lower`, `substr`, `indexOf`, `trim`, `split`                                      |
| `array`  | `push`, `pop`, `arrLength`, `remove`, `indexOf`                                                           |
| `dict`   | `keys`, `hasKey`, `remove`                                                                                |

### softGfx package

| Module            | Highlights                                                                            |
| ----------------- | ------------------------------------------------------------------------------------- |
| `stage`           | Canvas dimensions, background colour, `add` / `remove` game objects                   |
| `drawing`         | `drawRect`, `drawCircle`, `drawLine`, `drawPoly`, `clear`                             |
| `pen`             | `setFillColor`, `setLineColor`, `setLineWidth`                                        |
| `sprite`          | Load images, position, scale, rotation, flip, alpha, destroy                          |
| `animatedsprite`  | Frame-based animation with `addAnim`, `playAnim`, `stopAnim`                          |
| `text`            | On-screen labels with `setText`, `setStyle`, `setAlpha`                               |
| `tilemap`         | Grid-based tile maps loaded from image strips                                         |
| `input`           | Keyboard (`getKeyDown`, `getKeyUp`) and mouse (`mouseX`, `mouseY`, `getMouseButton`)  |
| `assetmanager`    | Pre-loaded image cache retrieval                                                      |
| `ObjectTransform` | Position, scale, rotation helpers attached to sprites                                 |
| `audio`           | Music loops and one-shot sound effects; `play`, `playLoop`, `stop`, `setVolume`       |
| `collision`       | `spriteCollide`, `boxCollide`, `circleCollide`, `pointInBox`, `raycast`, `raycastAll` |

> **Deprecated:** `gfx.boxCollide(a, b)` is a backward-compatible alias for `collision.spriteCollide(a, b)`. New code should use `collision.spriteCollide`.

### IDE

- Monaco-based code editor with softBASIC syntax highlighting and keyword completion
- Asset panel with image and audio upload, preview, and rename
- Project export and import (JSON bundle)
- In-app console showing `print` output
- In-app documentation: Language Guide, API Reference (softGfx + softCore), and a 12-part beginner tutorial series
