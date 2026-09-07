# Survival Slice — Phase 1: Map + Controls + Scene Transitions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the survival-horror slice as a runnable dev demo — three connected
raycaster scenes (Old Platform, Disused Tunnel, Concourse Stairwell), first-person
movement you can tune, and an interact-to-use doorway that carries the player
between scenes at named entry points.

**Architecture:** A new dev-demo project `demo-src/survival-slice/`, built on a
copied-in snapshot of the current raycaster library (`Rc*.bas` from
`demo-src/raycaster-p10-finale/`). softBASIC has only single-level `Extends`, so
the three scene classes stay thin and delegate shared work to two plain modules:
`AreaHelpers.bas` (build a scene's world from a `.stm`, resolve entry points,
detect doorway transitions) and `Controls.bas` (bind the control set once, read
movement axes). Cross-scene state (which entry point to spawn at) travels through a
single shared `GameState` object, constructed in `Main.bas` and passed to every
scene — the same pattern as `demo-src/raycaster/GameData.bas` and
`demo-src/coins-platformer`.

**No new engine primitives.** Interact is `input.bind`/`input.pressed` (already
exists). Scene transitions are `scenemanager.switch` + `tilemapset.markersByTag`
+ `RcMover.warpTo` (all already exist). This phase is pure softBASIC on top of the
shipped library — no `.bas` def files, no engine JS, no descriptor/generator work.

**Tech Stack:** softBASIC, the raycaster `.bas` library, `.stm` tilemaps, Vitest
(transpile/smoke guards), Cypress (`demos.cy.ts` dev lane, no-`ERR` runtime check),
`scripts/buildDemo.ts`.

---

## Background: how the raycaster demos are wired (read before starting)

- **A demo project** is a flat folder of `.bas` files plus an `assets/` subfolder.
  `Main.bas` holds top-level code (runs once): an `oninit()` function for world
  setup, then `new` each scene, `scenemanager.register("name", obj)`, and
  `scenemanager.switch("name")`. See `demo-src/raycaster-p4/Main.bas`.
- **A scene** is `Class` / `Extends scene`. Lifecycle methods (all optional
  overrides of the `scene` base): `onenter()`, `onupdate(delta)`, `onexit()`,
  `onkeydown(key)`, `onkeyup(key)`. `onenter()` fires on **every**
  `scenemanager.switch` into that scene, including re-entry — so build the world
  there, not in the constructor. Input binds go in `Constructor()`.
- **`scenemanager.switch(name)` takes only a name** — it cannot pass arguments.
  Anything a scene needs to know from before the switch travels through a shared
  object constructed in `Main.bas` and handed to each scene's constructor.
- **`.stm` tilemap format** (JSON):
  ```json
  {
    "tileWidth": 16, "tileHeight": 16, "tileImage": "rc_placeholder_tiles.png",
    "layers": {
      "walls": [[1,1,1,...], [1,0,0,...], ...],
      "tags": { "type": "markers", "markers": [
        { "row": 3, "col": 5, "tag": "entry:start face:e" }
      ] }
    }
  }
  ```
  `walls` is a row-major 2D array of tile ids (`0` = open, `>0` = solid wall,
  drawn from `tileImage`). `tags.markers` is a flat list of `{row, col, tag}`;
  `tag` is a space-separated string of tokens, each either a bare flag (`door`)
  or `key:value` (`entry:start`).
- **Reading markers at runtime:** `tm.markersByTag("entry")` returns an array of
  `Marker` objects whose tag *contains* the token `entry` (matches `entry:start`,
  `entry:from_tunnel`, etc). A `Marker` has fields `.x`, `.y` (pixel centre),
  `.col`, `.row` (cell), `.tag` (the full string). `tm.allMarkers()` returns all
  of them. Confirmed in `src/lib/Basic4WebGL/defs/tilemapset.bas` and
  `src/lib/Basic4WebGL/defs/marker.bas`.
- **Raycaster scene skeleton** (from `demo-src/raycaster-p4/WalkScene.bas`):
  ```bas
  self.tm  = new tilemapset("p4room.stm")
  self.wld = new RcWorld(self.tm, "walls")          ' 2nd arg = wall layer name
  self.ren = new RcRender(self.wld)
  self.me  = new RcMover(self.wld, 2.0, 4.0, 0.3, 0.6)  ' world, x, y, radius, bodyHeight
  self.ren.bindCamera(self.me)
  ' ... in onupdate(delta):
  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  self.me.step(delta)
  self.ren.renderFrame()
  ```
- **`RcMover` API** (`demo-src/raycaster-p10-finale/RcMover.bas`): `move(fwd, strafe)`,
  `turn(dAngle)`, `look(dPitch)`, `warpTo(x, y, angle)`, `jump()`, `step(dt)`,
  `x()`, `y()`, `z()`, `angle()`, `pitch()`, `onGround()`. Angle is radians;
  `0` faces +x (grid east), `math.pi()/2` faces +y (grid south, i.e. downward
  rows), `math.pi()` faces west, `3*math.pi()/2` faces north.
- **`RcConfig` constants:** `RC_MOVE_SPEED = 2.6`, `RC_TURN_SPEED = 2.4`,
  `RC_LOOK_SPEED = 400.0`, `RC_STEP_UP = 0.35`.
- **Input API** (`src/lib/Basic4WebGL/defs/input.bas`): `input.bind(action, "key",
  keyboard.W)`, `input.axis(negAction, posAction)` → `-1..1`, `input.held(action)`,
  `input.pressed(action)` (true only on the frame the key goes down — use this for
  Interact), `input.released(action)`.
