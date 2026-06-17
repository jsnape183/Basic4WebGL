# Release Notes

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
