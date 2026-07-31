# Release Notes

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
