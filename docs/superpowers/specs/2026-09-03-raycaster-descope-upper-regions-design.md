# Raycaster — descope upper regions, redefine Phase 8

**Status:** approved 2026-09-03
**Supersedes:** `docs/superpowers/specs/2026-09-02-raycaster-phase-8-upper-regions-design.md`
and `docs/superpowers/specs/2026-09-02-raycaster-renderer-rework-design.md` (both
marked superseded at their heads).

---

## 1. Why

Phase 8 added one optional walkable "upper region" per map cell (a second storey
authored as a `.stm` tile layer). Playing it, the lower↔upper camera transition
reads jarring, and — more importantly — supporting it forced the renderer's most
expensive structural change: the single per-column occlusion **window** became a
per-column **list of up to six visible screen-Y intervals** (`occlude` /
`dropThinnest` / `drawInto` / `array.clear` + rebuild every column), because
seeing the room below *through a hole* while also seeing the walkway and the
upper ceiling puts multiple disjoint bands in one column.

Nothing else needs that. Removing upper regions lets the renderer go back to two
scalars per column, which is dramatically cheaper and simpler. Multi-tier level
design (stairs, raised platforms, sunken arenas) does **not** need regions — it
is pure `floor:` / `ceil:` height variation, which Phases 3–6 already deliver and
`RcMover` already climbs. The only thing lost is genuine room-over-room (a
walkable surface with walkable open space beneath the *same* map cell), which is
beyond "DOOM plus a bit" — DOOM itself could not do it.

Decision: **drop upper regions. Redefine Phase 8 as "Multi-tier level design &
surface colour".** Later raycaster iterations focus on lighting and texturing
rather than cramming structural features.

---

## 2. Scope

### 2.1 Stays — no behaviour change

- Variable floor/ceiling heights: `floor:` / `ceil:` markers, FLOORSTEP /
  CEILSTEP spans, step risers, horizontal surface fills, `RcMover` step-up
  climbing and gravity.
- Diagonal walls (Phase 7): `diag:` tags, `RcWorld.diagAt`, `RcCast.diagHit()`,
  the real along-chord texture `u` for a diagonal hit.
- Bilinear light: `RcLights.sampleAt(x, y)` for floor/ceiling surfaces; walls and
  sprites keep per-cell `sampleCell`.
- Wall texturing: `drawing.drawImageStrip` `tint` + `srcVTop` / `srcVBot`,
  `RcRender.setWallTexture`, per-cell `tex:` overrides, `RcConfig.RC_TEX_SIZE`.
- Per-tile flat colour: `fcol:RRGGBB` / `ccol:RRGGBB` marker tags,
  `RcWorld.floorColAt` / `ceilColAt` / `hasSurfaceColor`.
- `tilemapset.hasLayer(name)` engine method — generic, no cost, keep.
- `drawing.drawFloorStrip` engine primitive + its isolated tests + its
  `drawing.md` entry — **kept but no longer called by `RcRender`**. Parked for a
  future textured-floor pass; `drawing.md` gains a "not yet used by the raycaster
  library" note.

### 2.2 Removed

**`RcWorld`** — the `upper` tile-layer read; `upKindArr`; `upCeilHArr`; the
`uceil:` marker branch in `applyKv`; `upperKindAt` / `upperFloorAt` /
`upperCeilAt` / `hasUpperAt`. The `applyTag` loop and array-init loop lose their
upper-region rows.

**`RcCast`** — `setRegion` / `regionOf` / `castRegion` field; all portal-span
emission (`RC_SPAN_PORTAL_WALL` / `_CEIL` / `_FLOOR`); the `seeOther` latch; the
DDA-continues-past-planks logic. `cast(wld, ox, oy, dx, dy)` stays 5-arg.

**`RcMover`** — the `region` field; `enterRegion`; `regionId`; every
region-conditional branch in `blocked()` and the vertical resolver (they return
to the single-height form). The diagonal push-out loses its `and self.region = 0`
guard.

**`RcRender`** — `intvTop` / `intvBot` / `occTop` / `occBot` fields;
`resetIntervals`; `occlude`; `dropThinnest`; `drawInto`; `drawSurfaceInto`;
`intervalCount`; `distAtScreenY`; the PORTAL_WALL / PORTAL_CEIL / PORTAL_FLOOR
branches in the span ladder; the `camRegion` / `setRegion` camera-region seeding;
`setFloorTexture` / `setCeilTexture` / `floorTexFor` / `ceilTexFor` / `defFloorTex`
/ `defCeilTex`; the `drawFloorStrip` call site.

