# Raycaster Engine — Phase 2: `RcCast` Span Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `RcCast.bas` — a softBASIC module that DDA-marches the grid from a ray origin/direction and collects an ordered list of surface **spans** (wall, floor-step, ceiling-step) without stopping at the first wall — plus a `los()` line-of-sight helper, verified by an unlisted `raycaster-p2` Cypress demo that visualises spans top-down and force-`ERR`s on a failed probe.

**Architecture:** Pure softBASIC (spec §1.1), no engine changes expected. `RcCast` is a stateful object: `cast(world, ox, oy, dx, dy)` fills reused member arrays; the caller reads them via `spanCount()` / `spanKind(i)` / `spanDist(i)` / etc. Phase 2 emits spans in **world-space vertical extent** (`lo`/`hi` heights) — screen projection and the per-column occlusion window are Phase 3's job. Upper regions (`cell.upper`) are skipped until Phase 8.

**Tech Stack:** softBASIC, Vitest (transpile guards only — `.bas` logic is Cypress-verified per spec §1.2), Cypress e2e.

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` — implements §4.1 (span builder, world-space subset), §4.3 (`los`), §9.4 (`RC_MAX_DIST`), phase 2 of §11. Screen-space span fields (`screenTop`/`screenBottom`) and §4.1-step-3 occlusion-window termination are explicitly deferred to Phase 3. §4.2 diagonal tiles are Phase 7.

---

## Background the implementer needs

- **Phase 1 shipped** `demo-src/raycaster/lib/RcWorld.bas` (commit range `d26480e`..`dc1d496`). It's a softBASIC class: `new RcWorld(tm as tilemapset, wallsLayerName)`, accessors `widthCells()`, `heightCells()`, `wallAt(col,row)` (OOB→1), `floorHeightAt(col,row)` (OOB→0), `ceilHeightAt(col,row)` (OOB→1.0), `flagsAt(col,row)`, `hasUpperAt(col,row)`, `wallTexAt(col,row)` (→""). It also has (not yet in the guide) `floorTexAt`/`ceilTexAt`? — **CHECK**: read `RcWorld.bas`; if `floorTexAt(col,row)` / `ceilTexAt(col,row)` accessors don't exist, Task 1 adds them (they're needed for step-span textures and are trivial — same shape as `wallTexAt`).
- **The reference DDA loop** is `demo-src/raycaster/GameScene.bas` `castRays()` (~line 388). Phase 2 reuses its setup math (`deltaDistX/Y = abs(1/rayDir)`, `sideDistX/Y` init, `stepX/Y`) and its no-fisheye perpendicular-distance identity. The difference: the `while` loop does not stop at the first wall, and it records the entry distance to every cell crossed.
- **softBASIC facts** (verified): `const NAME = value` and `const` … `endconst` blocks work at file top level (see `defs/keyboard.bas`); consts are globally visible after declaration. `array.clear(arr)` empties an array in place (`splice(0)`). `and`/`or`/`not` work in `if`. No `elseif`. No `%`/bitwise. `math.val(s)` = `Number(s)`. Function-scoped `dim` must be hoisted to the top of the function. `.field` access requires a typed variable (`dim x as Type`); untyped record field access does not parse — but `allMarkers`-style records aren't used here.
- **`build:demo` is non-recursive** — each demo dir needs its own copies of the lib `.bas` files. `tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts` enforces the copies stay byte-identical to `demo-src/raycaster/lib/`; `tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts` transpile-checks every `demo-src/raycaster-p*/`. Both auto-discover new phase dirs.
- **Probe scenes MUST force a runtime error on a failed check** (not just draw "FAIL" text) — see `demo-src/raycaster-p1/MapProbeScene.bas` `probe()` helper: `array.arrLength(missing)` on an unassigned `dim` throws a caught `runtimeError` that surfaces as `ERR`, which the Cypress guard asserts absent.

---

## File Structure

**Created:**
- `demo-src/raycaster/lib/RcConfig.bas` — `const` block: `RC_MAX_DIST` + span-kind constants. The library's shared constants file; grows each phase.
- `demo-src/raycaster/lib/RcCast.bas` — the span builder. One responsibility: DDA-march + span collection + `los`. Stateful (reused member arrays).
- `demo-src/raycaster-p2/Main.bas`
- `demo-src/raycaster-p2/SpanViewScene.bas` — top-down span visualiser + probes.
- `demo-src/raycaster-p2/RcConfig.bas`, `RcWorld.bas`, `RcCast.bas` — copies (buildDemo is flat).
- `demo-src/raycaster-p2/assets/p2map.stm` — the Phase 2 test map.
- `demo-src/raycaster-p2/assets/rc_placeholder_tiles.png` — copy of the Phase 1 placeholder.
- `src/docs/demos/RaycasterP2SpanCast.b4wgl.json` — generated, committed.

**Modified:**
- `demo-src/raycaster/lib/RcWorld.bas` — add `floorTexAt` / `ceilTexAt` accessors IF absent (Task 1).
- `src/features/demos/devDemoRegistry.ts` — add `raycaster-p2-spancast`.
- `cypress/e2e/demos.cy.ts` — add to `DEV_DEMOS`.
- `src/docs/guides/raycaster-library.md` — add an `RcCast` section.
- `docs/roadmap.md`, `docs/language/library-roadmap.md` — mark Phase 2 shipped.

---

## Task 1: `RcWorld` step-texture accessors (only if missing)

**Files:**
- Modify: `demo-src/raycaster/lib/RcWorld.bas`

- [ ] **Step 1: Check**

Read `demo-src/raycaster/lib/RcWorld.bas`. It has `wallTexAt(col, row)`. Does it also have `floorTexAt(col, row)` and `ceilTexAt(col, row)` (returning `floorTexArr`/`ceilTexArr` entries, OOB → `""`)?

- If BOTH exist: skip to Task 2 entirely (no commit for this task).
- If either is missing: add it/them, mirroring `wallTexAt` exactly:

```basic
function floorTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.floorTexArr(row * self.cols + col)
endfunction

function ceilTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.ceilTexArr(row * self.cols + col)
endfunction
```

Place them next to `wallTexAt`.

- [ ] **Step 2: Sync the Phase 1 demo copy**

If you changed `RcWorld.bas`:
```bash
cp demo-src/raycaster/lib/RcWorld.bas demo-src/raycaster-p1/RcWorld.bas
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit** (only if you changed files)

```bash
git add demo-src/raycaster/lib/RcWorld.bas demo-src/raycaster-p1/RcWorld.bas
git commit -m "feat(raycaster): RcWorld floorTexAt / ceilTexAt accessors"
```

---

## Task 2: `RcConfig.bas` — shared constants  ✅ DONE (commit `d7d4a7c`)

**Outcome / key finding for later tasks:** bare cross-file `const` access does NOT
work in this compiler. Constants must be referenced **prefixed** —
`RcConfig.RC_MAX_DIST`, `RcConfig.RC_SPAN_WALL`, etc. — exactly like `keyboard.W`.
`sortByDependencies` picks up the `RcConfig.` reference as a dependency edge and
orders `RcConfig.bas` first, so this is safe for both the transpile guard and the
app build. **Every `RC_*` reference in Tasks 3, 5, and 7 below must be written
`RcConfig.RC_*`** — the code blocks were drafted with bare names; prefix them.

The committed file (`demo-src/raycaster/lib/RcConfig.bas`) is:

```basic
' RcConfig -- shared constants for the raycaster library.
' Grows each phase. See docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §9.4.
const
  RC_MAX_DIST = 32
  RC_SPAN_WALL = 0
  RC_SPAN_FLOORSTEP = 1
  RC_SPAN_CEILSTEP = 2
endconst
```

<details><summary>Original Step 1–3 (superseded)</summary>

- [ ] **Step 1: Create the file**  — done, see above

- [ ] **Step 2: Verify cross-file const visibility**

Create `tests/scratch/rcConfigVis.probe.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../src/constants/packageModules';

describe('RcConfig const visible cross-file', () => {
  test('another .bas file can read RC_MAX_DIST', () => {
    const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
    const result = compiler.transpile({
      lib,
      files: [
        { name: 'RcConfig.bas', source: readFileSync('demo-src/raycaster/lib/RcConfig.bas', 'utf-8') },
        { name: 'Main.bas', source: 'function t()\n  dim x\n  x = RC_MAX_DIST + RC_SPAN_WALL\nendfunction\n' },
      ],
    });
    expect(result.diagnostics).toEqual([]);
  });
});
```

Run: `npx vitest run --config tests/scratch/vitest.scratch.config.ts tests/scratch/rcConfigVis.probe.ts`
Expected: PASS, `diagnostics` empty.

If it FAILS with an ordering diagnostic (const referenced before declared), the demo's file order matters — note that `RcConfig.bas` must sort first; `sortByDependencies` (used by the transpile guard and the app) may not order a bare const file. If so, the fix is: the transpile guard and `buildDemo` order files, but a const file has no `import`/dependency edge. Check how `sortByDependencies` handles a file that only declares consts — if it can't guarantee order, either (a) rename so it sorts first alphabetically AND confirm the app's build also sorts alphabetically as a tiebreak, or (b) put the consts at the top of `RcCast.bas` instead of a separate file. Prefer (b) if ordering is fragile — one file, no ordering question. Record the decision in the file's comment and in Task 7's guide note.

Delete the probe if `rm` works (gitignored otherwise).

