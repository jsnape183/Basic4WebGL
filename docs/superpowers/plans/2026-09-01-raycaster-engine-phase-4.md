# Raycaster Engine — Phase 4: `RcMover` Height-Aware Locomotion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `RcMover.bas` — a softBASIC class, one instance per movable body, that resolves intent (`move`/`turn`/`look`/`jump` → `step(dt)`) against `RcWorld`: circle-vs-wall slide collision, step-up onto low ledges, head-clearance blocking, gravity + landing + falling into pits. Wire `RcRender.bindCamera(actor)` so the view follows a mover. Verified by an unlisted `raycaster-p4` Cypress demo that makes the Phase 3 room **walkable** (WASD + turn + look + jump), with probes asserting collision/step-up/gravity outcomes.

**Architecture:** Pure softBASIC (spec §1.1). **All actor-vs-static-scene collision lives in `RcMover`** (spec §7 — one swept resolution, inseparable from step-up/head-clearance). The `collision` engine module is NOT used in a raycast scene. `RcRender` gains a `camZ` field + `bindCamera(actor)` so `renderFrame()` pulls camera position/angle/pitch/**height** from the bound mover each frame; the eye is `actor.z() + RC_EYE_Z`. Actor-vs-actor collision (spec §7.1), animated lifts, and region resolution (main vs `upper`, spec §7 — Phase 8) are deferred.

**Tech Stack:** softBASIC, Vitest (transpile + smoke-execute guards), Cypress e2e.

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §7 (the mover) + §7.3 (RcRender owns camera, mover writes it), phase 4 of §11. Deferred: §7.1 actor-vs-actor, lifts, upper-region resolution.

---

## Background the implementer needs

- **Phases 1–3 shipped** (`d26480e`..`392853f`). Library in `demo-src/raycaster/lib/`:
  - `RcConfig.bas` — `const` block. Referenced **prefixed** (`RcConfig.RC_STEP_UP`). Current: `RC_MAX_DIST`, `RC_MAX_MARCH_ITERS`, `RC_SPAN_WALL/FLOORSTEP/CEILSTEP`, `RC_STRIP_W`, `RC_EYE_Z` (0.5), `RC_MAX_PITCH` (220). `RC_STEP_UP` (0.35) is referenced in the spec but **not yet in the file** — Task 1 adds it along with the physics constants.
  - `RcWorld.bas` — `new RcWorld(tm, wallsLayerName)`; `(col,row)` accessors: `wallAt` (OOB→1), `floorHeightAt` (OOB→0), `ceilHeightAt` (OOB→1.0), `widthCells()`, `heightCells()`, ...
  - `RcCast.bas` — `new RcCast()`; `cast(wld, ...)`, `los(wld, ...)`.
  - `RcRender.bas` — `new RcRender(w as RcWorld)`; `setCamera(x,y,angle,pitch)`, `setFov`, `projectY(h,d)`, `renderFrame()`, `columnCount()`. Camera is `camX/camY/camAngle/camPitch/fovScale` + derived `viewW/viewH/scy/cols`. `projectY(h,d) = scy + (RC_EYE_Z - h) * (viewH / max(d,0.05)) + camPitch`.
- **softBASIC footgun** — never name a parameter/local after a builtin module (`world`, `math`, `array`, `string`, `input`, `stage`, `pen`, `drawing`, `camera`, `hud`, `keyboard`, `controller`, `scenemanager`, ...). Silent mis-transpile → runtime `ReferenceError`. The RcWorld field/param is `wld`/`w`, never `world`.
- **softBASIC facts:** `const` prefixed access only. No `elseif`, no `%`/bitwise. `0 - x` for negation. `and`/`or`/`not` in `if`. `dim`s hoisted to function top. `math`: `sin cos tan pi() abs floor sqrt min(a,b) max(a,b) clamp(v,lo,hi) val(s)`. Scenes get `Constructor()`, `onenter()`, `onupdate(delta)` (**`delta` is milliseconds** — divide by 1000 for seconds, as every existing demo does), `onkeydown(key)`.
- **Input** (`input.bas` / `keyboard.bas`): bind actions in the scene `Constructor` (NOT `onenter` — that re-runs and stacks bindings). `input.bind("fwd", "key", keyboard.W)`; read `input.axis("back", "fwd")` → -1/0/+1 for keys (fractional for sticks); `input.pressed("jump")` → true once per press. Keys: `keyboard.W/A/S/D/Q/E/SPACE/UP/DOWN`. Reference: `demo-src/raycaster/GameScene.bas` `setupInput()` (~line 308) + `handleInput()` + `tryMovePlayer()` (per-axis slide with a skin offset).
- **`build:demo` non-recursive** — each demo dir needs its own lib copies. Guards: `raycasterDemoLibSync`, `raycasterDemoTranspile`, `raycasterDemoSmoke` (transpile + eval + drive `RcCast`/`RcRender`; **extend it to drive `RcMover` in Task 2**). Auto-discover `raycaster-p*/`.
- **Probe scenes MUST force a runtime error on a failed check** (`array.arrLength(missing)` on an unassigned `dim`) — see `demo-src/raycaster-p3/RoomViewScene.bas` `probe()`.
- **Phase 3 frame-time is marginal (16ms / 127 cols, flat-shaded).** Phase 4 adds no per-strip cost (the mover is cheap; `renderFrame` is unchanged except pulling camera state from the actor). Do NOT do `drawing.js` work in Phase 4 — it's tracked for Phase 5.

---

## File Structure

**Created:**
- `demo-src/raycaster/lib/RcMover.bas` — the mover. One responsibility: resolve movement intent against `RcWorld`.
- `demo-src/raycaster-p4/Main.bas`, `WalkScene.bas`, + 5 lib copies (`RcConfig`, `RcWorld`, `RcCast`, `RcRender`, `RcMover`).
- `demo-src/raycaster-p4/assets/p4room.stm` (copy of `p3room.stm`), `rc_placeholder_tiles.png` (copy).
- `src/docs/demos/RaycasterP4Walk.b4wgl.json` — generated, committed.

**Modified:**
- `demo-src/raycaster/lib/RcConfig.bas` — add `RC_STEP_UP`, `RC_GRAVITY`, `RC_JUMP_VEL`, `RC_MOVE_SPEED`, `RC_TURN_SPEED`, `RC_LOOK_SPEED`.
- `demo-src/raycaster-p2/RcConfig.bas`, `demo-src/raycaster-p3/RcConfig.bas` — re-sync.
- `demo-src/raycaster/lib/RcRender.bas` — add `camZ` field + `bindCamera(actor)`; `projectY` + `renderFrame` use the bound actor's position/angle/pitch/z.
- `demo-src/raycaster-p3/RcRender.bas` — re-sync.
- `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` — drive `RcMover`; adjust the `RcRender` case for `bindCamera`.
- `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts` — wire `raycaster-p4-walk`.
- `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`.

---

## Task 1: `RcConfig` physics constants

**Files:** Modify `demo-src/raycaster/lib/RcConfig.bas`; re-sync `demo-src/raycaster-p2/RcConfig.bas` and `demo-src/raycaster-p3/RcConfig.bas`.

- [ ] **Step 1: Add to the `const` block** (after the existing entries):

```basic
  RC_STEP_UP = 0.35
  RC_GRAVITY = 14.0
  RC_JUMP_VEL = 5.0
  RC_MOVE_SPEED = 2.6
  RC_TURN_SPEED = 2.4
  RC_LOOK_SPEED = 400.0
