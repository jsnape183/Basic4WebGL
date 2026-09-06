# Raycaster Floor-Field POC — combined spec + plan

**Status:** approved to execute (streamlined — token-constrained session).

**Goal:** Replace the raycaster light-pool POC's drifting floor/ceiling "pool"
overlays with a true per-pixel floor-caster: one engine primitive that, for
every screen pixel of a flat plane, reconstructs the world point the pixel
looks at and samples `texture(worldPos) × light(worldPos)`. Texture and light
are the same world-space lookup, so nothing slides under rotation/strafe.

## Core identity

`projectY(h,d) = scy + (camZ + EYE_Z - h)*(viewH/d) + pitch`

Inverse, per pixel (screen `x`,`y`; `horizon = scy + pitch`):

```
rowY   = y - horizon
d      = (camZ + EYE_Z - planeZ) * viewH / rowY          # floor: rowY>0 ; ceiling: rowY<0
camXc  = 2*x/viewW - 1
rayX   = fDirX + fPlaneX*camXc      # NOT normalised; forward component == 1
rayY   = fDirY + fPlaneY*camXc      # so perpendicular distance d IS the ray param
wx     = camX + rayX*d
wy     = camY + rayY*d
frag   = texture(floorTex, fract(vec2(wx,wy))) * max(ambient, lightmap(wx/mapCols, wy/mapRows).r)
```

Same math lives twice: once in GLSL (the shader), once in JS
(`_planeFieldWorldPos`, exported for tests).

## Scope

**In:** one flat floor plane (`planeZ=0`) + one flat ceiling plane
(`planeZ=RC_STD_CEIL`); baked static lightmaps (one per plane); a single new
engine primitive; revived `registerLightmap`; POC renderer rewire.

**Out (untouched):** staircase/dais / any height variation, `fcol:`/`ccol:`,
dynamic lights, multi-level occlusion, all `Rc*` wall code, the wall loop,
the shared `RcRender.bas`. The POC map is already flat, so the field is
painted first and the wall loop paints over it — no per-pixel wall depth test.

## Fallback ladder (hard rule)

Shader route (A) → **max 2 fix attempts** → CPU pixel-buffer route (C, same
primitive signature, `_planeFieldWorldPos` reused, writes a `BufferImageSource`)
→ perspective-strip route (B) → stop and report.

## Files

| File | Change |
|---|---|
| `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts` | add `registerLightmap`, `drawPlaneField` |
| `src/lib/Basic4WebGL/defs/drawing.bas` | regenerate (`npm run generate:library`) |
| `src/components/Runner/engine/drawing.js` | `_lightmapCache`; `registerLightmap` (verbatim from `b073519`); `_planeFieldWorldPos(px,py,pose)` exported; `drawPlaneField(...)` (PIXI v8 `Mesh`+`Shader`, one full-viewport quad); `_drawingReset` teardown |
| `demo-src/raycaster-lightpool-poc/RcRenderPool.bas` | drop `drawLightPools`; `bindLights` bakes 2 lightmaps via `lightAtPoint`; add `drawFloorField`/`drawCeilField` calling `drawPlaneField`; in `renderFrame` draw fields right after `drawing.clear()` + backfill, before the wall loop |
| `demo-src/raycaster-lightpool-poc/assets/lightpool.stm` | add `fcol:`-free floor texture marker? no — texture name passed by the scene; add nothing |
| `demo-src/raycaster-lightpool-poc/PoolScene.bas` | pass a floor + ceiling texture name to the renderer (`rc_tex_concrete.png` / `rc_placeholder_tiles.png`, whichever loads) via a `setFieldTextures(floor, ceil)` setter |
| `src/docs/demos/RaycasterLightpoolPoc.b4wgl.json` | rebuild export (`npx tsx scripts/buildDemo.ts` or equivalent) |
| `tests/components/Runner/drawing.test.ts` | `_planeFieldWorldPos` round-trip + pose-independence; `registerLightmap`/`drawPlaneField` call through under fakes |
| `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts` | replace ellipse assertions with: for fixed world points, `project(W, poseA/B/C)` back-projects to `W` under rotation+strafe (the real ground-lock property) |
| `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts` | unchanged; must stay green (stub `_sb.registerLightmap`, `_sb.drawPlaneField`) |

## `drawPlaneField` signature

```
drawing.drawPlaneField(texName, planeZ, camX, camY, camZ, fDirX, fDirY,
                       fPlaneX, fPlaneY, camPitch, viewW, viewH, scy, eyeZ,
                       lightmapId, ambient)
```

Engine: builds/pools one `PIXI.Mesh` (unit-quad `Geometry`, custom `Shader`),
`aPosition` 0..1 mapped to a full-viewport clip quad in the vertex shader;
fragment shader runs the inverse projection above, `discard` on the wrong side
of the horizon. Floor tex wrap `repeat`; lightmap `clamp-to-edge`, `linear`.
Mesh registered in `_liveM`/`_poolM`-style list, `zIndex` by draw order,
destroyed in `_drawingReset`.

## `registerLightmap(id, w, h, worldCols, worldRows, bytes)`

Verbatim from commit `b073519`: `BufferImageSource({resource:Uint8Array(bytes),
width:w, height:h, addressMode:'clamp-to-edge', scaleMode:'linear'})` →
`Texture` → `_lightmapCache.set(id, {texture, worldCols, worldRows})`. Torn
down in `_drawingReset`.

## Lightmap bake (in `RcRenderPool.bindLights`)

`LM_RES = 4` texels/cell. Grid `w = mapCols*LM_RES`, `h = mapRows*LM_RES`.
Per texel centre `(wx,wy)`: `v = clamp(ambient + lightAtPoint(wx,wy,z), 0, 1)`,
push `[round(v*255), same, same, 255]`. `z = 0.05` for the floor map,
`RC_STD_CEIL - 0.05` for the ceiling map. Two ids: `"rcpoc_floor"`,
`"rcpoc_ceil"`. Called once (bindLights runs once).

## Commits

1. **Engine + defs.** `registerLightmap`, `drawPlaneField`, `_planeFieldWorldPos`,
   descriptor + regen, `_drawingReset` teardown, `drawing.test.ts` cases.
   Verify: `npx vitest run tests/components/Runner/drawing.test.ts
   tests/lib/Basic4WebGL/unit/generator`.
2. **POC rewire.** `RcRenderPool.bas` + `PoolScene.bas`; rebuild export.
   Verify: smoke test + ground-lock test + `npx vite build`.
3. **Docs.** API-reference entry for `registerLightmap`/`drawPlaneField`;
   note the POC in the raycaster guide; this spec's status → done.

## Testing (automated ceiling is low — accepted)

- `_planeFieldWorldPos` pure-math round-trip + pose-independence (the
  ground-lock proof that failed to be tested properly before).
- Smoke: transpiles + `renderFrame()` runs, zero runtime errors.
- `npx vite build` green.
- **Visual pass is the user's, off-session.** Success = "a light pool that
  stays painted on the ground when you rotate and strafe, over a texture that
  recedes correctly to the horizon."