- **In-scene probe tests:** several demos run a `runProbes()` from `onenter()`
  that asserts invariants and, on failure, **throws a runtime error** (a bare
  `array.arrLength(missingVar)` on an undimmed variable) because on-canvas text is
  invisible to the Cypress "no `ERR`" guard. See
  `demo-src/raycaster-p4/WalkScene.bas` `runProbes()` / `probe()`. This plan uses
  the same technique for `AreaHelpers` logic.
- **Vitest guards for demo `.bas`:** `tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts`
  (compiles each `demo-src/raycaster-p*/` dir, asserts zero diagnostics) and
  `raycasterDemoSmoke.test.ts` (evaluates the emitted JS in a stubbed runtime).
  Both discover directories by the regex `/^raycaster-p\d+(-[a-z]+)?$/` — this
  plan widens both to also include `survival-slice`.

---

## File structure

### New — `demo-src/survival-slice/`

| File | Responsibility |
|---|---|
| `Main.bas` | `oninit()` world setup; construct `GameState` + the three scenes; register them; `switch("platform")`. |
| `GameState.bas` | Plain `Class` (no `Extends`). Carries `pendingEntry` (string) across scene switches. Phase-1 scope only; later phases add fields (activated safe zone, resources, collapse depth). |
| `Controls.bas` | Plain `Class` used as a module. `bindAll()` binds the movement + interact action set once. `readFwd()`, `readStrafe()`, `readTurn()` return axis values. Keeps the three scenes DRY. |
| `AreaHelpers.bas` | Plain `Class` used as a module. `spawnAtEntry(mover, tm, wantName)` warps the mover to the matching `entry:` marker (or `entry:start` fallback). `faceAngle(dir)` maps `"n"/"e"/"s"/"w"` → radians. `findDoorInReach(tm, px, py, reach)` returns the nearest `door:` marker within `reach` cells, or `0`. `doorTarget(marker)` / `doorEntry(marker)` / `doorPrompt(marker)` parse a `door:<scene>:<entry>` tag. |
| `PlatformScene.bas` | `Extends scene`. The start scene + safe-zone hub (hub role is later phases). Thin: delegates to `AreaHelpers` + `Controls`. Runs `runProbes()` in `onenter()`. |
| `TunnelScene.bas` | `Extends scene`. The "down" spoke. Thin, same shape as `PlatformScene` minus probes. |
| `StairwellScene.bas` | `Extends scene`. The "up" spoke / escape route. Thin, same shape. |
| `assets/platform.stm` | Old Platform stub layout. Markers: `entry:start face:e`, `entry:from_tunnel face:n`, `entry:from_stairwell face:s`, one `door:tunnel:from_platform` cell, one `door:stairwell:from_platform` cell. |
| `assets/tunnel.stm` | Disused Tunnel stub. Markers: `entry:from_platform face:s`, `door:platform:from_tunnel` cell. |
| `assets/stairwell.stm` | Concourse Stairwell stub. Markers: `entry:from_platform face:n`, `door:platform:from_stairwell` cell. |
| `assets/rc_placeholder_tiles.png` | Copied from `demo-src/raycaster-p10-finale/assets/`. |
| `assets/rc_tex_concrete.png` | Copied from `demo-src/raycaster-p10-finale/assets/`. |
| `Rc*.bas` (8 files) | `RcConfig`, `RcWorld`, `RcCast`, `RcMover`, `RcRender`, `RcLights`, `RcActor`, `RcActors` — copied verbatim from `demo-src/raycaster-p10-finale/`. Library snapshot for this project. |

### Modified — repo wiring

| File | Change |
|---|---|
| `tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts` | Widen the dir filter to also match `survival-slice`. |
| `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` | Same widening. |
| `src/features/demos/demoRegistry.ts` | Add a `DemoEntry` for `survival-slice`. |
| `src/docs/manifest.ts` | Add a nav entry under the `Demos` group. |
| `src/docs/demos/survival-slice.md` | Short "how it works" write-up (phase-1 scope; expand in later phases). |
| `src/docs/demos/SurvivalSlice.b4wgl.json` | Generated by `npm run build:demo` — committed. |
| `cypress/e2e/demos.cy.ts` | Add `{ slug: 'survival-slice', title: 'Survival Slice', waitMs: 4000 }` to the `DEV_DEMOS` array. |

### Marker tag conventions established this phase

| Tag | Meaning |
|---|---|
| `entry:<name> face:<n\|e\|s\|w>` | A named spawn point. `<name>` is `start` for the initial spawn, or `from_<scene>` for arrivals from that scene. `face:` is the facing on arrival. |
| `door:<targetScene>:<targetEntry>` | This cell is a doorway. Standing within reach and pressing Interact sets `GameState.pendingEntry = <targetEntry>` and `scenemanager.switch("<targetScene>")`. Optional extra token `label:<Text>` overrides the on-screen prompt. |

---

## Task 1: Scaffold the project directory and library snapshot

**Files:**
- Create: `demo-src/survival-slice/` (directory)
- Create: `demo-src/survival-slice/assets/` (directory)
- Copy: 8 `Rc*.bas` from `demo-src/raycaster-p10-finale/` → `demo-src/survival-slice/`
- Copy: `rc_placeholder_tiles.png`, `rc_tex_concrete.png` from
  `demo-src/raycaster-p10-finale/assets/` → `demo-src/survival-slice/assets/`

- [ ] **Step 1: Create the directories and copy the library + assets**

```bash
mkdir -p demo-src/survival-slice/assets
cp demo-src/raycaster-p10-finale/RcConfig.bas \
   demo-src/raycaster-p10-finale/RcWorld.bas \
   demo-src/raycaster-p10-finale/RcCast.bas \
   demo-src/raycaster-p10-finale/RcMover.bas \
   demo-src/raycaster-p10-finale/RcRender.bas \
   demo-src/raycaster-p10-finale/RcLights.bas \
   demo-src/raycaster-p10-finale/RcActor.bas \
   demo-src/raycaster-p10-finale/RcActors.bas \
   demo-src/survival-slice/
cp demo-src/raycaster-p10-finale/assets/rc_placeholder_tiles.png \
   demo-src/raycaster-p10-finale/assets/rc_tex_concrete.png \
   demo-src/survival-slice/assets/
```

