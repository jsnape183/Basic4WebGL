# Raycaster light-pool POC — design

## Context

Two prior redesigns this cycle (gradient floor/ceiling shading, then height-aware lighting) each fixed a real, verified bug, but the underlying technique — one flat/gradient-filled vertical strip per screen column (`RC_STRIP_W` = 4px), with zero blending between neighbouring strips — has an architectural ceiling that neither fix could reach. Render-level instrumentation (logging the actual near/far light value fed to every column strip in a real corridor view) confirmed the "light flows as a straight rectangle, not a fanning pool" complaint is real: strips are internally consistent and correctly computed, but a stack of independent flat rectangles cannot read as a smooth circular pool no matter how accurate each strip's own value is.

The user has explicitly deprioritized dynamic light ("I don't need realistic dynamic light — I would like it but don't need it") in favour of static lighting that "behaves naturally" — this is judged a bigger lever on the finished game's visual quality than any other remaining raycaster work, with correspondingly little tolerance for compromise: "At the moment this model is worse than no light."

Given the cost of the last two redesigns, this is a deliberately cheap, rough, throwaway POC to validate the visual direction *before* committing to a full implementation. If it doesn't convincingly read as a real pool of light, the fallback (per prior agreement) is Option C — true per-pixel floor-casting with a baked lightmap — and if that also falls short, the raycaster's floor/ceiling lighting is accepted as pushed to its limit for now.

## Goal

Prove or disprove, as cheaply as possible, that a screen-space radial-gradient "light pool" overlay — drawn once per static light per frame, independent of the per-column wall/floor render — can produce a genuinely convincing round pool of light on floor and ceiling, including in the exact case that broke before: standing in a room, looking down a narrow corridor at a light in the room beyond.

## Architecture

### New standalone demo: `raycaster-lightpool-poc`

A new dev-only demo directory (`demo-src/raycaster-lightpool-poc/`), registered in `devDemoRegistry.ts` only — not the public demo list, matching the existing `raycaster-p*` phase-probe convention (no docs page, Cypress-verified for "runs with zero errors" only). It ships its own straight, unmodified copies of `RcWorld.bas`, `RcCast.bas`, `RcMover.bas`, `RcConfig.bas`, and `RcLights.bas` from `demo-src/raycaster/lib/`. Nothing in the shared canonical library changes — this POC is fully isolated from the finale and every other raycaster demo.

### New file: `RcRenderPool.bas`

Forked from `RcRender.bas`, not a modification of it. Wall rendering (`drawStrip`/`drawWallStrip`, the per-column DDA march, billboards) is kept as-is. All floor/ceiling logic is replaced:

- **Base fill:** floor and ceiling render as a flat, dim, ambient-only colour — no per-column light sampling, no gradient, no `sampleAt`/`sampleAtZ` calls in the base pass at all.
- **New pass, `drawLightPools()`:** runs once per frame, after the normal per-column wall pass, looping over every static light baked from the world's `light:` markers (the same static-light data `RcLights.bakeStatic()` already produces — read directly off `RcLights`' static-light arrays, reusing infrastructure from the height-aware-lighting work rather than duplicating it). For each light:
  1. Compute world-relative position `(relX, relY) = (lightX - camX, lightY - camY)`.
  2. Project to screen space using the exact camera-plane transform `RcRender` already uses for billboards: `invDet = 1 / (fPlaneX*fDirY - fDirX*fPlaneY)`, `depth = invDet * (-fPlaneY*relX + fPlaneX*relY)` (perpendicular distance), `tX = invDet * (fDirY*relX - fDirX*relY)`, `screenX = (screenW/2) * (1 + tX/depth)`.
  3. Skip the light if `depth <= 0.1` (behind camera) or `screenX` is far outside the visible width (cheap off-screen cull).
  4. Skip the light if a single LOS ray from camera to the light's centre (`RcCast.los`, the same primitive `RcLights.splatCell` already uses) is blocked by a wall — a rough, centre-only occlusion check.
  5. Compute screen radius as `poolWorldRadius / depth` (same distance-scaling relationship already used for actor billboard sizing), where `poolWorldRadius` is a new tunable constant.
  6. Compute floor and ceiling screen Y via the existing `projectY(0, depth)` / `projectY(RcConfig.RC_STD_CEIL, depth)`.
  7. Draw one `drawing.drawRadialGradientCircle(...)` on the floor position and one on the ceiling position, colour/intensity derived from the light's stored intensity, fading to fully transparent at the computed radius.