- [ ] **Step 3: Commit**

```bash
git add demo-src/raycaster/lib/RcConfig.bas
git commit -m "feat(raycaster): RcConfig.bas shared constants"
```

(If you chose option (b) — consts inside `RcCast.bas` — there is no `RcConfig.bas`; fold this into Task 3's commit and adjust the file lists in Tasks 5/6.)

</details>

---

## Task 3: `RcCast.bas` — the span builder

**Files:**
- Create: `demo-src/raycaster/lib/RcCast.bas`

No unit tests (spec §1.2). Verified by the Phase 2 demo (Task 5) and the transpile guard. Write carefully against the reference DDA in `demo-src/raycaster/GameScene.bas` `castRays()`.

- [ ] **Step 1: Create the module**

```basic
' RcCast -- raycaster span builder (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §4).
' DDA-marches the grid from a ray origin/direction and collects an ordered
' (near->far) list of surface spans. Does NOT stop at the first wall.
'
' Span kinds: RcConfig.RC_SPAN_WALL, RcConfig.RC_SPAN_FLOORSTEP, RcConfig.RC_SPAN_CEILSTEP.
' Each span carries: dist (perpendicular, no fisheye), lo/hi (world-space
' vertical extent), col/row (source cell), u (wall texture coord 0..1; 0 for
' steps), tex (texture id string).
'
' Phase 2 scope: no screen projection (Phase 3), no occlusion-window early-out
' (Phase 3), no upper regions (Phase 8), no diagonal tiles (Phase 7).
Class

dim kindArr(0)
dim distArr(0)
dim loArr(0)
dim hiArr(0)
dim colArr(0)
dim rowArr(0)
dim uArr(0)
dim texArr(0)

Constructor()
EndConstructor

function reset()
    array.clear(self.kindArr)
    array.clear(self.distArr)
    array.clear(self.loArr)
    array.clear(self.hiArr)
    array.clear(self.colArr)
    array.clear(self.rowArr)
    array.clear(self.uArr)
    array.clear(self.texArr)
endfunction

function addSpan(kind, dist, lo, hi, col, row, u, tex)
    array.push(self.kindArr, kind)
    array.push(self.distArr, dist)
    array.push(self.loArr, lo)
    array.push(self.hiArr, hi)
    array.push(self.colArr, col)
    array.push(self.rowArr, row)
    array.push(self.uArr, u)
    array.push(self.texArr, tex)
endfunction

' Marches from (ox, oy) along unit-ish direction (dx, dy). Fills the span arrays.
function cast(world as RcWorld, ox, oy, dx, dy)
    dim mapX
    dim mapY
    dim deltaDistX
    dim deltaDistY
    dim stepX
    dim stepY
    dim sideDistX
    dim sideDistY
    dim side
    dim entryDist
    dim runFloor
    dim runCeil
    dim iters
    dim cellFloor
    dim cellCeil
    dim wallHere
    dim wallX
    dim u
    dim lo
    dim hi

    self.reset()

    mapX = math.floor(ox)
    mapY = math.floor(oy)

    if math.abs(dx) < 0.0001 then
        deltaDistX = 1000000
    else
        deltaDistX = math.abs(1.0 / dx)
    endif
    if math.abs(dy) < 0.0001 then
        deltaDistY = 1000000
    else
        deltaDistY = math.abs(1.0 / dy)
    endif

    if dx < 0 then
        stepX = -1
        sideDistX = (ox - mapX) * deltaDistX
    else
        stepX = 1
        sideDistX = (mapX + 1.0 - ox) * deltaDistX
    endif
    if dy < 0 then
        stepY = -1
        sideDistY = (oy - mapY) * deltaDistY
    else
        stepY = 1
        sideDistY = (mapY + 1.0 - oy) * deltaDistY
    endif

    runFloor = world.floorHeightAt(mapX, mapY)
    runCeil = world.ceilHeightAt(mapX, mapY)

    iters = 0
    while iters < 512
        iters = iters + 1

        if sideDistX < sideDistY then
            entryDist = sideDistX
            sideDistX = sideDistX + deltaDistX
            mapX = mapX + stepX
            side = 0
        else
            entryDist = sideDistY
            sideDistY = sideDistY + deltaDistY
            mapY = mapY + stepY
            side = 1
        endif

        if entryDist > RcConfig.RC_MAX_DIST then
            return
        endif

        wallHere = world.wallAt(mapX, mapY)
        if wallHere > 0 then
            if side = 0 then
                wallX = oy + entryDist * dy
            else
                wallX = ox + entryDist * dx
            endif
            u = wallX - math.floor(wallX)
            self.addSpan(RcConfig.RC_SPAN_WALL, entryDist, runFloor, runCeil, mapX, mapY, u, world.wallTexAt(mapX, mapY))
            return
        endif

        cellFloor = world.floorHeightAt(mapX, mapY)
        cellCeil = world.ceilHeightAt(mapX, mapY)

        if cellFloor <> runFloor then
            lo = math.min(runFloor, cellFloor)
            hi = math.max(runFloor, cellFloor)
            self.addSpan(RcConfig.RC_SPAN_FLOORSTEP, entryDist, lo, hi, mapX, mapY, 0, world.floorTexAt(mapX, mapY))
            runFloor = cellFloor
        endif

        if cellCeil <> runCeil then
            lo = math.min(runCeil, cellCeil)
            hi = math.max(runCeil, cellCeil)
            self.addSpan(RcConfig.RC_SPAN_CEILSTEP, entryDist, lo, hi, mapX, mapY, 0, world.ceilTexAt(mapX, mapY))
            runCeil = cellCeil
        endif
    endwhile
endfunction

' Line-of-sight: distance to the first opaque wall along (dx,dy), or -1 if none
' within RC_MAX_DIST. Same march, no span construction.
function los(world as RcWorld, ox, oy, dx, dy)
    dim mapX
    dim mapY
    dim deltaDistX
    dim deltaDistY
    dim stepX
    dim stepY
    dim sideDistX
    dim sideDistY
    dim entryDist
    dim iters

    mapX = math.floor(ox)
    mapY = math.floor(oy)

    if math.abs(dx) < 0.0001 then
        deltaDistX = 1000000
    else
        deltaDistX = math.abs(1.0 / dx)
    endif
    if math.abs(dy) < 0.0001 then
        deltaDistY = 1000000
    else
        deltaDistY = math.abs(1.0 / dy)
    endif

    if dx < 0 then
        stepX = -1
        sideDistX = (ox - mapX) * deltaDistX
    else
        stepX = 1
        sideDistX = (mapX + 1.0 - ox) * deltaDistX
    endif
    if dy < 0 then
        stepY = -1
        sideDistY = (oy - mapY) * deltaDistY
    else
        stepY = 1
        sideDistY = (mapY + 1.0 - oy) * deltaDistY
    endif

    iters = 0
    while iters < 512
        iters = iters + 1
        if sideDistX < sideDistY then
            entryDist = sideDistX
            sideDistX = sideDistX + deltaDistX
            mapX = mapX + stepX
        else
            entryDist = sideDistY
            sideDistY = sideDistY + deltaDistY
            mapY = mapY + stepY
        endif
        if entryDist > RcConfig.RC_MAX_DIST then
            return -1
        endif
        if world.wallAt(mapX, mapY) > 0 then
            return entryDist
        endif
    endwhile
    return -1
endfunction

' -- read accessors --

function spanCount()
    return array.arrLength(self.kindArr)
endfunction

function spanKind(i)
    return self.kindArr(i)
endfunction

function spanDist(i)
    return self.distArr(i)
endfunction

function spanLo(i)
    return self.loArr(i)
endfunction

function spanHi(i)
    return self.hiArr(i)
endfunction

function spanCol(i)
    return self.colArr(i)
endfunction

function spanRow(i)
    return self.rowArr(i)
endfunction

function spanU(i)
    return self.uArr(i)
endfunction

function spanTex(i)
    return self.texArr(i)
endfunction

EndClass
```

- [ ] **Step 2: Check calls against defs**

- `math.min`, `math.max`, `math.abs`, `math.floor` — `math.bas` (all present; `min(a,b)`/`max(a,b)` two-arg).
- `array.clear`, `array.push`, `array.arrLength` — `array.bas`.
- `world.floorHeightAt` etc. — `RcWorld.bas` (+ `floorTexAt`/`ceilTexAt` from Task 1).
- `<>` is softBASIC "not equal" — confirm against an existing `.bas` (`demo-src/dungeon-explorer/Boss.bas:177` uses `<>`). Yes.
- `RcConfig.RC_MAX_DIST`, `RcConfig.RC_SPAN_*` — from `RcConfig.bas` (Task 2). **Must be prefixed** — bare `RC_MAX_DIST` does not resolve cross-file (Task 2 finding).
- `return` with no value inside a `function` (the early `return` in `cast`) — confirm softBASIC allows a bare `return` in a function that elsewhere has no return value. If it requires `return 0` or an explicit form, adjust `cast`'s early exits. Check an existing `.bas` with a void-ish function that early-returns.

- [ ] **Step 3: Transpile probe**

Create `tests/scratch/rcCastCompiles.probe.ts` (same shape as the Phase 1 probe — transpile `RcConfig.bas` + `RcWorld.bas` + `RcCast.bas` + a `Main.bas` stub against `packageModules`, `expect(diagnostics).toEqual([])`). Order files: `RcConfig`, `RcWorld`, `RcCast`, `Main`.

Run via `npx vitest run --config tests/scratch/vitest.scratch.config.ts tests/scratch/rcCastCompiles.probe.ts`. Iterate on `.bas` syntax until clean. If stuck after genuine effort, report BLOCKED with the diagnostic.

Delete the probe when green.

- [ ] **Step 4: Commit**

```bash
git add demo-src/raycaster/lib/RcCast.bas
git commit -m "feat(raycaster): RcCast.bas DDA span builder + los (Phase 2)"
```

---

## Task 4: Phase 2 test map

**Files:**
- Create: `demo-src/raycaster-p2/assets/p2map.stm`
- Create: `demo-src/raycaster-p2/assets/rc_placeholder_tiles.png`

- [ ] **Step 1: Copy the placeholder tilesheet**

```bash
mkdir -p demo-src/raycaster-p2/assets
cp demo-src/raycaster-p1/assets/rc_placeholder_tiles.png demo-src/raycaster-p2/assets/rc_placeholder_tiles.png
```

- [ ] **Step 2: Create the map**

`demo-src/raycaster-p2/assets/p2map.stm` — an 8×4 room. Row 1 is a corridor (cols 1–6 open, col 0 and col 7 are the border walls). Markers put a floor step at col 3, a ceiling step at col 5:

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 1, "col": 3, "tag": "floor:2" },
        { "row": 1, "col": 5, "tag": "ceil:0.5" }
      ]
    }
  }
}
```

Validate: `node -e "JSON.parse(require('fs').readFileSync('demo-src/raycaster-p2/assets/p2map.stm','utf8'))"` → no error.

- [ ] **Step 3: Commit**

```bash
git add demo-src/raycaster-p2/assets
git commit -m "test(raycaster): Phase 2 span-cast test map"
```

---

## Task 5: Phase 2 demo — span visualiser scene

**Files:**
- Create: `demo-src/raycaster-p2/Main.bas`
- Create: `demo-src/raycaster-p2/SpanViewScene.bas`
- Create: `demo-src/raycaster-p2/RcConfig.bas`, `demo-src/raycaster-p2/RcWorld.bas`, `demo-src/raycaster-p2/RcCast.bas` (copies)
- Create: `tests/scratch/raycasterP2DemoCompiles.probe.ts` (transient)

### Expected cast results for the test map

Origin `(1.5, 1.5)` (centre of cell col1,row1), direction `(1, 0)` (straight along +x). RcWorld accessors are `(col,row)`; markers are `{row,col}`. `deltaDistX = 1`, `sideDistX` starts at `(2 - 1.5) = 0.5`. Marching east along row 1, `entryDist` is the perp distance to each cell's near boundary:

| enters cell | floorH | ceilH | span emitted | entryDist (perp) |
|---|---|---|---|---|
| col2 | 0 | 1.0 | — | 0.5 |
| col3 (`floor:2`) | 2 | 1.0 | FLOORSTEP lo0 hi2 | 1.5 |
| col4 | 0 | 1.0 | FLOORSTEP lo0 hi2 (drop back) | 2.5 |
| col5 (`ceil:0.5`) | 0 | 0.5 | CEILSTEP lo0.5 hi1.0 | 3.5 |
| col6 | 0 | 1.0 | CEILSTEP lo0.5 hi1.0 (back up) | 4.5 |
| col7 (wall) | — | — | WALL, runFloor0 runCeil1.0 | 5.5 |

So `cast((1.5,1.5),(1,0))` → `spanCount() = 5`; kinds `[FLOORSTEP, FLOORSTEP, CEILSTEP, CEILSTEP, WALL]`; the last span's `spanDist ≈ 5.5`, `spanKind = RC_SPAN_WALL`. `spanDist(0) ≈ 1.5`, `spanLo(0) = 0`, `spanHi(0) = 2`.

Direction `(-1, 0)` from `(1.5,1.5)`: `sideDistX` starts at `(1.5 - 1) = 0.5`, first step enters col0 (wall): `spanCount() = 1`, `spanKind(0) = RC_SPAN_WALL`, `spanDist(0) ≈ 0.5`.

`los(world, 1.5, 1.5, 1, 0)` ≈ `5.5`. `los(world, 1.5, 1.5, -1, 0)` ≈ `0.5`.

(If the DDA setup differs from this derivation once implemented, adjust the demo's expected constants to the actual `cast` output — the *shape* of the result matters, the exact 5.5/0.5 must match whatever the implemented march produces. Compute them by adding temporary `print` calls in the scene if unsure.)

(Float note: distances need tolerance comparison; `spanCount`/`spanKind` are integers, safe with `=`; `spanLo`/`spanHi` are literal tag values (`2`, `0.5`, `0`, `1.0`) — exact.)

- [ ] **Step 1: Create `SpanViewScene.bas`**

```basic
Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim rc as RcCast
dim titleText as Text