- [ ] **Step 2: Verify the copy**

Run: `ls demo-src/survival-slice demo-src/survival-slice/assets`
Expected: 8 `.bas` files + `assets/` in the first; 2 `.png` in the second.

- [ ] **Step 3: Commit**

```bash
git add demo-src/survival-slice
git commit -m "feat(survival-slice): scaffold dev-demo dir + raycaster lib snapshot"
```

---

## Task 2: The three stub `.stm` maps

Small rooms are fine for phase 1 — the point is three navigable, connected spaces
and working transitions, not level design (that's the step-up after the slice
proves out). Each map is ~10×10 cells: a solid border of `1`, open interior of
`0`. Coordinates below are `col, row`, zero-based, matching the `walls` array
indices. Player world position `(x, y)` maps to `(col + 0.5, row + 0.5)` at a
cell centre.

**Files:**
- Create: `demo-src/survival-slice/assets/platform.stm`
- Create: `demo-src/survival-slice/assets/tunnel.stm`
- Create: `demo-src/survival-slice/assets/stairwell.stm`

- [ ] **Step 1: Write `platform.stm`**

A 12-wide × 10-tall room. Doorway to the tunnel on the south wall (col 3), doorway
to the stairwell on the north wall (col 8).

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 5, "col": 6, "tag": "entry:start face:e" },
        { "row": 7, "col": 3, "tag": "entry:from_tunnel face:n" },
        { "row": 2, "col": 8, "tag": "entry:from_stairwell face:s" },
        { "row": 8, "col": 3, "tag": "door:tunnel:from_platform label:Enter_tunnel" },
        { "row": 1, "col": 8, "tag": "door:stairwell:from_platform label:Ascend" }
      ]
    }
  }
}
```

> Note: `label:` values use `_` for spaces — the tag string is split on spaces, so
> a label token cannot itself contain a literal space. `AreaHelpers.doorPrompt`
> replaces `_` with a space when rendering.

- [ ] **Step 2: Write `tunnel.stm`**

A narrow 10×8 space — read as a tunnel. Doorway back to the platform on the north
wall (col 3).

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,1,0,0,1,1,1,1,1],
      [1,1,1,0,0,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 1, "col": 3, "tag": "entry:from_platform face:s" },
        { "row": 1, "col": 3, "tag": "door:platform:from_tunnel label:Back_up" }
      ]
    }
  }
}
```

> Two markers can share a cell. Here the arrival entry and the return doorway are
> the same cell — you step in from the platform, turn around, and the doorway is
> right there.

- [ ] **Step 3: Write `stairwell.stm`**

