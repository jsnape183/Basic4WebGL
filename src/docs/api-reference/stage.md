# stage (deprecated)

> **Deprecated:** All `stage.*` functions are deprecated. Use `world` instead for all of them. See the [world](world) and [hud](hud) API reference pages.

| Deprecated call | Use instead |
|-----------------|-------------|
| `stage.add(obj)` | `world.add(obj)` |
| `stage.remove(obj)` | `world.remove(obj)` |
| `stage.clear()` | `world.clear()` |
| `stage.width()` | `world.width()` |
| `stage.height()` | `world.height()` |
| `stage.setBackground(r, g, b)` | `world.setBackground(r, g, b)` |

All deprecated calls continue to work — existing programs do not need to change — but new code should use `world.*`.