Constructor()
EndConstructor

function onenter()
  world.setBackground(10, 12, 16)

  self.tm = new tilemapset("p2map.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.rc = new RcCast()

  self.titleText = new Text("Raycaster P2 - span cast", 24, 20)
  self.titleText.setStyle(20, 255, 220, 120)
  hud.add(self.titleText)

  self.rc.cast(self.wld, 1.5, 1.5, 1, 0)

  dim eastOk
  eastOk = 0
  if self.rc.spanCount() = 5 then
    if self.rc.spanKind(0) = RcConfig.RC_SPAN_FLOORSTEP then
      if self.rc.spanKind(4) = RcConfig.RC_SPAN_WALL then
        if math.abs(self.rc.spanDist(4) - 5.5) < 0.05 then
          if self.rc.spanLo(0) = 0 and self.rc.spanHi(0) = 2 then
            eastOk = 1
          endif
        endif
      endif
    endif
  endif
  self.probe("east ray: 5 spans, wall at ~5.5", eastOk, 52)

  self.rc.cast(self.wld, 1.5, 1.5, -1, 0)
  dim westOk
  westOk = 0
  if self.rc.spanCount() = 1 then
    if self.rc.spanKind(0) = RcConfig.RC_SPAN_WALL then
      if math.abs(self.rc.spanDist(0) - 0.5) < 0.05 then
        westOk = 1
      endif
    endif
  endif
  self.probe("west ray: 1 wall at ~0.5", westOk, 74)

  dim losOk
  losOk = 0
  if math.abs(self.wld_los(1, 0) - 5.5) < 0.05 then
    if math.abs(self.wld_los(-1, 0) - 0.5) < 0.05 then
      losOk = 1
    endif
  endif
  self.probe("los east ~5.5 / west ~0.5", losOk, 96)

  self.drawTopDown()
endfunction

function wld_los(dx, dy)
  return self.rc.los(self.wld, 1.5, 1.5, dx, dy)
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
  t = new Text(label + ": " + result, 24, y)
  t.setStyle(14, 255, 255, 255)
  hud.add(t)
  if passed = 0 then
    boom = array.arrLength(missing)
  endif
endfunction

function drawTopDown()
  dim col
  dim row
  dim ox
  dim oy
  dim s
  dim i
  dim n
  drawing.clear()
  ox = 24
  oy = 140
  s = 34

  for row = 0 to self.wld.heightCells() - 1
    for col = 0 to self.wld.widthCells() - 1
      if self.wld.wallAt(col, row) > 0 then
        pen.setFillColor(70, 80, 110)
      else
        pen.setFillColor(24, 28, 38)
      endif
      pen.setLineWidth(1)
      pen.setLineColor(0, 0, 0)
      drawing.drawRect(ox + col * s + s / 2, oy + row * s + s / 2, s - 2, s - 2)
    next col
  next row

  ' draw the east ray and its spans
  self.rc.cast(self.wld, 1.5, 1.5, 1, 0)
  dim px
  dim py
  px = ox + 1.5 * s
  py = oy + 1.5 * s
  pen.setLineColor(255, 230, 120)
  pen.setLineWidth(2)
  drawing.drawLine(px, py, px + 7 * s, py)

  n = self.rc.spanCount()
  for i = 0 to n - 1
    dim d
    dim mx
    d = self.rc.spanDist(i)
    mx = px + d * s
    if self.rc.spanKind(i) = RcConfig.RC_SPAN_WALL then
      pen.setFillColor(255, 90, 90)
    else
      if self.rc.spanKind(i) = RcConfig.RC_SPAN_FLOORSTEP then
        pen.setFillColor(90, 200, 120)
      else
        pen.setFillColor(120, 160, 255)
      endif
    endif
    pen.setLineWidth(0)
    drawing.drawCircle(mx, py, 5)
  next i
endfunction

EndClass
```

VERIFY every call. Notes:
- `math.abs` — `math.bas`. `drawing.drawLine`, `drawing.drawCircle`, `drawing.drawRect`, `drawing.clear` — `drawing.bas`. `pen.*` — `pen.bas`.
- The `wld_los` wrapper exists because calling `self.rc.los(...)` twice inside one `if` chain with `math.abs` is fine directly — you may inline it if it transpiles; the wrapper is just for readability. Drop it if it causes trouble.
- `RcConfig.RC_SPAN_*` constants must be written **prefixed** (Task 2 finding — bare names don't resolve cross-file).
- Nested `dim` inside `for` (`dim d` / `dim mx` / `dim i` inside `drawTopDown`) — the Phase 1 `RcWorld.bas` review required loop vars hoisted to function top. Hoist `d`, `mx`, `i`, `n`, `col`, `row`, `px`, `py` to the top of `drawTopDown`. Fix before the probe.

- [ ] **Step 2: Create `Main.bas`**

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim spanView = new SpanViewScene()
scenemanager.register("spanview", spanView)
scenemanager.switch("spanview")
```

- [ ] **Step 3: Stage the lib copies**

```bash
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p2/RcConfig.bas
cp demo-src/raycaster/lib/RcWorld.bas  demo-src/raycaster-p2/RcWorld.bas
cp demo-src/raycaster/lib/RcCast.bas   demo-src/raycaster-p2/RcCast.bas
```
(If you chose option (b) in Task 2 — no `RcConfig.bas` — omit that copy.)

- [ ] **Step 4: Transpile probe**

Create `tests/scratch/raycasterP2DemoCompiles.probe.ts` — transpile the demo dir's `.bas` files (ordered via `sortByDependencies`, same as `tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts` — copy that test's setup) against `packageModules`, `expect(diagnostics).toEqual([])`.

