# Release Notes

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