```

`RC_STEP_UP` — max ledge you can walk onto (world units). `RC_GRAVITY` — units/s². `RC_JUMP_VEL` — initial jump velocity, units/s. `RC_MOVE_SPEED` — units/s. `RC_TURN_SPEED` — radians/s. `RC_LOOK_SPEED` — pitch pixels/s.

- [ ] **Step 2: Re-sync**

```bash
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p2/RcConfig.bas
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p3/RcConfig.bas
```

- [ ] **Step 3: Verify + commit**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo   # transpile + lib-sync + smoke green
```

```bash
git add demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p2/RcConfig.bas demo-src/raycaster-p3/RcConfig.bas
git commit -m "feat(raycaster): RcConfig physics constants (step-up, gravity, jump, move/turn/look speeds)"
```

---

## Task 2: `RcMover.bas` — the mover

**Files:** Create `demo-src/raycaster/lib/RcMover.bas`; modify `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`.

No `.bas` unit tests (spec §1.2). Verified by the smoke test + the Phase 4 demo probes.

- [ ] **Step 1: Create the module**

```basic
Class
' RcMover -- one height-aware movable body for a raycaster scene (spec §7).
' ALL actor-vs-static-scene collision lives here: circle-vs-wall slide, step-up
' onto low ledges, head-clearance blocking, gravity + landing + pit falls.
'
' Usage each frame: set intent (move/turn/look/jump), then step(dt). Read back
' with x()/y()/z()/angle()/pitch()/onGround(). RcRender.bindCamera(mover) makes
' the view follow it.
'
' The RcWorld field is `wld`, NEVER `world` (builtin module -> silent
' mis-transpile -> runtime ReferenceError).
'
' Deferred (spec): actor-vs-actor collision (§7.1), animated lifts, region
' resolution main-vs-upper (Phase 8).
dim wld as RcWorld
dim px
dim py
dim pz
dim vz
dim ang
dim pit
dim rad
dim ht
dim grounded
dim mvFwd
dim mvStrafe
dim wantJump

Constructor(w as RcWorld, x, y, radius, bodyHeight)
    self.wld = w
    self.px = x
    self.py = y
    self.pz = w.floorHeightAt(math.floor(x), math.floor(y))
    self.vz = 0
    self.ang = 0
    self.pit = 0
    self.rad = radius
    self.ht = bodyHeight
    self.grounded = 1
    self.mvFwd = 0
    self.mvStrafe = 0
    self.wantJump = 0
EndConstructor

' -- intent (call before step) --

function move(fwd, strafe)
    self.mvFwd = fwd
    self.mvStrafe = strafe
endfunction

function turn(dAngle)
    self.ang = self.ang + dAngle
endfunction

function look(dPitch)
    self.pit = math.clamp(self.pit + dPitch, 0 - RcConfig.RC_MAX_PITCH, RcConfig.RC_MAX_PITCH)
endfunction

function jump()
    self.wantJump = 1
endfunction

' -- resolution --

' A cell blocks the body at the current feet height if it's a wall, its floor is
' too high to step onto, or its ceiling leaves less than body-height of headroom.
function blocked(cx, cy)
    if self.wld.wallAt(cx, cy) > 0 then
        return 1
    endif
    if self.wld.floorHeightAt(cx, cy) - self.pz > RcConfig.RC_STEP_UP then
        return 1
    endif
    if self.wld.ceilHeightAt(cx, cy) - self.pz < self.ht then
        return 1
    endif
    return 0
endfunction

function step(dt)
    dim dsec
    dim dirX
    dim dirY
    dim strX
    dim strY
    dim moveX
    dim moveY
    dim nx
    dim ny
    dim cx
    dim cy
    dim groundH

    dsec = dt / 1000.0
    if dsec > 0.1 then
        dsec = 0.1
    endif

    dirX = math.cos(self.ang)
    dirY = math.sin(self.ang)
    strX = 0 - dirY
    strY = dirX

    moveX = (dirX * self.mvFwd + strX * self.mvStrafe) * dsec
    moveY = (dirY * self.mvFwd + strY * self.mvStrafe) * dsec

    ' Horizontal: per-axis slide. The skin offset points the cell check in the
    ' travel direction. blocked() rejects cells that are walls, too-high to step
    ' onto, or too-low-ceilinged; the vertical resolver below does the step-up
    ' snap once, authoritatively, from the cell actually occupied after the move.
    if moveX <> 0 then
        nx = self.px + moveX
        if moveX > 0 then
            cx = math.floor(nx + self.rad)
        else
            cx = math.floor(nx - self.rad)
        endif
        if self.blocked(cx, math.floor(self.py)) = 0 then
            self.px = nx
        endif
    endif

    if moveY <> 0 then
        ny = self.py + moveY
        if moveY > 0 then
            cy = math.floor(ny + self.rad)
        else
            cy = math.floor(ny - self.rad)
        endif
        if self.blocked(math.floor(self.px), cy) = 0 then
            self.py = ny
        endif
    endif

    ' jump
    if self.wantJump = 1 then
        if self.grounded = 1 then
            self.vz = RcConfig.RC_JUMP_VEL
            self.grounded = 0
        endif
    endif
    self.wantJump = 0

    ' Vertical: one authoritative resolution against the floor of the cell now
    ' occupied. groundH below current feet + within step-up -> snap up (walking
    ' onto a low ledge). Otherwise integrate gravity and land when feet reach it
    ' (walking off a ledge / into a pit / descending a jump).
    groundH = self.wld.floorHeightAt(math.floor(self.px), math.floor(self.py))
    if self.grounded = 1 and groundH > self.pz and groundH - self.pz <= RcConfig.RC_STEP_UP then
        self.pz = groundH
        self.vz = 0
    else
        self.vz = self.vz - RcConfig.RC_GRAVITY * dsec
        self.pz = self.pz + self.vz * dsec
        if self.pz <= groundH then
            self.pz = groundH
            self.vz = 0
            self.grounded = 1
        else
            self.grounded = 0
        endif
    endif

    self.mvFwd = 0
    self.mvStrafe = 0
endfunction

' -- read-back --

function x()
    return self.px
endfunction
function y()
    return self.py
endfunction
function z()
    return self.pz
endfunction
function angle()
    return self.ang
endfunction
function pitch()
    return self.pit
endfunction
function onGround()
    return self.grounded
endfunction

EndClass
```

- [ ] **Step 2: Check calls against defs**

- `math.cos/sin/floor/clamp` — `math.bas`. `RcConfig.RC_*` prefixed.
- `self.wld.wallAt/floorHeightAt/ceilHeightAt` — `RcWorld.bas`.
- `w.floorHeightAt(...)` in the `Constructor` (before `self.wld` is set — uses the param `w` directly) — fine.
- bare `return 1` / `return 0` in `blocked` (a function) — valid (RcCast/RcRender use bare returns).
- `<>` not-equal — valid.
- No `new` of another class here (unlike RcRender) — RcMover is a leaf.

- [ ] **Step 3: Extend the smoke test**

In `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`:
- add `RcMover: typeof _sb_rcmover !== 'undefined' ? _sb_rcmover : null` to `evalDemo`'s return + the `RcRenderLike`/return-type block.
- add a `test.each(phaseDirs)` case: `if (!mod.RcMover) return;` — `const m = new mod.RcMover(stubWorld, 2, 2, 0.3, 0.6); m.move(1, 0); m.turn(0.1); m.look(10); m.jump(); expect(() => m.step(16)).not.toThrow(); expect(typeof m.x()).toBe('number'); expect(typeof m.onground()).toBe('number');` (emitted names are lowercased: `x`, `y`, `z`, `angle`, `pitch`, `onground`, `step`, `move`, `turn`, `look`, `jump`). `stubWorld` already has `floorheightat`/`ceilheightat`/`wallat` returning numbers — enough.

Run `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` → green (RcMover branch skipped for p1/p2/p3 until the p4 dir lands in Task 5).

- [ ] **Step 4: Transpile probe**

`tests/scratch/rcMover.probe.ts` — transpile `RcConfig` + `RcWorld` + `RcCast` + `RcRender` + `RcMover` + a `Main.bas` stub, dependency-sorted, `expect(diagnostics).toEqual([])`. Run via scratch config. Iterate. Delete when green.

- [ ] **Step 5: Verify + commit**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo
npx vitest run
npx vite build
```

```bash
git add demo-src/raycaster/lib/RcMover.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcMover.bas height-aware locomotion + collision (Phase 4)"
```

---

## Task 3: `RcRender` — bind a mover as the camera

**Files:** Modify `demo-src/raycaster/lib/RcRender.bas`; re-sync `demo-src/raycaster-p3/RcRender.bas`; adjust the smoke test.

- [ ] **Step 1: Add `camZ` + `bindCamera`**

In `RcRender.bas`:
- add `dim camZ` and `dim boundMover` to the class fields; init `self.camZ = 0` and `self.boundMover = 0` in the `Constructor`.
- add:

```basic
function bindCamera(mover)
    self.boundMover = mover
endfunction
```

- in `projectY(h, d)`, change the eye term from `RcConfig.RC_EYE_Z` to `(self.camZ + RcConfig.RC_EYE_Z)`:

```basic
    return self.scy + (self.camZ + RcConfig.RC_EYE_Z - h) * (self.viewH / dd) + self.camPitch
```

- at the very top of `renderFrame()` (before `horizon = ...`), pull camera state from the bound mover if one is set:

```basic
    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
        self.camZ = self.boundMover.z()
    endif
