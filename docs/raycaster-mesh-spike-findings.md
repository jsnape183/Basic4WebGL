# Raycaster wall-mesh spike — findings

_Spec: docs/superpowers/specs/2026-09-04-raycaster-wall-mesh-spike-design.md_
_Toggle: `raycaster-p9-bench`, press `M`. HUD shows `MESH on/off`, `prim`, `flush <ms>`, `fps`._

## Setup used
- Shader path: **custom per-vertex tint** — Task 1 used the primary path with no fallback: one `PIXI.Shader` per pooled mesh, GLSL `texture(uTexture, vUV) * vColor` (per-vertex colour attribute drives the per-column light gradient). The `mesh.tint` single-per-mesh fallback was not needed.
- Texture filtering: **default (linear)** — Task 1 did not set NEAREST on the wall texture source. The spec (§8) flags UV seams between adjacent column quads as a risk to watch for; if seams appear, switching the wall texture source to NEAREST filtering is the fix.

## A/B observations (fill in after play-testing)

| | sprite path (M off) | mesh path (M on) |
|---|---|---|
| prim count (stress32, autopilot) |  |  |
| fps at stress32 |  |  |
| fps pushed hard (stress48 + close to a textured wall) |  |  |
| flush ms | n/a |  |

Headless (from `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`, `wall-mesh path`): with the toggle **ON**, a flat textured room produces **0** `drawImageStrip` sprites and routes every wall column into the mesh buffer; with the toggle **OFF**, the `drawImageStrip` sprites return. (Real prim-count / fps / flush-ms numbers are yours to fill from the browser HUD.)

### Visual
- Textures map correctly?
- Perspective correct (no warping)?
- Per-column light gradient present / matches sprite path?
- Seams between column quads?
- Occlusion against floor-steps correct (wall behind a step V-clipped)?
- Anything that looks worse than the sprite path?

### Feel
- Does the cliff go away / soften?
- Does this feel like "yes, this is the rendering path"?

## Verdict

**[ pursue Option 1 / revert / another spike iteration ]**

One-line rationale:
