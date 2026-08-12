# Tile collision — design exploration (PARKED)

> **Status: parked, not approved, not ready for implementation.** This captures where a brainstorming session got to before concluding the real prerequisite question (a velocity-based movement model) needs its own separate resolution before tile collision itself can be designed properly. Revisit by re-opening brainstorming on the open question at the bottom, not by jumping to writing-plans against this doc as-is.

## Problem

Reported while testing bullet-hell-shooter: sprites visibly overlap walls instead of stopping cleanly against them. Root-caused, not assumed:

- `Bullet.bas`/`Mob.bas` (bullet-hell-shooter) check collision with a **single point sample at the sprite's center** (`self.level.tileAt("walls", x, y) <> 0`) — no width/height at all. A sprite can overlap half into a wall until its exact center crosses the tile boundary.
- `Player.bas` (coins-platformer) does something more elaborate — several hand-picked edge-sample points with hardcoded per-sprite pixel margins (`edgeX = newX + dir * 4`, `feetY = y + 4`, etc.) — but it's fragile, tuned per-sprite, and duplicated logic every demo author would have to reinvent and likely get wrong (this exact class of mistake already shipped once, in the coins-platformer, before being caught and fixed by hand).

This matches a pre-existing, already-tracked roadmap item (`docs/roadmap.md`, "Next up — Tile collision helper") flagged back on 2026-08-04 during coins-platformer development, never designed past two open questions. This session's conversation picked that item up and got further, but surfaced a bigger prerequisite than either open question anticipated.

## What got resolved

**Q1 (roadmap): how is "solid" defined?** Settled: a dedicated, paintable **collision layer** in the Tilemap Editor — a boolean solid/not-solid grid, same mechanism as today's tile/marker layers (reusing the layer system shipped this session), not a per-tile-ID flag on the palette/tileset.

Why this over per-tile-ID flags: decouples solidity from visual art (two different-looking tiles can both be walls; the same tile ID can be solid in one map and decorative in another), reuses the editor/layer/paint UI directly with no new UI surface needed, and — the deciding factor — it's **already compatible with `pathfinding.setup(tileMapSet, blockingLayers)` today with zero pathfinding-side engine changes**. `pathfinding.setup` already treats "any non-zero cell in a named layer" as blocking; pointing it at a purpose-painted collision layer instead of a visual "walls" art layer is the same call, just a cleaner input. One collision-mask concept, reused by both systems.

**Q2 (roadmap): API shape?** Partially settled, then reopened by the physics question below. Landed on wanting to mirror `pathfinding.setup()` / `navigateTo()`'s two-call shape (one-time `collision.setupTileCollision(tileMapSet, layerNames)` to build an internal grid, then a cheap per-frame call) for familiarity and to avoid re-deriving the solid grid from raw layer data every frame — but the per-frame call's actual shape is now blocked on the physics question, not settled.

## What's still open — the real blocker

Walking through what "the rest is handled" (the user's own framing — attach a sprite as collidable, stop thinking about it) would actually require surfaced a bigger question than tile collision alone:

`setPosition()`-based movement (what every demo does today) has no notion of "was blocked" — it teleports. There's nothing for a collision system to push back against. Making tile collision genuinely invisible to the author (not just a helper function they still have to call correctly every frame) means sprites need a **velocity-based movement model** — something closer to Godot's `CharacterBody2D`: you set `velocity`, the engine applies it each frame via a `move()`-style step, and collision is a force that acts against that application, not something bolted on after the fact.

That reframes the whole feature as two related but separable pieces:
1. **A velocity-based movement primitive** — `sprite.velocity`/`vx`,`vy` (naming TBD) applied by the engine each frame, replacing ad-hoc `setPosition` math in `onupdate`. Independently useful even without tile collision — a natural home for sprite-vs-sprite collision *response* too (today's `collision.spriteCollide` only reports overlap, doesn't resolve it), and a foundational change to how movement idiomatically works in softBASIC.
2. **Tile collision resolution** — the collision-mask-layer design above, which becomes the thing velocity application resolves against (block/slide along solid tiles).

**The open question this session ended on, unresolved:** is a full velocity-based movement model a genuine prerequisite for tile collision, or is there a lighter-weight version of "attach and forget" that doesn't require rethinking how every sprite moves? This needs its own dedicated brainstorm — it's a bigger, more foundational design question than "tile collision helper" and deserves to be scoped on its own terms (does it replace `setPosition` entirely or coexist with it? does it change `sprite`/`animatedsprite`'s public API? what does `pathfinding.navigateTo` — which already moves sprites internally — become in a world with sprite velocity?) rather than answered as a side effect of a collision spec.

## Non-conclusions (deliberately not decided)

- Whether the collision layer is visually distinct in the editor (a color/icon convention) — not discussed, would be revisited alongside implementation.
- Whether `resolveTileCollision`/equivalent lives in the `collision` module (consistent with `spriteCollide`/`boxCollide`/`circleCollide`) or on `tilemap`/`TileMapLayer` — leaning `collision` module for API discoverability, not firmly settled.
- Whether "grounded" detection (platformer jump-state) is in scope for the first cut, or left for authors to derive from "was Y-axis blocked while moving down" themselves.
- Pixel-perfect / shaped collision masks beyond per-cell solid/not-solid — explicitly out of scope per the user ("probably scope overkill").