```

VERIFY `self.boundMover <> 0` works for an unset object field (softBASIC `dim boundMover` with no assignment, then `self.boundMover = 0` in ctor — comparing `<> 0` should be fine; if the transpiler complains about calling `.x()` on a possibly-non-object, the guard already prevents that path). Check how `dim` object fields default and whether `= 0` / `<> 0` is the right sentinel (RcRender's Phase 3 code doesn't have object fields beyond `wld`/`rc` which are always set in the ctor — this is new; if `0` is a bad sentinel, use a separate `dim hasMover` flag set to 1 in `bindCamera`).

- [ ] **Step 2: Phase 3 probes still hold**

The Phase 3 demo (`raycaster-p3`) asserts `projectY(0.5, d) = scy`, `projectY(0, 1) = viewH`, `projectY(1, 1) = 0` with **no bound mover** (so `camZ = 0`). With `camZ = 0` the new formula reduces to the old one — confirm the three identities still hold. Re-sync the p3 copy and run its transpile + smoke coverage.

```bash
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas
```

- [ ] **Step 3: Smoke test**

The existing `RcRender` smoke case constructs `new RcRender(stubWorld)` and calls `renderframe()` with no bound mover — still valid (the `boundMover <> 0` guard skips the pull). Add one line: `r.bindcamera(new mod.RcMover(stubWorld, 2, 2, 0.3, 0.6)); expect(() => r.renderframe()).not.toThrow();` (only where both classes exist). Confirm green.

- [ ] **Step 4: Transpile probe + verify + commit**

`tests/scratch/rcRenderBind.probe.ts` — transpile the full lib set. Clean.

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo
npx vitest run
npx vite build
```

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcRender.bindCamera + camera eye height from bound mover"
```

---

## Task 4: Phase 4 room

**Files:** Create `demo-src/raycaster-p4/assets/p4room.stm`, `rc_placeholder_tiles.png`.

The Phase 3 room's first stair is `floor:0.35` — exactly `RC_STEP_UP`, a fragile test threshold. The Phase 4 room is purpose-built with heights that are unambiguously above/below the step-up limit.

- [ ] **Step 1: Copy the tilesheet**

```bash
mkdir -p demo-src/raycaster-p4/assets
cp demo-src/raycaster-p3/assets/rc_placeholder_tiles.png demo-src/raycaster-p4/assets/rc_placeholder_tiles.png
```

- [ ] **Step 2: Create `demo-src/raycaster-p4/assets/p4room.stm`**

A 12×8 room. Row 4 is the test corridor east of the spawn: a clearly-steppable `floor:0.3` ledge at col 4, a clearly-blocking `floor:0.9` wall-ledge at col 6, a deep pit `floor:-3` at col 8, an atrium `ceil:3` at col 10.

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 4, "col": 4, "tag": "floor:0.3" },
        { "row": 4, "col": 5, "tag": "floor:0.3" },
        { "row": 4, "col": 6, "tag": "floor:0.9" },
        { "row": 4, "col": 7, "tag": "floor:0.9" },
        { "row": 4, "col": 8, "tag": "floor:-3" },
        { "row": 3, "col": 10, "tag": "ceil:3" },
        { "row": 4, "col": 10, "tag": "ceil:3" },
        { "row": 5, "col": 10, "tag": "ceil:3" }
      ]
    }
  }
}
```

Validate: `node -e "JSON.parse(require('fs').readFileSync('demo-src/raycaster-p4/assets/p4room.stm','utf8'));console.log('ok')"`.

- [ ] **Step 3: Commit**

```bash
git add demo-src/raycaster-p4/assets
git commit -m "test(raycaster): Phase 4 walkable room with unambiguous step-up thresholds"
```

---

## Task 5: Phase 4 demo — walkable scene

**Files:** Create `demo-src/raycaster-p4/Main.bas`, `WalkScene.bas`, 5 lib copies; transient probe; `src/docs/demos/RaycasterP4Walk.b4wgl.json`.

### Probe expectations (deterministic, run in `onenter` by stepping manually)

Movers created at `radius 0.3`, `bodyHeight 0.6`. `p4room.stm` heights: border walls id 1; interior floor 0, ceiling 1.0; `floor:0.3` at (col4,row4) and (col5,row4) — **steppable** (`0.3 < RC_STEP_UP 0.35`); `floor:0.9` at (col6,row4) and (col7,row4) — **blocking** (`0.9 > 0.35`); `floor:-3` pit at (col8,row4); atrium `ceil:3` at col10 rows 3–5.