Run via the scratch config. Iterate until clean. Delete when green.

- [ ] **Step 5: Build the export**

```bash
npm run build:demo -- demo-src/raycaster-p2 RaycasterP2SpanCast
```
Expect: `Wrote src/docs/demos/RaycasterP2SpanCast.b4wgl.json (N file(s), 2 asset(s))`.

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster-p2 src/docs/demos/RaycasterP2SpanCast.b4wgl.json
git commit -m "test(raycaster): Phase 2 span-view demo scene"
```

---

## Task 6: Wire the demo into the dev registry + Cypress

**Files:**
- Modify: `src/features/demos/devDemoRegistry.ts`
- Modify: `cypress/e2e/demos.cy.ts`

- [ ] **Step 1: Add the registry entry**

In `src/features/demos/devDemoRegistry.ts`, add a second entry to the array:

```ts
  {
    slug: 'raycaster-p2-spancast',
    name: 'Raycaster P2 — Span Cast',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 2 probe: RcCast DDA-marches the grid and collects wall / floor-step / ceiling-step spans; top-down visualiser + probes.',
    docsSlug: '',
    file: 'RaycasterP2SpanCast',
  },
```

- [ ] **Step 2: Run the dev-registry unit tests**

Run: `npx vitest run tests/ui/features/demos/devDemoRegistry.test.ts`
Expected: PASS (slug/file/name present; no collision with public slugs). If a test asserts the array length or lists exact slugs, update it to include `raycaster-p2-spancast`.

- [ ] **Step 3: Add the Cypress case**

In `cypress/e2e/demos.cy.ts`, add to the `DEV_DEMOS` array:

```ts
  { slug: 'raycaster-p2-spancast', title: 'Raycaster P2 — Span Cast', waitMs: 3000 },
