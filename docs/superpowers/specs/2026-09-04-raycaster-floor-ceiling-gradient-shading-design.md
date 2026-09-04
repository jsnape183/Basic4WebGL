# Raycaster floor/ceiling gradient shading — design

## Context

`raycaster-p10-finale`'s floor/ceiling lighting went through eight fix rounds in one session (see `docs/raycaster-mesh-spike-findings.md` for a related but separate rejected spike, and the git log for `demo-src/raycaster/lib/RcRender.bas`/`RcLights.bas` from `59ee58a` through `146fb00`). Each fix was real, evidence-backed, and independently verified — and each one exposed a new artifact, because every fix was another exception bolted onto the same underlying technique: approximating a continuous light gradient across a floor/ceiling surface by slicing it into flat-shaded rectangular bands (a "lattice" keyed to screen-Y, recomputed once per frame from the bound lights' dynamic range).

That technique is retired for floor/ceiling shading, replaced with the design below. This is a proof of concept, scoped to `raycaster-p10-finale` only — no other raycaster demo is touched.

**Stated priority for this work:** visual quality over draw-call economy. This demo is meant as a capstone showing the engine is good enough for a real game, not a stress-test benchmark — if the level needs smaller rooms, more lights, or other content constraints to look right, that's an acceptable trade against graphical mediocrity, not the other way around.

**Escalation rule:** if Option A (below) needs more than 2 fix attempts responding to the *same* reported visual issue and still doesn't resolve it, stop and switch to Option C (a baked lightmap texture) rather than attempting a third patch. An "attempt" is one committed fix in response to one specific issue reported after visual testing.

## Goal

Replace the floor/ceiling band-lattice shading system with a per-run vertical gradient fill: one shape per colour run, gradient-filled from the light level at its own near edge to its own far edge, computed directly — no intermediate sampling grid, no frame-global lattice state.

## Architecture

### New engine primitive: `drawing.drawVGradientRect`

`src/components/Runner/engine/drawing.js` gains a new draw function alongside the existing `drawRect`/`drawCircle`/etc.:

```js
drawVGradientRect(x, y, width, height, topR, topG, topB, botR, botG, botB) {
  const o = _acquireG();
  const gradient = new PIXI.FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: (topR << 16) | (topG << 8) | topB },
      { offset: 1, color: (botR << 16) | (botG << 8) | botB },
    ],
  });
  o.rect(0, 0, width, height).fill(gradient);
  o.pivot.set(width / 2, height / 2);
  o.position.set(x, y);
  return o;
}
```

