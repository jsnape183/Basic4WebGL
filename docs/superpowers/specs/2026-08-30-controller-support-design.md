# Controller Support — Design

**Date:** 2026-08-30
**Status:** Approved, ready for implementation plan
**Related:** `2026-08-30-softbasic-constants-design.md` (separate spec — named `PAD_*` / axis constants will land once the constant mechanism exists; this spec uses raw integers)

## Problem

softBASIC games can only read the keyboard and mouse (`input.getKeyDown`, `input.keyPressed`, `input.keyReleased`, `input.mouseX/Y/Down`). There is no gamepad support, and every key is queried by raw keycode. Adding controllers by having each game write `if keyboard ... else if gamepad ...` branches everywhere would be miserable.

## Solution overview

An **action map**. Game code binds named actions (`"jump"`, `"move_left"`) to one or more physical inputs, then queries actions — never physical inputs. Keyboard and controller become interchangeable with zero branching in game logic. Model follows Godot's input map: the map only stores sources; the *query function* chooses how to represent them (bool vs. 0..1 vs. −1..1).

The browser Gamepad API is poll-based: each frame the engine calls `navigator.getGamepads()`, reads a fresh snapshot, and folds it into the same "keys down / just-pressed / just-released" tables the keyboard already uses. After polling, the query functions don't care where an input came from.

We rely on the W3C **standard gamepad mapping** (`gamepad.mapping === "standard"`), which Chrome/Edge/Firefox apply to Xbox, PlayStation, and most modern controllers. Non-standard controllers degrade gracefully — bindings simply won't match; documented as a known limitation.

## softBASIC API

`input.bas` is hand-written (not descriptor-generated), edited directly.

### New functions

```
input.bind(action, device, code)     ' device: "key" | "button" | "axis"
input.clearBindings(action)           ' remove all bindings for an action (rebind menus)

input.held(action)                    ' true every frame while active
input.pressed(action)                 ' true only on the activation edge
input.released(action)                ' true only on the release edge
input.strength(action)                ' 0..1 float — analog magnitude (0/1 for digital sources)
input.axis(negAction, posAction)      ' -1..1 float — strength(posAction) - strength(negAction)

input.padConnected()                  ' true if at least one gamepad is present
input.setDeadzone(value)              ' analog rest-zone, default 0.15
```

### `code` values by device

**`device = "key"`** — a numeric keycode, exactly as today (37 = left arrow, 32 = space, 65–90 = A–Z, …). Existing keycode docs table is reused.

**`device = "button"`** — a standard-mapping button index:

| Code | Button | Code | Button |
|---|---|---|---|
| 0 | A / ✕ | 8 | Back / Select |
| 1 | B / ○ | 9 | Start |
| 2 | X / □ | 10 | Left stick click |
| 3 | Y / △ | 11 | Right stick click |
| 4 | Left shoulder | 12 | D-pad up |
| 5 | Right shoulder | 13 | D-pad down |
| 6 | Left trigger | 14 | D-pad left |
| 7 | Right trigger | 15 | D-pad right |
|   |   | 16 | Guide / Home |

Triggers (6, 7) are buttons that also carry a 0..1 analog value — usable digitally via `held`/`pressed`, or as magnitude via `strength`.

**`device = "axis"`** — a stick **half-direction** (a one-way 0..1 signal derived from the raw −1..1 stick axis):

| Code | Direction | Code | Direction |
|---|---|---|---|
| 0 | Left stick — left  | 4 | Right stick — left  |
| 1 | Left stick — right | 5 | Right stick — right |
| 2 | Left stick — up    | 6 | Right stick — up    |
| 3 | Left stick — down  | 7 | Right stick — down  |

### Example

```bas
function oncreate()
  input.bind("move_left",  "key", 37)
  input.bind("move_left",  "axis", 0)      ' left stick left
  input.bind("move_right", "key", 39)
  input.bind("move_right", "axis", 1)      ' left stick right
  input.bind("jump", "key", 32)
  input.bind("jump", "button", 0)          ' A
  input.bind("fire", "button", 7)          ' right trigger
endfunction

function onupdate(delta)
  dim move
  move = input.axis("move_left", "move_right")   ' -1..1, stick or keys
  self.transform.setPosition(self.transform.x() + move * 5, self.transform.y())

  if input.pressed("jump") then self.jump() endif
  if input.held("fire") then self.shoot(input.strength("fire")) endif
endfunction
```

### Deprecated (kept working)

`input.getKeyDown`, `input.keyPressed`, `input.keyReleased` — marked deprecated in docs with a migration note. `input.mouseX`, `input.mouseY`, `input.mouseDown` are unchanged and not deprecated.

## Engine (`src/components/Runner/engine/input.js`)

New state on `_sbInput`:

- `_actions` — `{ actionName: [ {device, code}, ... ] }`
- `_deadzone` (default `0.15`), `_axisThreshold` (fixed `0.5` for analog→digital crossover)
- `_padButtons` — current frame `[{pressed, value}]`
- `_padButtonsPrev` — previous poll, for edge detection
- `_padAxisHalves` — 8 deadzoned 0..1 strengths derived from raw axes
- `_padAxisHalvesPrev`
- `_padConnected` — bool

New methods:

- `bind(action, device, code)` — push `{device, code}` onto `_actions[action]` (create list if absent). Throws a clear error on an unknown `device` string.
- `clearBindings(action)` — `_actions[action] = []`.
- `_pollGamepads()` — read `navigator.getGamepads()`; pick the first non-null pad. Copy button `{pressed, value}`. For each stick axis, split raw value `v` into `neg = clamp(-v - deadzone, 0, 1) / (1 - deadzone)` and `pos = clamp(v - deadzone, 0, 1) / (1 - deadzone)` (rescaled so the signal starts at 0 at the deadzone edge and reaches 1 at full deflection). Diff against `*Prev` to feed the existing `_justPressed`/`_justReleased` model, keyed in a **separate namespace** from keycodes (e.g. string keys `"b0"`, `"h3"`) so keyboard keycodes never collide. Update `_padConnected`.
- `setDeadzone(value)` — clamp to `[0, 0.9]`, store.
- `padConnected()` — return `_padConnected`.
- Resolution helpers used by the query functions — for a given action, iterate `_actions[action]` and:
  - **digital** (`held`/`pressed`/`released`): OR across sources. A `"key"` source reads the keyboard tables. A `"button"` source reads `_padButtons[code].pressed`. An `"axis"` source is active when its half-strength ≥ `_axisThreshold`; edges are derived from the half-strength crossing the threshold (one `pressed`, one `released`, not per-frame repeats).
  - **`strength(action)`**: max across sources — `1`/`0` for keys and digital buttons, `_padButtons[code].value` for buttons, half-strength for axis sources.
  - **`axis(neg, pos)`**: `strength(pos) - strength(neg)`, clamped to `[-1, 1]`.

Poll timing: `_sbInput._pollGamepads()` is called at the **top of `_fixedStep`** in `engine/scene.js` (before `_sbLifecycle._update`), so action state is current for `onupdate`. `_resetFrameInput()` stays at the end of `_fixedStep` and is extended to also roll `_padButtons → _padButtonsPrev` and `_padAxisHalves → _padAxisHalvesPrev`, and clear the pad edge entries. If `_fixedStep` runs multiple times in one rendered frame, later polls in the same frame see unchanged pad state and produce no spurious edges; if it runs zero times, no poll happens.

## Bootstrapper (`src/components/Runner/bootstrapper.html`)

Add `gamepadconnected` / `gamepaddisconnected` window listeners that set `_sb._padConnected`. (Polling still needs `navigator.getGamepads()` — the events are only a connectivity hint and let `input.padConnected()` work before the first poll.)

## Lifetime

Bindings are **global and persist across scene switches** — set once (in a startup scene's `oncreate`, or the first scene). `_resetFrameInput` only clears per-frame edges, never `_actions`.

## Testing

1. **Transpiler unit tests** — `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`: `input.bind`, `input.held`, `input.pressed`, `input.released`, `input.strength`, `input.axis`, `input.clearBindings`, `input.padConnected`, `input.setDeadzone` all produce the expected `_sb.*` calls.
2. **Engine unit tests** — `tests/components/Runner/engine/input.test.ts` (new) with a mocked `navigator.getGamepads`:
   - deadzone rescaling of axis halves
   - button edge detection across polls
   - analog→digital crossover at the 0.5 threshold (single edge, no repeats)
   - `strength` max-across-sources
   - `axis(neg, pos)` arithmetic and clamping
   - keyboard-only path (no pad connected)
3. **Cypress** — add a small demo (or extend a tutorial) that drives movement + a one-shot action through the action map on the **keyboard path only** (Cypress can't emulate a physical gamepad), with a `describe` block in `cypress/e2e/demos.cy.ts` or `tutorials.cy.ts`. Run manually — not in CI.

## Docs

- **`src/docs/api-reference/input.md`** — restructure: action-map section first (`bind`, the query functions, `clearBindings`, `padConnected`, `setDeadzone`, the button/axis code tables), keycode table retained, deprecated `getKeyDown`/`keyPressed`/`keyReleased` moved to a "Deprecated" section at the bottom with migration examples.
- **Language Guide input topic** — updated to teach the action map as the primary input model.
- **`src/docs/manifest.ts`** — no new page, just content changes.

## Roadmap

- `docs/language/library-roadmap.md` — mark controller/gamepad support as delivered; add tracked follow-up items for the deferred pieces:
  - **Local multiplayer** — a player-index parameter on `bind` and the query functions (designed to be added as an optional trailing arg without breaking the current surface).
  - **Rumble** — `gamepad.vibrationActuator` (Chromium-only).
  - **Named constants** for buttons/axes — blocked on the constants spec; migrate the code tables to `PAD_*` / axis constants once available.
  - **Runtime rebind UI helpers** — "press any input" capture for settings screens.
- `docs/roadmap.md` — reflect the same in the public-facing summary.

## Out of scope

- Multiple simultaneous controllers / local multiplayer (tracked follow-up).
- Rumble / haptics (tracked follow-up).
- Non-standard-mapping controller remapping.
- Touch / virtual on-screen controls.
- Migrating shipped demos and tutorials to the new API (separate follow-up; the deprecated functions keep them working).
- Named `PAD_*` constants (separate constants spec).