```

- [ ] **Step 4: Run guards + full suite + build**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoTranspile.test.ts tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts
npx vitest run
npx vite build
```
All green/clean. The lib-sync test now checks `raycaster-p2/`'s copies against `demo-src/raycaster/lib/` — they must be byte-identical (you just `cp`'d them, so fine unless you hand-edited a copy).

- [ ] **Step 5: E2E**

If a browser is available: `npm run dev` (port 5173) then `npx cypress run --spec cypress/e2e/demos.cy.ts`. All specs pass including `Dev demo: Raycaster P2 — Span Cast` and the still-present P1 one.
Then prove the probe guard works: temporarily change one expected value in `SpanViewScene.bas` (e.g. `spanCount() = 5` → `= 99`), `cp` to the demo dir, rebuild the export, re-run Cypress, CONFIRM it now FAILS with `ERR`, then restore + rebuild.
If no browser: reason through it in the report and state that manual Cypress verification is required.

- [ ] **Step 6: Commit**

```bash
git add src/features/demos/devDemoRegistry.ts cypress/e2e/demos.cy.ts tests/ui/features/demos/devDemoRegistry.test.ts
git commit -m "test(raycaster): wire Phase 2 span-cast demo into dev registry + e2e"
```

---

## Task 7: Docs + roadmap