### New engine primitive: `drawing.drawRadialGradientCircle`

`drawing` is descriptor-generated (`src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts` → generates `drawing.bas`), so this goes through the descriptor properly rather than a hand-edit. Signature: `drawRadialGradientCircle(x, y, radius, r, g, b, alpha)`. Implementation in `src/components/Runner/engine/drawing.js` uses PIXI v8's native `FillGradient({ type: 'radial', innerRadius: 0, outerRadius: <texture-space>, colorStops: [{offset:0, color: rgba-at-full-alpha}, {offset:1, color: rgba-at-zero-alpha}] })` — genuinely GPU-interpolated, no banding. Following the lesson from the gradient-shading redesign's WebGL-context-loss bug: cache gradients by a quantized `(r,g,b,alpha)` key, never evict/destroy mid-session, only clear the cache on scene reset (`_drawingReset()`), exactly like the existing `_gradientCache` for `drawVGradientRect`.

This is a real, permanent engine capability (useful well beyond this POC), not throwaway code — the *rendering logic* that uses it (`RcRenderPool.bas`) is the throwaway/rough part.

### POC scene

Two small rooms joined by one straight, 2-cell-wide corridor — deliberately the exact shape that broke before. One static `light:` marker per room, roughly centred, at a normal ceiling-ish height. Camera spawns in room 1. This directly exercises both cases that matter: standing under/near a light in an open room (is the pool round?), and looking down the corridor toward the far room's light (does it fan/pool, or still look like a rectangle?).

## Known POC simplifications (explicitly deferred, not oversights)

- The pool is drawn as a true screen-space circle, not a perspective-correct ellipse (a real flat disk on the ground would squash into an ellipse at oblique viewing angles). May look slightly "decal-like" at extreme angles.
- Occlusion is a single ray to the light's centre — no soft-edged partial occlusion/penumbra.
- No handling for two lights' pools overlapping beyond simple draw order (the 2-light POC scene is chosen so this shouldn't come up).
- No dynamic lights — static only, per the user's explicit scope decision.
- No docs page, no roadmap update, no API reference entry for the new `drawing` primitive yet — deferred until/unless this graduates past POC into a real feature, at which point it goes through the full six-step process (docs included).

## Testing

Deliberately light, matching the POC's throwaway intent:

- A transpile-output test proving `drawing.drawRadialGradientCircle(...)` in `.bas` source compiles to a call into the correct engine function with the right argument order (same pattern as the existing `drawVGradientRect` transpiler test).
- A unit test for the new `drawing.js` function: creates a PIXI radial `FillGradient`, doesn't throw, and caches/reuses correctly for repeated calls with the same colour/alpha (mirroring the existing `drawVGradientRect` cache tests, including the "never destroy an in-flight gradient" regression case).
- A basic smoke test (or reliance on manually running the new dev demo) confirming `raycaster-lightpool-poc` compiles and runs with zero console errors — no deep raycaster-math integration tests, since validating the visual result is the entire point and that can only be judged by looking at it.

## Success criteria

Purely visual, judged by the user looking at the running POC: does the static light now read as a genuine round pool on floor and ceiling — including when viewed down the test corridor — rather than the rectangular shaft the current finale shows. No automated test can substitute for this judgement call.

## Non-goals

- No change to `raycaster-p10-finale` or any shared library file in `demo-src/raycaster/lib/` — this POC is fully isolated.
- No production-quality edge cases (perspective-correct ellipses, soft occlusion, multi-light blending, colour customization beyond a flat tint) — those are follow-on work only if the POC validates the direction.
- No performance optimization — the POC is explicitly allowed to be unoptimized.
