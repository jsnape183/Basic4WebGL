# Collision Module Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single `gfx.boxCollide` function with a dedicated `collision` module in softGfx, adding circle collision, point-in-box, raycast (first hit), and raycastAll (all hits with a RayHit result class).

---

## API Surface

### `collision.spriteCollide(a, b)`

AABB test using PIXI's `getBounds()` on both sprites. This is the same implementation as the current `gfx.boxCollide`. Returns `true` or `false`.

```bas
if collision.spriteCollide(player, enemy) then
  gameOver()
endif
```

### `collision.boxCollide(x1, y1, w1, h1, x2, y2, w2, h2)`

AABB test with explicit box dimensions. `x`, `y` is the **centre** of each box (consistent with how `drawRect` works in the engine). Returns `true` or `false`.

```bas
dim px = player.transform.x()
dim py = player.transform.y()
if collision.boxCollide(px, py, 32, 48, ex, ey, 40, 40) then
  gameOver()
endif
```

### `collision.circleCollide(a, radiusA, b, radiusB)`

Circle-circle test. Passes the softBASIC sprite objects and explicit radius values. Internally reads `a.transform.x()` / `a.transform.y()` (via `_handle.position.x` / `.y`) to get centres. Returns `true` if `distance(centreA, centreB) < radiusA + radiusB`, else `false`.

```bas
if collision.circleCollide(coin, 12, player, 20) then
  collectCoin()
endif
```

### `collision.pointInBox(x, y, sprite)`

Tests whether a point `(x, y)` falls inside the sprite's PIXI bounding box. Returns `true` or `false`. Primary use case: mouse click detection on sprites.

```bas
if collision.pointInBox(input.mouseX(), input.mouseY(), btn) then
  onClick()
endif
```

### `collision.raycast(x, y, angle, distance, sprites)`

Casts a ray from `(x, y)` in `angle` degrees (0 = right, 90 = down, 180 = left, 270 = up) for up to `distance` pixels. Tests each sprite in the `sprites` array against the ray using AABB intersection. Returns the **first** sprite hit (nearest to origin), or `false` if nothing is hit.

```bas
dim hit = collision.raycast(x, y, 270, 200, enemies)
if hit <> false then
  hit.takeDamage(10)
endif
```

### `collision.raycastAll(x, y, angle, distance, sprites)`

Same ray as `raycast` but returns **all** sprites hit as an array of `RayHit` objects, sorted nearest first. Returns an empty array (`length 0`) if nothing is hit.

```bas
dim hits = collision.raycastAll(x, y, 45, 400, enemies)
dim i
for i = 0 to array.arrLength(hits) - 1
  dim h = hits(i)
  if h.distance < 100 then
    h.sprite.takeDamage(10)
  endif
next i
```

---

## RayHit Class

`RayHit` is a softBASIC built-in class returned by `raycastAll`. Users never instantiate it directly — the engine creates instances and populates the array.

| Property | Type | Description |
|----------|------|-------------|
| `sprite` | object | The sprite that was hit |
| `distance` | number | Pixels from the ray origin to the hit point |

The engine creates plain JS objects shaped as `{ sprite, distance }`. softBASIC property access (`h.sprite`, `h.distance`) works directly on these fields. A `RayHit` class definition (`rayhit.bas`) is included in the softGfx package so the type is recognised by the compiler.

---

## Backward Compatibility

`gfx.boxCollide(a, b)` is kept as a **permanent alias** for `collision.spriteCollide(a, b)` — same implementation, never removed. All existing tutorials and user code continue to work without changes.

---

## Architecture

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/Basic4WebGL/defs/collision.bas` | softBASIC module definition — 6 functions |
| `src/lib/Basic4WebGL/defs/rayhit.bas` | softBASIC class definition for RayHit |
| `src/components/Runner/engine/collision.js` | `_sbCollision` IIFE — all collision engine logic |

### Files Modified

| File | Change |
|------|--------|
| `src/components/Runner/softBasicEngine.js` | Spread `..._sbCollision` into `_sb` |
| `src/components/Runner/index.tsx` | Import `collision.js?raw`, add to concat array |
| `src/constants/packageModules.ts` | Import and register `collision` and `rayhit` |
| `src/lib/Basic4WebGL/defs/gfx.bas` | Keep `boxCollide` — now delegates to `_sb.spriteCollide` |
| `src/lib/Basic4WebGL/library/descriptors/gfx.descriptor.ts` | Keep `boxCollide` descriptor pointing at `_sb.spriteCollide` |
| `src/docs/api-reference/collision.md` | New API reference page |
| `src/docs/manifest.ts` | Add collision page to softGfx group |

### Engine Module Pattern

`collision.js` follows the same IIFE pattern as all other engine modules:

```js
const _sbCollision = (() => {
  return {
    spriteCollide(a, b) { /* PIXI getBounds AABB */ },
    boxCollide(x1, y1, w1, h1, x2, y2, w2, h2) { /* explicit AABB */ },
    circleCollide(a, rA, b, rB) { /* distance < rA+rB */ },
    pointInBox(x, y, sprite) { /* point in getBounds */ },
    raycast(x, y, angle, dist, sprites) { /* first AABB hit or false */ },
    raycastAll(x, y, angle, dist, sprites) { /* sorted RayHit array */ },
  };
})();
```

### Raycast Implementation Detail

The ray is parameterised as:
- Origin: `(x, y)`  
- Direction: `dx = cos(angle * π/180)`, `dy = sin(angle * π/180)`
- End point: `(x + dx*distance, y + dy*distance)`

For each sprite, the engine tests ray-segment vs AABB using slab intersection. The hit distance `t` satisfies `0 ≤ t ≤ distance`. Results are sorted ascending by `t` before returning.

### RayHit Objects

The engine creates plain JS objects: `{ sprite: sbSpriteObj, distance: t }`. The `sprite` field holds the original softBASIC sprite wrapper (with `._handle`), so the user can call methods on it directly (`h.sprite.destroy()`, etc.).

---

## Testing

Transpiler tests verify the `.bas` def files compile correctly:
- `collision.spriteCollide(a, b)` → `_sb.spriteCollide(a, b)`
- `collision.boxCollide(x1,y1,w1,h1, x2,y2,w2,h2)` → correct arg count
- `collision.circleCollide(a, rA, b, rB)` → correct arg count
- `collision.pointInBox(x, y, sprite)` → correct arg count
- `collision.raycast(x, y, angle, dist, sprites)` → `_sb.raycast(...)`
- `collision.raycastAll(x, y, angle, dist, sprites)` → `_sb.raycastAll(...)`
- `gfx.boxCollide(a, b)` still compiles (backward compat alias)
- `RayHit` property access: `h.sprite`, `h.distance`

Runtime behaviour is not tested via the transpiler suite — verified manually.