**Files:**
- Modify: `src/docs/guides/raycaster-library.md`
- Modify: `docs/roadmap.md`, `docs/language/library-roadmap.md`

- [ ] **Step 1: Add an `RcCast` section to the guide**

After the `RcWorld` section in `src/docs/guides/raycaster-library.md`, add:

```markdown
## RcCast — casting rays

`RcCast` walks a straight line across the map from a point and collects every
surface it crosses — walls, and the steps where a floor rises/falls or a ceiling
rises/falls. Unlike a classic raycaster it does **not** stop at the first wall,
so a later step can draw what's visible past a low wall or across a pit.

```basic
dim rc as RcCast

function onenter()
  self.rc = new RcCast()
  ' cast east from the middle of cell (1,1)
  self.rc.cast(self.wld, 1.5, 1.5, 1, 0)

  dim i
  for i = 0 to self.rc.spanCount() - 1
    print "span " + string.str(i) + " kind " + string.str(self.rc.spanKind(i)) + " at " + string.str(self.rc.spanDist(i))
  next i
endfunction
```

### Span kinds (from `RcConfig`, referenced prefixed)

| Constant | Meaning |
|---|---|
| `RcConfig.RC_SPAN_WALL` | a full-height wall — the ray stops here |
| `RcConfig.RC_SPAN_FLOORSTEP` | the floor height changed between two cells |
| `RcConfig.RC_SPAN_CEILSTEP` | the ceiling height changed between two cells |

### Reading a span

| Call | Returns |
|---|---|
| `rc.spanCount()` | how many spans the last `cast` produced |
| `rc.spanKind(i)` | one of the `RC_SPAN_*` constants |
| `rc.spanDist(i)` | distance from the ray origin (no fisheye distortion) |
| `rc.spanLo(i)` / `rc.spanHi(i)` | the low and high world heights the surface covers |
| `rc.spanCol(i)` / `rc.spanRow(i)` | the cell that produced the span |
| `rc.spanU(i)` | horizontal texture position `0`–`1` across a wall (`0` for steps) |
| `rc.spanTex(i)` | the texture id for that surface, or `""` |

### Line of sight

`rc.los(world, x, y, dx, dy)` marches the same line and returns the distance to
the first wall, or `-1` if nothing is hit within range. Use it for "can this
enemy see the player" checks.

### Phase 2 limits

The ray stops at the first wall (no "see-through" windows yet), ignores rooms
stacked above a cell, and treats diagonal-wall tiles as empty. Those arrive in
later phases.
```