**`RcConfig`** — `RC_MAX_INTERVALS`; `RC_SPAN_PORTAL_WALL` / `_CEIL` / `_FLOOR`;
`RC_SHADE_UPPER_FLOOR`. Keep `RC_STD_CEIL`, `RC_TEX_SIZE`.

**Dev demos** — `demo-src/raycaster-p8-upper/` and
`demo-src/raycaster-p8b-textures/` (the whole dirs, their
`src/docs/demos/RaycasterP8Upper.b4wgl.json` / `RaycasterP8bTextures.b4wgl.json`
exports, and their entries in `cypress/e2e/demos.cy.ts`,
`tests/ui/features/demos/devDemoRegistry.test.ts`,
`tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`).

---

## 3. Renderer — single occlusion window

`RcRender.renderFrame` walks each column's near→far spans under two scalars,
`winTop` / `winBot` (the screen-Y bounds of what is still visible in that
column), exactly as at commit `93022f9` (Phase 7):

| Span kind | Action |
|-----------|--------|
| Full wall | draw the face clipped to `[winTop, winBot]`, record `depthArr(col)`, end the column |
| Floor rise (FLOORSTEP up) | draw the pending floor surface + the riser; clamp `winBot` down to the riser top (can't see under a raised floor) |
| Ceiling drop (CEILSTEP down) | mirror: clamp `winTop` up to the riser bottom |
| Floor drop / ceiling rise | draw the riser; leave the window open — farther geometry shows through (documented "header gap") |
| — | column ends when `winTop >= winBot` |

### 3.1 Helper signatures

- `drawStrip(destX, sTop, sBot, winTop, winBot, shadeKind, lightLevel)` —
  unchanged (already window-form).
- `drawWallInto(...)` → **`drawWallStrip(destX, wTop, wBot, winTop, winBot, tex,
  u, lite, sideKind)`** — one clip against the window instead of a loop over
  intervals. Same source-V math: `svTop = (clip.top - wTop) / (wBot - wTop)`,
  `svBot` likewise; same `packTint(r, g, b)`; same `sideDim` (1.0 x-face / 0.8
  y-face / 0.9 diagonal); `srcX = floor(u * RC_TEX_SIZE)` clamped to
  `RC_TEX_SIZE - 1`. Empty `tex` → falls through to `drawStrip`.
- `drawSurfaceInto(...)` → **`drawSurface(destX, hh, dNear, dFar, winTop, winBot,
  kind, lite)`**:
  - order the two projected Ys (`projectY(hh, dNear)` / `projectY(hh, dFar)` —
    a floor below eye and a ceiling above it project inverted).
  - if `wld.hasSurfaceColor()` is 0 → one `drawStrip` clipped to the window.
  - else → the per-cell DDA march: `surfaceRunEnd(tStart, tMax)` returns the ray
    parameter at which this column's ray leaves its current grid cell (nearest
    x/y crossing, clamped to `tMax`); step through the cells the band crosses,
    reading `floorColAt` / `ceilColAt` (floor when `hh < camZ + RC_EYE_Z`, else
    ceiling) at each cell midpoint. **Coalesce consecutive cells with the same
    resolved colour — including runs of "no override" (drawn with the default
    `kind` shade) — into a single `drawStrip`.** This is the batching fix; it is
    trivial with one window where it was awkward with six intervals.
  - light per coalesced segment: `RcLights.sampleAt` at the segment's world
    midpoint when lights are bound, else the passed `lite`.
- `drawColorInto(...)` → **`drawColorStrip(destX, sTop, sBot, winTop, winBot,
  packed, lite)`** — unpack `packed` (`r * 65536 + g * 256 + b`), scale each
  channel by `lite`, clamp to 0–255, `pen.setFillColor` + `drawing.drawRect`
  clipped to the window. One call, no interval loop.

### 3.2 Net effect

Every wall/surface draw does one scalar-pair clip instead of a 1–6 iteration
interval loop; no per-column `array.clear` + rebuild; the span ladder loses three
`if` branches. This is the bulk of the per-frame overhead the library carried
over the hand-written Wolfenstein demo. (The remaining gap — class-method
dispatch and bounds-checked array access per span — is Phase 9 territory and out
of scope here.)

---

## 4. New dev demo `raycaster-p8-tiers`

One showcase room, `demo-src/raycaster-p8-tiers/`:

- **Layout:** a sunken central arena (`floor:-0.5`), stairs up each side to a
  raised perimeter walkway (`floor:` run climbing 0 → ~0.8 in `RC_STEP_UP`-sized
  steps) with low wall-stub railings, and one higher nook reached by a longer
  stair. `ceil:` raised over the walkway and nook so the player's eye
  (`floor + RC_EYE_Z`) stays under the ceiling.
- **Surfaces:** walls textured — `setWallTexture("rc_tex_concrete.png")` default,
  `tex:rc_tex_brick.png` / `tex:rc_tex_panel.png` accents. A handful of
  `fcol:` / `ccol:` accent tiles (arena floor one colour, nook floor another).
- **Camera look:** the scene's `Constructor` binds yaw keys (A / D or Q / E) to
  `RcMover.turn` and pitch keys (R / F, or arrow up/down) to `RcMover.look`;
  optionally pointer-lock mouse deltas to both. `RcMover.look` already clamps to
  `RcConfig.RC_MAX_PITCH`. **No library change** — pure scene wiring.
- **Assets:** `scripts/genRaycasterTextures.ts` retargeted to write into this
  demo's `assets/`; the six generated 64×64 PNGs move here.
- **Probes (4–6):** e.g. a `floor:` staircase run reports increasing heights; a
  raised-floor column clamps the occlusion window (far geometry hidden); a pit
  column shows the wall beyond; `wallTexFor` resolves a `tex:` tag and the
  default; `floorColAt` resolves an `fcol:` tile and `-1` elsewhere.
- **Wiring:** `Main.bas`, `cypress/e2e/demos.cy.ts` entry (`raycaster-p8-tiers`),
  `devDemoRegistry` entry, `raycasterDemoProbes` case.

---

## 5. Repo-wide follow-through

- **Lib sync:** re-sync `RcConfig` / `RcWorld` / `RcCast` / `RcMover` / `RcRender`
  / `RcLights` to every `raycaster-p*` phase dir that carries them
  (`raycasterDemoLibSync` enforces byte-identity).
- **Export rebuild:** rebuild **every** `src/docs/demos/RaycasterP*.b4wgl.json`
  dev-demo export after the lib changes — an explicit plan step this time, since
  stale embedded libs have broken Cypress at compile twice before.
- **Focused tests:** delete `raycasterIntervals.test.ts`; keep
  `raycasterLights.test.ts` (bilinear) and `raycasterDiagWorld.test.ts`; replace
  `raycasterUpperWorld.test.ts` with nothing (feature gone); add
  `raycasterWindowOcclusion.test.ts` — a pit column shows the far wall, a
  raised-floor column clamps `winBot`, a coloured multi-cell floor run coalesces
  to the expected strip count. `raycasterSurfaceColor.test.ts` stays.
  `raycasterDemoSmoke`'s stub world drops the `upper*` / region methods.
- **Docs:**
  - `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` — strike the
    upper-region sections with the §1 rationale; restore the single-window
    renderer description; redefine Phase 8.
  - `docs/roadmap.md`, `src/docs/roadmap.md`, `docs/language/library-roadmap.md`
    — rewrite the Phase 8 entry ("Multi-tier level design & surface colour";
    upper regions considered and rejected, rationale).
  - `src/docs/guides/raycaster-library.md` — remove the "Upper regions" section;
    Textures section already walls-only + parked note; keep `fcol:` / `ccol:`.
  - `src/docs/api-reference/drawing.md` — `drawFloorStrip` gains a "not yet used
    by the raycaster library — reserved for a future textured-floor pass" note.
  - The Phase 8 (upper regions) spec + plan files: `> **Superseded** by
    `2026-09-03-raycaster-descope-upper-regions-design.md`` at the head, keep in
    place as history.

---

## 6. Testing strategy

- `npx vitest run` full suite green before every commit that touches a lib file.
- `npx vite build` clean.
- `cypress/e2e/demos.cy.ts` — run manually after the lib changes + export
  rebuilds; expect green including the new `raycaster-p8-tiers` entry and the two
  removed entries gone.
- Manual walk of `raycaster-p8-tiers` (user): stairs climb smoothly, the raised
  walkway occludes what's behind it, the pit shows the far wall, camera look
  works and clamps, textured walls + coloured tiles read correctly, and the
  frame feels smoother than the interval build.

---

## 7. Out of scope

- Phase 9 optimisation (draw-primitive batching across columns, method-dispatch /
  checked-array overhead, light-per-cell caching, benchmark harness).
- Textured floors / ceilings (`drawFloorStrip` in `RcRender`).
- Any colour-march perf work beyond the same-colour coalescing in §3.1.
- Pointer-lock mouse look is optional; key-based look is the baseline.