The four probes (all in `runProbes()`, all forcing ERR on failure):
- **start z:** spawn mover at `(2, 4)` → `me.z()` ≈ `0` (floor at that cell).
- **blocked by west wall:** fresh mover at `(2, 4)`, `turn(pi())` to face west, then `move(RC_MOVE_SPEED, 0)` + `step(16)` ×25. `x()` stays `> 1.0` (the col-0 border wall + radius 0.3 stops it well before x=1).
- **step up onto the 0.3 ledge:** fresh mover at `(3.5, 4.5)` facing east (ctor default angle 0), `move` + `step` ×20. `z()` ≈ `0.3` (within 0.02) AND `x() > 4.0` (crossed into col 4).
- **blocked by the 0.9 ledge:** fresh mover at `(5.5, 4.5)` STANDING on the `floor:0.3` ledge (spawn there so ctor z = 0.3), facing east, `move` + `step` ×20. It reaches col 6 (`floor:0.9`): `0.9 - 0.3 = 0.6 > RC_STEP_UP` → blocked. `x()` stays `< 6.0` (never enters col 6) AND `z()` stays ≈ `0.3`.
- **jump:** fresh mover at `(2, 2)`, `onGround()` == 1. `jump()`, `step(16)` → `onGround()` == 0 AND `z() > 0.001`.

That's 5 probes; ship all 5 (they're cheap and each pins a distinct behaviour).

- [ ] **Step 1: `WalkScene.bas`**

```basic
Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim hintText as Text

Constructor()
    input.bind("fwd", "key", keyboard.W)
    input.bind("back", "key", keyboard.S)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sr", "key", keyboard.E)
    input.bind("tl", "key", keyboard.A)
    input.bind("tr", "key", keyboard.D)
    input.bind("lookup", "key", keyboard.UP)
    input.bind("lookdown", "key", keyboard.DOWN)
    input.bind("jump", "key", keyboard.SPACE)
EndConstructor

function onenter()
    world.setBackground(0, 0, 0)
    self.tm = new tilemapset("p4room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 2.0, 4.0, 0.3, 0.6)
    self.ren.bindCamera(self.me)

    self.titleText = new Text("Raycaster P4 - walk", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  up/down look  space jump", 12, 30)
    self.hintText.setStyle(12, 180, 200, 220)
    hud.add(self.hintText)

    self.runProbes()
endfunction

function runProbes()
    dim a as RcMover
    dim b as RcMover
    dim c as RcMover
    dim j as RcMover
    dim i
    dim okStart
    dim okWall
    dim okStep
    dim okBlock
    dim okJump

    okStart = 0
    if math.abs(self.me.z()) < 0.01 then
        okStart = 1
    endif
    self.probe("start z on floor", okStart, 52)

    a = new RcMover(self.wld, 2.0, 4.0, 0.3, 0.6)
    a.turn(math.pi())
    for i = 0 to 24
        a.move(RcConfig.RC_MOVE_SPEED, 0)
        a.step(16)
    next i
    okWall = 0
    if a.x() > 1.0 then
        okWall = 1
    endif
    self.probe("blocked by west wall", okWall, 72)

    b = new RcMover(self.wld, 3.5, 4.5, 0.3, 0.6)
    for i = 0 to 24
        b.move(RcConfig.RC_MOVE_SPEED, 0)
        b.step(16)
    next i
    okStep = 0
    if math.abs(b.z() - 0.3) < 0.02 then
        if b.x() > 4.0 then
            okStep = 1
        endif
    endif
    self.probe("stepped up onto 0.3 ledge", okStep, 92)

    c = new RcMover(self.wld, 5.5, 4.5, 0.3, 0.6)
    for i = 0 to 24
        c.move(RcConfig.RC_MOVE_SPEED, 0)
        c.step(16)
    next i
    okBlock = 0
    if c.x() < 6.0 then
        if math.abs(c.z() - 0.3) < 0.05 then
            okBlock = 1
        endif
    endif
    self.probe("blocked by the 0.9 ledge", okBlock, 112)

    j = new RcMover(self.wld, 2.0, 2.0, 0.3, 0.6)
    j.jump()
    j.step(16)
    okJump = 0
    if j.onGround() = 0 then
        if j.z() > 0.001 then
            okJump = 1
        endif
    endif
    self.probe("jump leaves the ground", okJump, 132)
endfunction

function probe(label, passed, y)
    dim result
    dim t as Text
    dim missing
    dim boom
    ' A failed probe must throw a caught runtimeError -- canvas text is invisible
    ' to the Cypress "no ERR" guard.
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
    dim turn
    dim lookd

    fwd = input.axis("back", "fwd")
    strafe = input.axis("sl", "sr")
    turn = input.axis("tl", "tr")
    lookd = input.axis("lookdown", "lookup")

    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turn <> 0 then
        self.me.turn(turn * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    if lookd <> 0 then
        self.me.look(lookd * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
    endif
    if input.pressed("jump") then
        self.me.jump()
    endif

    self.me.step(delta)
    self.ren.renderFrame()
endfunction

EndClass
```