Exact `PIXI.FillGradient` constructor shape/coordinate-space (whether `start`/`end` are normalised 0..1 within the shape's bounds or absolute local coordinates) must be confirmed against the installed `pixi.js@8.20.0` at implementation time — the above is the intended API surface, not a guarantee of exact PIXI syntax. Pooling follows the exact same `_acquireG()` pattern every other Graphics-backed primitive already uses; no new pooling mechanism.

`x`/`y` here follow the existing `drawRect` convention: `x`,`y` is the shape's **centre**, matching `pivot.set(width/2, height/2)` + `position.set(x,y)`.

### `.bas` wrapper — descriptor-generated, not hand-edited

`drawing` is a descriptor-generated module (`src/lib/Basic4WebGL/library/registry.ts` lists `drawingDescriptor`). Per `CLAUDE.md`'s "Descriptor-generated `.bas` files" rule, the new function is added to `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`, following the existing entries' shape (see `drawRect`'s descriptor entry for the pattern: `name`, params, `body: (p, _self) => `_sb.drawVGradientRect(...)``), then `npm run generate:library` regenerates `src/lib/Basic4WebGL/defs/drawing.bas`. The `generatedDefsInSync.test.ts` regression test enforces this automatically — hand-editing `drawing.bas` directly will be caught.

### `RcRender.bas` changes — per-instance opt-in, not a diverged copy

`RcRender.bas` is shared across every raycaster demo, and `raycasterDemoLibSync.test.ts` requires every demo's copy to stay byte-identical to the canonical `demo-src/raycaster/lib/RcRender.bas`. "Finale only" therefore cannot mean a diverged file — it means the same pattern already established by `setFlatFill(v)`: a per-instance field defaulting to the old (lattice) behaviour, with a setter the finale opts into. Concretely: `self.gradientShadeOn` (default `0`), `RcRender.setGradientShading(v)`. Every other demo's `RcRender` instance behaves exactly as it does today, unchanged, with zero code divergence; only `FinaleScene.bas` calls `self.ren.setGradientShading(1)`. The old lattice code path stays in the shared file, gated behind this flag, until/unless a future decision removes it for everyone.

The per-run floor/ceiling paint step (currently `drawFlatSeg` → `emitFlatBand`, walking a `surfSegN`-cell screen-Y lattice) is replaced with a single computation per colour run, only when `gradientShadeOn = 1`:

1. Sample light at the run's own near edge: `nearLite = boundLights.sampleAt(camX + rayX*dNear, camY + rayY*dNear)`.
2. Sample light at the run's own far edge: `farLite = boundLights.sampleAt(camX + rayX*dFar, camY + rayY*dFar)`.
3. Convert each to an RGB triple using the existing shade-kind/colour math (`RC_SHADE_FLOOR_TOP`/`fcol:`/etc. — unchanged formulas, just evaluated at two points instead of one).
4. One `drawing.drawVGradientRect` call spanning the run's full projected screen-Y extent (`ya`/`yb` from `projectY`, exactly as computed today), gradient from the near-edge colour to the far-edge colour.

`emitFlatBand`, the `surfSegN` frame-global field, `depthAtScreenY`'s multi-cell lattice-walking loop, and `RcConfig.RC_SURF_LIGHT_STEP`/`RC_SURF_SEG_MAX` become dead for this path. They are not deleted as part of this POC (other raycaster demos may still reference `RC_SURF_LIGHT_STEP`/`RC_SURF_SEG_MAX` constants even if unused by any renderer path — confirm no other demo's `RcRender.bas` copy depends on them before removing anything shared) — cleanup is a follow-up once the POC is validated, not part of this change.

Everything else is untouched: `drawSurface`'s colour-run coalescing (still splits a surface into runs by `fcol:`/`ccol:` boundary exactly as today), wall shading (`drawStrip`, `drawWallStrip`), actors, the backdrop fix (`ac80770`), the out-of-range depth clamp (`146fb00` — actually superseded/simplified by this change, since a run's own `dNear`/`dFar` are now the gradient's exact endpoints by construction, so "sampling behind a wall" is no longer structurally possible).

### Known limitation, by design

Real light falloff (especially `RC_FALLOFF_QUADRATIC`) is not linear in distance, and a gradient fill is linear in screen-Y across the run. A very long, uniformly-coloured run spanning a large light gradient will show as a smooth but not perfectly curve-accurate blend. This is an accepted, bounded, purely cosmetic trade — it cannot produce a hard edge, a discretization step, or (the actual bug class fixed across all eight prior rounds) a value sampled from behind a wall or in the wrong room. If this residual imprecision is visible and objectionable once tested, that's exactly the trigger for the 2-attempts-then-escalate-to-Option-C rule above, not a reason to add more lattice logic back in.

## Testing

- **Engine-level** (`tests/components/Runner/drawing.test.ts`): extend the existing fake-PIXI harness with a `FakeGradient`/gradient-aware `FakeGraphics.fill()` capture so a test can assert `drawVGradientRect`'s two colour stops land where expected. Follows the file's existing conventions.
- **`.bas` def sync**: `generatedDefsInSync.test.ts` already covers this automatically once the descriptor is updated and regenerated.
- **RcRender-level**: a Vitest harness (following this session's established pattern — transpile the real `.bas` files, construct a real `RcWorld`/`RcRender`/`RcLights`, stub `_sb.setFillColor`/`drawVGradientRect`/etc., capture calls) proving a colour run's gradient stops match `sampleAt` at its own real `dNear`/`dFar` — not a lattice cell's derived midpoint.
- **Regression re-verification**: re-run (or adapt) the corridor-walk probe from the `146fb00` investigation (hub → Torch Hall → dais, real `finale.stm`, real static lights) to confirm no out-of-range/wrong-room sampling is structurally possible under the new code path.
- **Full suite + build + Cypress**, as with every prior change in this saga: `npx vitest run`, `npx vite build`, `npx cypress run --spec cypress/e2e/demos.cy.ts --headless` (rebuild the finale export first: `npx vite-node scripts/buildDemo.ts demo-src/raycaster-p10-finale RaycasterP10Finale`).
- **Manual visual re-test**: the user re-tests in the running demo. This is the actual bar for success — headless tests catch regressions and prove the mechanism, but the whole reason this redesign exists is that headless/aggregate verification repeatedly missed what visual re-testing caught.

## Non-goals for this POC

- No *behavioural* change to any other raycaster demo (`p3` through `p9-bench`). `RcRender.bas` stays a single shared, byte-identical-across-demos file (synced as always, verified by `raycasterDemoLibSync.test.ts`) — the new gradient path lives in that same shared file behind `setGradientShading(v)`, defaulting off, so only `FinaleScene.bas` opting in actually changes anything.
- No change to wall shading.
- No `RC_SURF_LIGHT_STEP`/`RC_SURF_SEG_MAX` cleanup or removal.
- No Option C (baked lightmap) work unless the escalation rule triggers.