VERIFY the accessor list against `demo-src/raycaster/lib/RcCast.bas` as built in Task 3 — correct any drift.

- [ ] **Step 2: Roadmap**

In `docs/roadmap.md` and `docs/language/library-roadmap.md`, update the "Raycaster library (in progress)" item: Phase 2 (`RcCast` span builder + `los`) shipped; phases 3–10 remain. Match each file's existing format.

- [ ] **Step 3: Build + suite + commit**

```bash
npx vite build
npx vitest run
git add src/docs/ docs/roadmap.md docs/language/library-roadmap.md
git commit -m "docs(raycaster): Phase 2 RcCast guide section + roadmap"
```

---

## Task 8: Phase 2 close-out

**Files:** none.

- [ ] **Step 1:** `npx vitest run` → 1818+ pass, only the pre-existing skip.
- [ ] **Step 2:** `npx vite build` → clean.
- [ ] **Step 3:** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo*.test.ts` → both guards green, now covering `raycaster-p2/`.
- [ ] **Step 4:** Confirm `raycaster-p2-spancast` is NOT in `src/features/demos/demoRegistry.ts` and does not render on `/demos`.
- [ ] **Step 5: Spec check.** Re-read spec §4.1/§4.3 and §11 phase 2. `RcCast` emits WALL / FLOORSTEP / CEILSTEP spans with `dist`/`lo`/`hi`/`col`/`row`/`u`/`tex`; `los` works; termination on wall + `RC_MAX_DIST`. Confirm the deferrals (screen projection, occlusion window, upper regions, diagonals) are noted in `RcCast.bas`'s header. Note any gap as a follow-up before declaring Phase 2 done.
- [ ] **Step 6:** Manual Cypress run still required if it couldn't run in-session (Task 6 Step 5) — flag this in the completion summary.

---

## Notes for later phases (not this plan)

- **Phase 3 (`RcRender`)** consumes `RcCast`: loops `RC_COLS` columns, computes each ray dir from camera yaw + FOV, calls `cast`, converts each span's `dist`/`lo`/`hi` → `screenTop`/`screenBottom` via the projection, applies the per-column occlusion window (spec §5.1), and draws strips. This is where the §5.3 `drawing`-throughput benchmark happens — hold the contingency until then.
- The `cast` early-out on the occlusion window (spec §4.1 step 3) is added in Phase 3 as an optional `maxScreenSpan` param or a callback — deferred now because Phase 2 has no screen space.
- Floor/ceiling **step** spans currently fire on any `!=` (rise OR fall). Phase 3 decides how a "fall" (pit) span is drawn vs a "rise". If that distinction turns out to matter to the cast, revisit — for now the renderer has `lo`/`hi` + the running context it rebuilds.
- Upper regions (`world.hasUpperAt`) — Phase 8. `RcCast` will emit extra spans when the ray passes under an open ceiling hole.
