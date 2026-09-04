# Raycaster wall-mesh spike — findings

_Spec: docs/superpowers/specs/2026-09-04-raycaster-wall-mesh-spike-design.md_
_Plan: docs/superpowers/plans/2026-09-04-raycaster-wall-mesh-spike.md_

## Setup used
- Shader path: **custom per-vertex tint** — one `PIXI.Shader` per pooled mesh, GLSL
  `texture(uTexture, vUV) * vColor` (per-vertex colour attribute drives the per-column
  light gradient).
- Texture filtering: default (linear); not evaluated further since the spike was
  reverted before a seam issue could surface.

## What it validated
- A batched `drawing.wallColumn` / `drawing.wallFlush` primitive works: all textured
  wall columns for a given wall image collapse into one `PIXI.Mesh` and ~1-4 GL draw
  calls per frame, regardless of on-screen column count.
- After a GLSL `#version 300 es` compile fix, it rendered correctly in the in-app
  preview (walls textured, tinted, perspective-correct).

## Why it was reverted
Discussed directly rather than measured further:

- **Walls only, not a renderer.** The mesh path never touched floors, ceilings,
  flat-fill colours, steps/diagonals, or actors — those stayed on the existing
  sprite/graphics path regardless of the toggle. Promoting it to a real alternative
  renderer meant extending the same batching to every other surface type, which is
  its own substantial project, not a toggle flip.
- **No geometry or lighting benefit.** It reproduces the exact visual output of the
  sprite path — same DDA-derived flat quad per column, same one-tint-per-column
  shading (`RcLights.sampleAt`, applied uniformly). It is a pure draw-call-count
  optimization, not a step toward richer wall geometry or per-pixel lighting.
- **Scaling trade, not a flat win.** Cost scales with distinct wall textures visible
  on screen rather than with column count — a big win for scenes with one or two wall
  textures, a shrinking one as texture variety grows.
- **New maintenance burden.** Hand-rolled GLSL (manual vertex/index buffer packing,
  a `#version 300 es` directive PIXI doesn't inject) replaces PIXI's own
  battle-tested Sprite/Mesh renderer, and already produced one real cross-context GL
  bug (the "walls vanish" shader-compile failure) that the sprite path has no
  equivalent risk surface for.
- A follow-up instrumentation attempt (`world.drawCalls()` / `world.gpuFrameMs()`)
  to make the fps-headroom comparison concrete also broke previews in Chrome (a GPU
  timer query bracketing PIXI's whole frame) and was reverted separately before this
  decision — so the A/B was ultimately made on code-reading + one hands-on session,
  not full instrumented numbers.

## Verdict

**Revert.** Ship Phase 9 on the original per-column sprite/graphics renderer (rung 1
painter's-fill + the O(n²) draw-pool fix from `381e5c4`, which stays). All wall-mesh
spike code (`drawing.wallColumn`/`wallFlush`, `RcRender.setWallMesh`, the p9-bench `M`
toggle) has been reverted from `main`. The spec and plan docs remain as a record of
what was tried and why it didn't graduate — a mesh-batched wall path could be
revisited later, but only as part of a full mesh-based renderer (floors/ceilings/
actors included), not as a walls-only bolt-on.

Rung 2 of Phase 9's optimisation backlog (light caching, `RC_STRIP_W` tuning,
span-array hoisting) remains open on the original renderer if further headroom is
needed later. Phase 9 is otherwise considered done; next up is Phase 10.