A 10×10 room, doorway back to the platform on the south wall (col 4).

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 8, "col": 4, "tag": "entry:from_platform face:n" },
        { "row": 8, "col": 4, "tag": "door:platform:from_stairwell label:Down_to_platform" }
      ]
    }
  }
}
```

- [ ] **Step 4: Validate the JSON**

Run:
```bash
node -e "for (const f of ['platform','tunnel','stairwell']) { const d = require('./demo-src/survival-slice/assets/'+f+'.stm'); console.log(f, d.layers.walls.length+'x'+d.layers.walls[0].length, d.layers.tags.markers.length+' markers'); }"
```
Expected:
```
platform 10x12 5 markers
tunnel 8x10 2 markers
stairwell 10x10 2 markers
```

- [ ] **Step 5: Commit**

```bash
git add demo-src/survival-slice/assets/*.stm
git commit -m "feat(survival-slice): three stub scene maps with entry/door markers"
```

---

## Task 3: `GameState.bas` — cross-scene state

**Files:**
- Create: `demo-src/survival-slice/GameState.bas`

- [ ] **Step 1: Write `GameState.bas`**

```bas
Class
' demo-src/survival-slice/GameState.bas
'
' The single piece of state that must survive a scenemanager.switch.
' scenemanager.switch(name) takes no arguments, so the destination scene's
' onenter() reads pendingEntry from here to know which entry: marker to spawn
' the player at. Constructed once in Main.bas, passed to every scene.
'
' Phase 1 scope: pendingEntry only. Later phases add activated-safe-zone,
' resource counts, and collapse depth here.

dim pendingEntry

Constructor()
  self.pendingEntry = "start"
EndConstructor

function setPendingEntry(name)
  self.pendingEntry = name
endfunction

function takePendingEntry()
  ' Read-and-reset: returns the pending entry name, then clears it back to
  ' "start" so a stray re-enter without a transition spawns at the map's
  ' start marker rather than repeating the last arrival point.
  dim name
  name = self.pendingEntry
  self.pendingEntry = "start"
  return name
endfunction

EndClass
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/survival-slice/GameState.bas
git commit -m "feat(survival-slice): GameState carries pendingEntry across scene switches"
```

---

## Task 4: `Controls.bas` — the shared control set

**Files:**
- Create: `demo-src/survival-slice/Controls.bas`

- [ ] **Step 1: Write `Controls.bas`**

Mirrors the bind style of `demo-src/raycaster-p10-finale/FinaleScene.bas`
(keyboard + controller), plus an `interact` action. **A module file is bare
`function` declarations at the top level — no `Class` / `EndClass` wrapper**
(see `demo-src/coins-platformer/LevelHelpers.bas`). Called externally with the
filename lowercased: `controls.bindAll()`, `controls.readFwd()`, etc.

```bas
' demo-src/survival-slice/Controls.bas
'
' The slice's control set, bound once and read by every scene. A plain module
' (no Class wrapper) -- it holds no state, only binds global input actions and
' reads them back. Keeps the three scene classes DRY: single-level Extends
' means they can't share a base class, so shared behaviour lives in modules.
'
' Actions:
'   fwd/back      W/S           left stick Y
'   strafeL/R     A/D           left stick X
'   turnL/R       arrows L/R    right stick X
'   interact      E             controller A (edge-triggered via input.pressed)

function bindAll()
  input.bind("fwd", "key", keyboard.W)
  input.bind("fwd", "axis", controller.LSTICK_UP)
  input.bind("back", "key", keyboard.S)
  input.bind("back", "axis", controller.LSTICK_DOWN)
  input.bind("strafeL", "key", keyboard.A)
  input.bind("strafeL", "axis", controller.LSTICK_LEFT)
  input.bind("strafeR", "key", keyboard.D)
  input.bind("strafeR", "axis", controller.LSTICK_RIGHT)
  input.bind("turnL", "key", keyboard.LEFT)
  input.bind("turnL", "axis", controller.RSTICK_LEFT)
  input.bind("turnR", "key", keyboard.RIGHT)
  input.bind("turnR", "axis", controller.RSTICK_RIGHT)
  input.bind("interact", "key", keyboard.E)
  input.bind("interact", "button", controller.A)
endfunction

function readFwd()
  return input.axis("back", "fwd")
endfunction

function readStrafe()
  return input.axis("strafeL", "strafeR")
endfunction

function readTurn()
  return input.axis("turnL", "turnR")
endfunction

function interactPressed()
  return input.pressed("interact")
endfunction
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/survival-slice/Controls.bas
git commit -m "feat(survival-slice): Controls module -- shared bind set + axis reads"
```

---

## Task 5: `AreaHelpers.bas` — entry points and doorway detection

This is the only module with real logic worth probing. It has four pure-ish
responsibilities: parse a `door:` tag, map a facing letter to an angle, find the
matching `entry:` marker, and find the nearest in-reach `door:` marker.

**Files:**
- Create: `demo-src/survival-slice/AreaHelpers.bas`

- [ ] **Step 1: Write `AreaHelpers.bas`**

**Module file — no `Class` wrapper. Sibling calls are bare (`tagValue(...)`, not
`self.tagValue(...)`) — see `LevelHelpers.bas`. Functions that call a sibling are
defined *after* it in the file.**

```bas
' demo-src/survival-slice/AreaHelpers.bas
'
' Shared scene-build helpers, used as a module (`areahelpers.spawnAtEntry(...)`).
' A plain module (no Class wrapper). Single-level Extends means the three scene
' classes can't share a base class, so the parts they have in common live here.
'
' Marker conventions (see the plan doc):
'   entry:<name> face:<n|e|s|w>   -- a named spawn point + facing
'   door:<scene>:<entry> [label:<Text_with_underscores>]
'                                -- a doorway cell; Interact in reach -> switch
'
' A cell centre in world coords is (col + 0.5, row + 0.5).

' --- facing letter -> angle in radians -------------------------------------
' Engine convention: 0 = +x (east), pi/2 = +y (south / increasing row),
' pi = west, 3*pi/2 = north.
function faceAngle(dir)
  if dir = "e" then
    return 0.0
  endif
  if dir = "s" then
    return math.pi() / 2.0
  endif
  if dir = "w" then
    return math.pi()
  endif
  if dir = "n" then
    return math.pi() * 1.5
  endif
  return 0.0
endfunction

' --- token extraction ------------------------------------------------------
' Return the value part of the first `key:value` token in tagStr, or "" .
function tagValue(tagStr, key)
  dim tokens
  dim ti
  dim tok
  dim ci
  dim k
  tokens = string.split(string.trim(tagStr), " ")
  for ti = 0 to array.arrLength(tokens) - 1
    tok = tokens(ti)
    ci = string.indexof(tok, ":")
    if ci >= 0 then
      k = string.substr(tok, 0, ci)
      if k = key then
        return string.substr(tok, ci + 1, string.len(tok))
      endif
    endif
  next ti
  return ""
endfunction

' --- door tag parsing ----------------------------------------------------
' `door:<scene>:<entry>` -- doorScene() returns <scene>, doorEntry() <entry>.
function doorScene(tagStr)
  dim v
  dim ci
  v = tagValue(tagStr, "door")
  ci = string.indexof(v, ":")
  if ci < 0 then
    return v
  endif
  return string.substr(v, 0, ci)
endfunction

function doorEntry(tagStr)
  dim v
  dim ci
  v = tagValue(tagStr, "door")
  ci = string.indexof(v, ":")
  if ci < 0 then
    return ""
  endif
  return string.substr(v, ci + 1, string.len(v))
endfunction

function doorPrompt(tagStr)
  dim raw
  raw = tagValue(tagStr, "label")
  if string.len(raw) = 0 then
    return "Use door  [E]"
  endif
  return string.replace(raw, "_", " ") + "  [E]"
endfunction

' --- spawn the mover at the wanted entry --------------------------------
' Looks for an `entry:` marker whose `entry:` value = wantName. Falls back to
' `entry:start`, then to cell (1.5, 1.5). Sets position AND facing.
function spawnAtEntry(mover as RcMover, tm as tilemapset, wantName)
  dim markers
  dim mi
  dim mk as Marker
  dim name
  dim foundX
  dim foundY
  dim foundAngle
  dim haveWanted
  dim haveStart
  dim startX
  dim startY
  dim startAngle

  foundX = 1.5
  foundY = 1.5
  foundAngle = 0.0
  haveWanted = 0
  haveStart = 0
  startX = 1.5
  startY = 1.5
  startAngle = 0.0

  markers = tm.markersByTag("entry")
  for mi = 0 to array.arrLength(markers) - 1
    mk = markers(mi)
    name = tagValue(mk.tag, "entry")
    if name = "start" then
      haveStart = 1
      startX = mk.col + 0.5
      startY = mk.row + 0.5
      startAngle = faceAngle(tagValue(mk.tag, "face"))
    endif
    if name = wantName then
      haveWanted = 1
      foundX = mk.col + 0.5
      foundY = mk.row + 0.5
      foundAngle = faceAngle(tagValue(mk.tag, "face"))
    endif
  next mi

  if haveWanted = 0 then
    if haveStart = 1 then
      foundX = startX
      foundY = startY
      foundAngle = startAngle
    endif
  endif

  mover.warpTo(foundX, foundY, foundAngle)
endfunction

' --- find the nearest door marker within `reach` cells of (px, py) ------
' Returns the Marker, or 0 if none in reach. Straight-line distance -- fine
' for a doorway you're standing next to.
function findDoorInReach(tm as tilemapset, px, py, reach)
  dim markers
  dim mi
  dim mk as Marker
  dim cx
  dim cy
  dim d
  dim best as Marker
  dim bestD
  dim haveBest

  haveBest = 0
  bestD = 0.0
  markers = tm.markersByTag("door")
  for mi = 0 to array.arrLength(markers) - 1
    mk = markers(mi)
    cx = mk.col + 0.5
    cy = mk.row + 0.5
    d = math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py))
    if d <= reach then
      if haveBest = 0 then
        haveBest = 1
        best = mk
        bestD = d
      else
        if d < bestD then
          best = mk
          bestD = d
        endif
      endif
    endif
  next mi

  if haveBest = 0 then
    return 0
  endif
  return best
endfunction
```

- [ ] **Step 2: Verify string/array API names against the def files**

Run:
```bash
grep -nE "function (split|trim|indexof|substr|len|replace)\b" src/lib/Basic4WebGL/defs/string.bas
grep -nE "function (arrLength)\b" src/lib/Basic4WebGL/defs/array.bas
grep -nE "function (pi|sqrt)\b" src/lib/Basic4WebGL/defs/math.bas
```
Expected: every one of `split`, `trim`, `indexof`, `substr`, `len`, `replace`,
`arrLength`, `pi`, `sqrt` resolves to a line.
If `string.replace` does **not** exist, replace the body of `doorPrompt` with a
manual space-swap loop over `string.split(raw, "_")` joined with `" "`:
```bas
function doorPrompt(tagStr)
  dim raw
  dim parts
  dim out
  dim i
  raw = tagValue(tagStr, "label")
  if string.len(raw) = 0 then
    return "Use door  [E]"
  endif
  parts = string.split(raw, "_")
  out = parts(0)
  for i = 1 to array.arrLength(parts) - 1
    out = out + " " + parts(i)
  next i
  return out + "  [E]"
endfunction
```

- [ ] **Step 3: Commit**

```bash
git add demo-src/survival-slice/AreaHelpers.bas
git commit -m "feat(survival-slice): AreaHelpers -- entry spawn + doorway detection"
```

---

## Task 6: `PlatformScene.bas` — the start scene with movement

**Files:**
- Create: `demo-src/survival-slice/PlatformScene.bas`

- [ ] **Step 1: Write `PlatformScene.bas` with an in-scene probe suite**

The `runProbes()` here tests the `AreaHelpers` logic that the Vitest layer can't
easily reach (it needs a real `tilemapset`). Failed probes throw (Cypress-visible).

```bas
Class
Extends scene
' demo-src/survival-slice/PlatformScene.bas
'
' The Old Platform -- where the player starts, and (later phases) the
' safe-zone hub. Phase 1: a navigable room with two doorways (to the tunnel,
' to the stairwell) and the AreaHelpers probe suite.

dim state as GameState
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim hintText as Text
dim promptText as Text
dim doorReach

Constructor(gs as GameState)
  self.state = gs
  self.doorReach = 1.2
  controls.bindAll()
EndConstructor

function onenter()
  world.setBackground(3, 3, 6)
  self.tm = new tilemapset("platform.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")

  areahelpers.spawnAtEntry(self.me, self.tm, self.state.takePendingEntry())

  self.titleText = new Text("OLD PLATFORM", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)
  self.hintText = new Text("WASD move/turn   E interact", 12, 30)
  self.hintText.setStyle(12, 180, 200, 220)
  hud.add(self.hintText)
  self.promptText = new Text("", stage.width() / 2 - 90, stage.height() - 60)
  self.promptText.setStyle(16, 255, 255, 255)
  hud.add(self.promptText)

  self.runProbes()
endfunction

function runProbes()
  dim okAngleS
  dim okDoorScene
  dim okDoorEntry
  dim okEntrySpawn
  dim okDoorReach
  dim m as RcMover
  dim d as Marker
  dim far as Marker

  okAngleS = 0
  if math.abs(areahelpers.faceAngle("s") - math.pi() / 2.0) < 0.001 then
    okAngleS = 1
  endif
  self.probe("faceAngle s", okAngleS, 52)

  okDoorScene = 0
  if areahelpers.doorScene("door:tunnel:from_platform label:Enter_tunnel") = "tunnel" then
    okDoorScene = 1
  endif
  self.probe("doorScene parse", okDoorScene, 72)

  okDoorEntry = 0
  if areahelpers.doorEntry("door:tunnel:from_platform label:Enter_tunnel") = "from_platform" then
    okDoorEntry = 1
  endif
  self.probe("doorEntry parse", okDoorEntry, 92)

  ' entry:from_stairwell is at row 2, col 8 -> world (8.5, 2.5)
  m = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  areahelpers.spawnAtEntry(m, self.tm, "from_stairwell")
  okEntrySpawn = 0
  if math.abs(m.x() - 8.5) < 0.01 then
    if math.abs(m.y() - 2.5) < 0.01 then
      okEntrySpawn = 1
    endif
  endif
  self.probe("spawnAtEntry positions mover", okEntrySpawn, 112)

  ' door tunnel is at row 8, col 3 -> world (3.5, 8.5). Stand at (3.5, 7.8).
  d = areahelpers.findDoorInReach(self.tm, 3.5, 7.8, 1.2)
  far = areahelpers.findDoorInReach(self.tm, 6.0, 4.0, 1.2)
  okDoorReach = 0
  if d <> 0 then
    if far = 0 then
      if areahelpers.doorScene(d.tag) = "tunnel" then
        okDoorReach = 1
      endif
    endif
  endif
  self.probe("findDoorInReach near/far", okDoorReach, 132)
endfunction

function probe(label, passed, y)
  dim result
  dim t as Text
  dim missing
  dim boom
  result = "OK"
  if passed = 0 then
    result = "FAIL"
  endif
  t = new Text(label + ": " + result, 12, y)
  t.setStyle(12, 255, 255, 255)
  hud.add(t)
  if passed = 0 then
    boom = array.arrLength(missing)
  endif
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim door as Marker

  fwd = controls.readFwd()
  strafe = controls.readStrafe()
  turnAxis = controls.readTurn()

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)

  door = areahelpers.findDoorInReach(self.tm, self.me.x(), self.me.y(), self.doorReach)
  if door = 0 then
    self.promptText.setText("")
  else
    self.promptText.setText(areahelpers.doorPrompt(door.tag))
    if controls.interactPressed() then
      self.state.setPendingEntry(areahelpers.doorEntry(door.tag))
      scenemanager.switch(areahelpers.doorScene(door.tag))
    endif
  endif

  self.ren.renderFrame()
endfunction

EndClass
```

- [ ] **Step 2: Verify `Text.setText` exists (probes and prompt use it)**

Run: `grep -nE "function (setText|setStyle)\b" src/lib/Basic4WebGL/defs/text.bas`
Expected: both resolve. If `setText` is absent, check the generated
`src/lib/Basic4WebGL/defs/text.bas` for the real setter name (e.g. `text` /
`setString`) and use that throughout this file and Tasks 7–8.

- [ ] **Step 3: Commit**

```bash
git add demo-src/survival-slice/PlatformScene.bas
git commit -m "feat(survival-slice): PlatformScene -- movement, doorway prompt, probes"
```

---

## Task 7: `TunnelScene.bas` and `StairwellScene.bas`

Same shape as `PlatformScene` minus the probe suite. They are separate files (not
one parameterised class) because each will diverge in later phases — the tunnel
gets a story terminal and shamblers, the stairwell gets the faction war and the
`contested`/`controlled` swap.

**Files:**
- Create: `demo-src/survival-slice/TunnelScene.bas`
- Create: `demo-src/survival-slice/StairwellScene.bas`

- [ ] **Step 1: Write `TunnelScene.bas`**

```bas
Class
Extends scene
' demo-src/survival-slice/TunnelScene.bas
'
' The Disused Tunnel -- the "down" spoke. Phase 1: a navigable space with one
' doorway back to the platform. Later phases: a story terminal, shamblers,
' permanently `infested`.

dim state as GameState
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim promptText as Text
dim doorReach

Constructor(gs as GameState)
  self.state = gs
  self.doorReach = 1.2
  controls.bindAll()
EndConstructor

function onenter()
  world.setBackground(2, 2, 3)
  self.tm = new tilemapset("tunnel.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")

  areahelpers.spawnAtEntry(self.me, self.tm, self.state.takePendingEntry())

  self.titleText = new Text("DISUSED TUNNEL", 12, 10)
  self.titleText.setStyle(16, 200, 180, 120)
  hud.add(self.titleText)
  self.promptText = new Text("", stage.width() / 2 - 90, stage.height() - 60)
  self.promptText.setStyle(16, 255, 255, 255)
  hud.add(self.promptText)
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim door as Marker

  fwd = controls.readFwd()
  strafe = controls.readStrafe()
  turnAxis = controls.readTurn()

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)

  door = areahelpers.findDoorInReach(self.tm, self.me.x(), self.me.y(), self.doorReach)
  if door = 0 then
    self.promptText.setText("")
  else
    self.promptText.setText(areahelpers.doorPrompt(door.tag))
    if controls.interactPressed() then
      self.state.setPendingEntry(areahelpers.doorEntry(door.tag))
      scenemanager.switch(areahelpers.doorScene(door.tag))
    endif
  endif

  self.ren.renderFrame()
endfunction

EndClass
```

- [ ] **Step 2: Write `StairwellScene.bas`** (identical but for the `.stm`, title,
      and background)

```bas
Class
Extends scene
' demo-src/survival-slice/StairwellScene.bas
'
' The Concourse Stairwell -- the "up" spoke, the escape route. Phase 1: a
' navigable room with one doorway back to the platform. Later phases: a crew
' fireteam vs. zombies, and the `contested` -> `controlled` spawn swap when
' the circle collapses.

dim state as GameState
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim promptText as Text
dim doorReach

Constructor(gs as GameState)
  self.state = gs
  self.doorReach = 1.2
  controls.bindAll()
EndConstructor

function onenter()
  world.setBackground(6, 5, 4)
  self.tm = new tilemapset("stairwell.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")

  areahelpers.spawnAtEntry(self.me, self.tm, self.state.takePendingEntry())

  self.titleText = new Text("CONCOURSE STAIRWELL", 12, 10)
  self.titleText.setStyle(16, 255, 200, 160)
  hud.add(self.titleText)
  self.promptText = new Text("", stage.width() / 2 - 90, stage.height() - 60)
  self.promptText.setStyle(16, 255, 255, 255)
  hud.add(self.promptText)
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim door as Marker

  fwd = controls.readFwd()
  strafe = controls.readStrafe()
  turnAxis = controls.readTurn()

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)

  door = areahelpers.findDoorInReach(self.tm, self.me.x(), self.me.y(), self.doorReach)
  if door = 0 then
    self.promptText.setText("")
  else
    self.promptText.setText(areahelpers.doorPrompt(door.tag))
    if controls.interactPressed() then
      self.state.setPendingEntry(areahelpers.doorEntry(door.tag))
      scenemanager.switch(areahelpers.doorScene(door.tag))
    endif
  endif

  self.ren.renderFrame()
endfunction

EndClass
```

- [ ] **Step 3: Commit**

```bash
git add demo-src/survival-slice/TunnelScene.bas demo-src/survival-slice/StairwellScene.bas
git commit -m "feat(survival-slice): Tunnel + Stairwell scenes with return doorways"
```

---

## Task 8: `Main.bas` — wire the scenes together

**Files:**
- Create: `demo-src/survival-slice/Main.bas`

- [ ] **Step 1: Write `Main.bas`**

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim state = new GameState()
dim platformScene = new PlatformScene(state)
dim tunnelScene = new TunnelScene(state)
dim stairwellScene = new StairwellScene(state)

scenemanager.register("platform", platformScene)
scenemanager.register("tunnel", tunnelScene)
scenemanager.register("stairwell", stairwellScene)
scenemanager.switch("platform")
```

- [ ] **Step 2: Commit**

```bash
git add demo-src/survival-slice/Main.bas
git commit -m "feat(survival-slice): Main -- register three scenes, start on platform"
```

---

## Task 9: Widen the Vitest demo guards to cover `survival-slice`

**Files:**
- Modify: `tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`

- [ ] **Step 1: Run the transpile guard now to see it does NOT yet cover us**

Run: `npx vitest run raycasterDemoTranspile`
Expected: PASS, but the test list shows only `raycaster-p*` dirs — no
`survival-slice`.

- [ ] **Step 2: Widen the directory filter in `raycasterDemoTranspile.test.ts`**

Find:
```ts
const phaseDirs = readdirSync(DEMO_SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^raycaster-p\d+(-[a-z]+)?$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();
```
Replace with:
```ts
const DEMO_DIR_RE = /^(raycaster-p\d+(-[a-z]+)?|survival-slice)$/;
const phaseDirs = readdirSync(DEMO_SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && DEMO_DIR_RE.test(entry.name))
  .map((entry) => entry.name)
  .sort();
```

- [ ] **Step 3: Apply the identical change in `raycasterDemoSmoke.test.ts`**

Find the same `phaseDirs` block (it appears once, near the top) and apply the
identical replacement.

- [ ] **Step 4: Run both guards**

Run: `npx vitest run raycasterDemoTranspile raycasterDemoSmoke`
Expected: PASS, and the test output now lists `survival-slice` among the demos
checked ("survival-slice compiles with no diagnostics"). If transpile fails, the
diagnostics name the offending `.bas` file and line — fix in that file, re-run.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts \
        tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "test(survival-slice): cover the new demo dir in transpile + smoke guards"
```

---

## Task 10: Build the demo package and register it

**Files:**
- Create: `src/docs/demos/SurvivalSlice.b4wgl.json` (generated)
- Create: `src/docs/demos/survival-slice.md`
- Modify: `src/features/demos/demoRegistry.ts`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Build the package**

Run: `npm run build:demo -- demo-src/survival-slice SurvivalSlice`
Expected: `Wrote src/docs/demos/SurvivalSlice.b4wgl.json (10 file(s), 5 asset(s))`
(8 `Rc*.bas` + `Main.bas` + `GameState.bas` + `Controls.bas` + `AreaHelpers.bas`
+ 3 scenes = 15 `.bas`; 2 `.png` + 3 `.stm` = 5 assets. The exact `.bas` count in
the log will read 15 — adjust your expectation, the message just echoes counts.)

- [ ] **Step 2: Write `src/docs/demos/survival-slice.md`** (short — phase-1 scope)

```markdown
# Survival Slice

**Status: work in progress (vertical-slice prototype).** This demo is built up
phase by phase — see
`docs/superpowers/specs/2026-09-07-survival-horror-slice-design.md`.

A first-person raycaster survival-horror slice. You start on a disused
underground platform of a transit station and can move between three connected
areas — the Old Platform, the Disused Tunnel, and the Concourse Stairwell —
through doorways you open with the **E** key.

## Controls

| Key | Action |
|---|---|
| W / S | Move forward / back |
| A / D | Strafe left / right |
| ← / → | Turn |
| E | Interact (use a doorway when the prompt shows) |

## How it works (phase 1)

Each area is its own raycaster scene with its own `.stm` map. `scenemanager`
switches between them. Because `scenemanager.switch` can't pass arguments, a
shared `GameState` object records which entry point the next scene should spawn
the player at. `AreaHelpers` reads `entry:` and `door:` markers straight from the
tilemap, so spawn points and doorways are authored visually in the map, not
hardcoded. `Controls` binds the input set once and all three scenes read it.

## Assets

| Asset | Purpose |
|---|---|
| `rc_placeholder_tiles.png` | Wall tile sheet |
| `rc_tex_concrete.png` | Wall texture |
| `platform.stm` / `tunnel.stm` / `stairwell.stm` | The three area maps |
```

- [ ] **Step 3: Add the `demoRegistry.ts` entry**

Append to the `demoRegistry` array in `src/features/demos/demoRegistry.ts`
(before the closing `];`):
```ts
  {
    slug: 'survival-slice',
    name: 'Survival Slice',
    tags: ['Raycasting', 'Scenes', 'Tilemap Markers', 'Work in Progress'],
    description: `A first-person raycaster survival-horror slice, built up phase by phase. Phase 1: three connected areas — Old Platform, Disused Tunnel, Concourse Stairwell — each its own raycaster scene with its own \`.stm\` map, joined by doorways you open with E. A shared \`GameState\` object carries the target entry point across \`scenemanager.switch\` (which takes no arguments); \`AreaHelpers\` resolves \`entry:\` and \`door:\` markers read straight from the tilemap, so spawn points and doorways are authored visually. See \`docs/superpowers/specs/2026-09-07-survival-horror-slice-design.md\`.

**Assets required:** \`rc_placeholder_tiles.png\`, \`rc_tex_concrete.png\`, \`platform.stm\`, \`tunnel.stm\`, \`stairwell.stm\` — **Controls:** WASD to move, arrow keys to turn, E to use a doorway`,
    docsSlug: 'survival-slice',
    file: 'SurvivalSlice',
  },
```

- [ ] **Step 4: Add the `manifest.ts` nav entry**

In `src/docs/manifest.ts`, find the `Demos` group's topic list and append:
```ts
      { slug: 'survival-slice', title: 'Survival Slice', file: 'demos/survival-slice.md' },
```
(Match the exact object shape of the sibling demo entries in that array — check
whether they use `file:` or another key, and copy it.)

- [ ] **Step 5: Verify the registry + manifest compile**

Run: `npx vite build`
Expected: build completes with no errors. (This is the project's canonical
verification command — `tsc --noEmit` has known unrelated env issues.)

- [ ] **Step 6: Commit**

```bash
git add src/docs/demos/SurvivalSlice.b4wgl.json src/docs/demos/survival-slice.md \
        src/features/demos/demoRegistry.ts src/docs/manifest.ts
git commit -m "feat(survival-slice): package + register the phase-1 dev demo"
```

---

## Task 11: Cypress dev-lane smoke entry

**Files:**
- Modify: `cypress/e2e/demos.cy.ts`

- [ ] **Step 1: Add the dev-demo entry**

In `cypress/e2e/demos.cy.ts`, find the `DEV_DEMOS` array and append:
```ts
  { slug: 'survival-slice', title: 'Survival Slice', waitMs: 4000 },
```

- [ ] **Step 2: Run the e2e check** (needs the dev server up)

In one terminal: `npm run dev`
In another:
```bash
npx cypress run --spec cypress/e2e/demos.cy.ts --config-file cypress.config.ts
```
Expected: the `Dev demo: Survival Slice` block passes — the demo seeds, runs, and
produces **zero `ERR`** entries in the console panel. If probes in
`PlatformScene.runProbes()` fail, they throw and show up here as an `ERR` — the
failing probe's label is on-canvas; cross-reference it to the assertion in
`PlatformScene.bas`.

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/demos.cy.ts
git commit -m "test(survival-slice): add phase-1 demo to the Cypress dev lane"
```

---

## Task 12: Manual playtest gate

Not a code step — the phase-1 acceptance check from the spec. Do this before
declaring the phase done or moving to phase 2.

- [ ] **Step 1: Run the app and open the demo**

Run: `npm run dev`, open the app, go to the Demos page, find "Survival Slice",
click **Try Demo**, then **Run**.

- [ ] **Step 2: Walk the loop**

- [ ] You spawn on the Old Platform facing into the room.
- [ ] WASD moves, arrow keys turn, walls stop you, movement feels controllable
      (note any speed/turn-rate tweaks — `RcConfig.RC_MOVE_SPEED` /
      `RC_TURN_SPEED` in `demo-src/survival-slice/RcConfig.bas`).
- [ ] Walking near the north doorway shows the "Ascend  [E]" prompt; near the
      south doorway shows "Enter tunnel  [E]"; the prompt clears when you walk
      away.
- [ ] Pressing **E** at the north doorway loads the Stairwell, spawning you at
      its `from_platform` entry facing north (into the room), doorway behind you.
- [ ] Pressing **E** on the Stairwell's doorway returns you to the Platform,
      spawning at `from_stairwell` (col 8, row 2).
- [ ] Same round trip works Platform ↔ Tunnel.
- [ ] The three areas read as visually distinct (different background tints /
      titles) and no `ERR` appears in the console panel.

- [ ] **Step 3: Record tuning notes**

Write any control-feel or layout adjustments into the spec's "Open questions
carried into implementation" section (item 6, "Scene transition affordance"), or
straight into `RcConfig.bas` if it's just a constant. If a mechanic feels
fundamentally wrong, **stop** and revise
`docs/superpowers/specs/2026-09-07-survival-horror-slice-design.md` before
starting phase 2 — that is the whole point of the phased build.

- [ ] **Step 4: Final full-suite check**

Run: `npx vitest run`
Expected: full suite green (the two widened guards included).

---

## Done criteria for phase 1

- `npx vitest run` green, including `survival-slice` in the transpile + smoke guards.
- `npx vite build` clean.
- Cypress `Dev demo: Survival Slice` passes (zero `ERR`).
- Manual playtest: all three areas navigable, both doorway round trips work with
  correct entry placement and facing, controls feel acceptable (or tweak notes
  recorded).
- Every task committed.

## Deferred to later phases (not this plan)

- Phase 2: firearm, scrap/ammo pickups, safe-zone Activate + Workbench, wall
  terminal + paused text overlay.
- Phase 3: safe-zone Rest, save/heal, death → reload.
- Phase 4: shamblers + the per-area state stub.
- Phase 5: troopers, `raycast()` LOS helper, faction targeting.
- Phase 6: the closing circle (collapse depth, diegetic audio, `contested` →
  `controlled` swap, tuning knob), optional minimap assist.
- Full demo-authoring checklist completion (expanded `.md`, screenshots) — only
  when/if the slice proves out and ships as a real demo rather than a dev
  prototype.