VERIFY every call: `input.bind/axis/pressed` (`input.bas`), `keyboard.W/A/S/D/Q/E/UP/DOWN/SPACE` (`keyboard.bas`), `math.pi()`/`math.abs`, `Text`/`setStyle`, `hud.add`, `world.setBackground`, `Extends scene` + `Constructor()` + `onenter` + `onupdate(delta)`. `dim x as RcMover` typed locals — confirm typed local class vars work (RcRender's ctor does `dim` untyped; SpanViewScene does `dim rc as RcCast`). `self.me.*` / `self.ren.*` match `RcMover.bas` / `RcRender.bas`. All `dim`s hoisted.

The turn/look direction (`input.axis("tl","tr")` etc.) — sign may feel inverted in play; that's a polish detail, the probes don't depend on live input.

- [ ] **Step 2: `Main.bas`**

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim walk = new WalkScene()
scenemanager.register("walk", walk)
scenemanager.switch("walk")
```

- [ ] **Step 3: Lib copies**

```bash
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p4/RcConfig.bas
cp demo-src/raycaster/lib/RcWorld.bas  demo-src/raycaster-p4/RcWorld.bas
cp demo-src/raycaster/lib/RcCast.bas   demo-src/raycaster-p4/RcCast.bas
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p4/RcRender.bas
cp demo-src/raycaster/lib/RcMover.bas  demo-src/raycaster-p4/RcMover.bas
```

- [ ] **Step 4: Transpile probe** — `tests/scratch/p4demo.probe.ts` pointed at `demo-src/raycaster-p4`. Iterate until clean. Delete when green.

- [ ] **Step 5: Smoke** — `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` — RcMover + RcRender+bind cases now active for `raycaster-p4`. Green.

- [ ] **Step 6: Build the export** — `npm run build:demo -- demo-src/raycaster-p4 RaycasterP4Walk`.

- [ ] **Step 7: Verify + commit**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo
npx vitest run
npx vite build
git add demo-src/raycaster-p4 src/docs/demos/RaycasterP4Walk.b4wgl.json
git commit -m "test(raycaster): Phase 4 walkable demo scene + movement probes"
```

---

## Task 6: Wire the demo + Cypress

**Files:** Modify `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`.

- [ ] **Step 1:** `devDemoRegistry.ts` — add (mirror the P3 entry):

```ts
  {
    slug: 'raycaster-p4-walk',
    name: 'Raycaster P4 — Walk',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 4 probe: RcMover walks the room — circle-vs-wall collision, step-up, gravity, jump — with the camera bound to the mover.',
    docsSlug: '',
    file: 'RaycasterP4Walk',
  },
```

- [ ] **Step 2:** `tests/ui/features/demos/devDemoRegistry.test.ts` — add `includes the Phase 4 walk demo` mirror test.

- [ ] **Step 3:** `cypress/e2e/demos.cy.ts` `DEV_DEMOS` — add `{ slug: 'raycaster-p4-walk', title: 'Raycaster P4 — Walk', waitMs: 4000 }`.

- [ ] **Step 4:** `npx vitest run`, `npx vite build` — green/clean.

- [ ] **Step 5: E2E** if a browser is available — all four demos pass; break a P4 probe, rebuild, confirm ERR, restore. Also eyeball: walk forward, turn, walk up the stairs (view rises), walk off into the pit (view drops), jump. If no browser, note manual verification pending + give the wiring trace.

- [ ] **Step 6: Commit**

```bash
git add src/features/demos/devDemoRegistry.ts cypress/e2e/demos.cy.ts tests/ui/features/demos/devDemoRegistry.test.ts
git commit -m "test(raycaster): wire Phase 4 walk demo into dev registry + e2e"
```

---

## Task 7: Docs + roadmap

**Files:** Modify `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`.

- [ ] **Step 1: Guide** — add `## RcMover — walking around` after `RcRender`. Verify names against `RcMover.bas`:

```markdown
## RcMover — walking around

`RcMover` is one movable body. Feed it intent each frame, call `step`, and it
resolves the move against the world — sliding along walls, stepping up small
ledges, falling into pits, and jumping. Bind it to the renderer so the view
follows it.

```basic
dim me as RcMover

function onenter()
  self.me = new RcMover(self.wld, 2, 4, 0.3, 0.6)   ' world, x, y, radius, body height
  self.ren.bindCamera(self.me)
endfunction

function onupdate(delta)
  self.me.move(input.axis("back", "fwd") * 2.5, 0)
  self.me.turn(input.axis("tl", "tr") * 2.0 * (delta / 1000))
  if input.pressed("jump") then
    self.me.jump()
  endif
  self.me.step(delta)
  self.ren.renderFrame()
endfunction
```

| Call | Does |
|---|---|
| `new RcMover(world, x, y, radius, bodyHeight)` | a body standing on the floor at `(x, y)` |
| `me.move(forward, strafe)` | set this frame's move speed (units/sec); resolved by `step` |
| `me.turn(deltaAngle)` / `me.look(deltaPitch)` | rotate / tilt the view |
| `me.jump()` | jump if on the ground |
| `me.step(delta)` | resolve one frame of movement + gravity — call every `onupdate` |
| `me.x()` / `me.y()` / `me.z()` | current position (`z` is feet height) |
| `me.angle()` / `me.pitch()` / `me.onGround()` | facing, tilt, whether standing on solid ground |

### Phase 4 limits

Movers don't collide with each other yet, lifts don't move, and rooms stacked
above a cell aren't handled. Tune movement with `RcConfig.RC_MOVE_SPEED`,
`RC_STEP_UP`, `RC_GRAVITY`, `RC_JUMP_VEL`.
```

- [ ] **Step 2: Roadmap** — update the "Raycaster library (in progress)" item in both files: Phase 4 (`RcMover` height-aware locomotion + collision, camera-bound) shipped; phases 5–10 remain.

- [ ] **Step 3:** `npx vite build`, `npx vitest run`, commit `docs(raycaster): Phase 4 RcMover guide section + roadmap`.

---

## Task 8: Phase 4 close-out

- [ ] `npx vitest run` → all green, only the pre-existing skip.
- [ ] `npx vite build` → clean.
- [ ] `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` → transpile + lib-sync + smoke green, covering `raycaster-p4/` and driving `RcMover` + `RcRender.bindCamera`.
- [ ] `raycaster-p4-walk` absent from `src/features/demos/demoRegistry.ts`, not on `/demos`.
- [ ] **Manual Cypress** — all four demos pass; break a P4 probe → ERR → restore. Eyeball the walkthrough: forward/turn/strafe, stairs raise the view, the pit drops it, jump arcs, walls block. Flag anything wrong.
- [ ] **Spec check** — re-read spec §7 / §7.3 / §11 phase 4. All actor-vs-static collision in `RcMover` ✓; intent → `step` API ✓; `RcRender.bindCamera` + mover writes camera ✓; step-up / head-clearance / gravity / pit-fall ✓. Deferrals (actor-vs-actor, lifts, upper regions) noted in `RcMover.bas` header. Note any gap as a follow-up.

---

## Notes for later phases (not this plan)

- **Phase 5 (`RcLights`)** — the per-strip tint. This is where the generic `drawing.js` sprite/graphics pooling fix (spec §5.3 rung 1) should land first, given the marginal Phase 3 frame time. Consider a small `2026-XX-XX-drawing-throughput.md` plan before Phase 5 proper.
- **Mouse look** — `input.mouseX()` deltas → `me.turn`/`me.look`. Phase 4 uses keyboard look (arrows) for determinism; add mouse as a polish task.
- **`RcMover` actor-vs-actor** (spec §7.1) — Phase 6 (`RcActors`) will need enemies as movers; add the opt-in spatial check then.
- **Region resolution (main vs `upper`)** — Phase 8, when `RcWorld` upper regions exist. `blocked()` and the gravity ground query will need to pick the region by height.
- **Animated lifts** — a `lift` cell whose `floorH` changes over time; needs `RcWorld` mutable heights + the mover carrying the actor. Post-Phase-8.
