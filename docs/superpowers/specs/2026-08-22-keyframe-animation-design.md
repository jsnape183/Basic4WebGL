# Keyframe (Tween) Animation — Design

## Goal

A new softBASIC engine feature: a `tween` module that animates a sprite's **angle, scale, alpha, and position** over a sequence of user-built `Keyframe` objects. Built as a reusable capability (any future demo can use it — a chest lid opening, a coin bobbing, a title-screen flourish), proven out immediately by Dungeon Explorer's melee attack: the player spins 360° and a sword sprite swings out through a small arc.

Revised twice from the first draft after feedback:

1. **Position is in.** No attached/child sprites are planned, so the conflict that would come from a tween and other game logic both trying to own a sprite's position per-frame only matters once something is being *continuously* repositioned externally — e.g. a weapon glued to a moving wielder every frame. Nothing here does that: the sword's whole flight is owned by its own keyframe sequence, anchored once at attack-start, so there's no fight over who writes position each frame. If attached/child sprites get built later, "position relative to parent" is a separate concern to design then, not something this feature needs to anticipate now.
2. **It's a free module (`tween`), not sprite instance methods.** Keeps this out of the main `sprite`/`animatedsprite` classes entirely, and — as a direct consequence — sidesteps a real problem the sprite-method version had: `animatedsprite` doesn't actually inherit from `sprite` in this codebase (confirmed by reading it — it duplicates `setAngle`/`setAlpha`/`setScale` itself rather than extending), so instance methods would've needed hand-duplicating onto both classes. A free module sidesteps that completely, exactly like `pathfinding.navigateTo(sprite, x, y, speed)` / `isNavigating` / `stopNavigating` already does in this exact codebase — same shape, already-proven pattern.

## API — two pieces

**1. `Keyframe` — a plain data class, hand-written, zero engine JS.** New `src/lib/Basic4WebGL/defs/Keyframe.bas`:

```bas
Class
dim time
dim angle
dim scaleX
dim scaleY
dim alpha
dim x
dim y

Constructor()
  self.time = 0
  self.angle = 0
  self.scaleX = 1
  self.scaleY = 1
  self.alpha = 1
  self.x = 0
  self.y = 0
EndConstructor

function setTime(t)
  self.time = t
endfunction

function setAngle(a)
  self.angle = a
endfunction

function setScaleX(sx)
  self.scaleX = sx
endfunction

function setScaleY(sy)
  self.scaleY = sy
endfunction

function setAlpha(al)
  self.alpha = al
endfunction

function setPosition(px, py)
  self.x = px
  self.y = py
endfunction

EndClass
```

All fields default to a neutral, safe value (`angle=0`, `scaleX`/`scaleY`/`alpha=1`, `x`/`y=0`) — **except there's no safe default for position**, so the rule is simple and unambiguous rather than clever: if a sequence uses position at all, call `setPosition` on every keyframe in it, or the ones you skip snap to `(0, 0)`. Documented plainly, not silently patched around — consistent with how this codebase already prefers a clear thrown-error/documented-constraint over magic fallback behavior (e.g. `collision.setTileSolid` throwing rather than guessing).

**2. `tween` — a free module.** New `src/lib/Basic4WebGL/defs/tween.bas`:

```bas
function play(sprite, frames, loop)
    call("_sb.tweenPlay(play_sprite, play_frames, play_loop)")
endfunction

function stop(sprite)
    call("_sb.tweenStop(stop_sprite)")
endfunction

function isPlaying(sprite)
    return call("_sb.tweenIsPlaying(isplaying_sprite)")
endfunction
```

Usage:

```bas
dim k1 as Keyframe
k1 = new Keyframe()
k1.setTime(0)
k1.setAngle(0)

dim k2 as Keyframe
k2 = new Keyframe()
k2.setTime(0.4)
k2.setAngle(360)

dim frames(0)
array.push(frames, k1)
array.push(frames, k2)

tween.play(self, frames, false)
```

- `tween.play(sprite, frames, loop)` — starts playing on the given sprite; `frames` don't need to be pre-sorted (engine sorts a copy by `time`). Calling it again on a sprite already animating restarts cleanly, which is how "switch between anims programmatically" works — no queueing, just call it with a different `frames` array (e.g. an idle-bob sequence vs. an attack-spin sequence), so animations can live as named builder functions/classes and get swapped in from game logic.
- `time` is an absolute offset in seconds from when `play` starts (matches the existing timer-field convention already used everywhere in this codebase, e.g. `attackCooldown`), not a 0–1 fraction.
- Before the first keyframe's `time`, the sprite snaps immediately to the first keyframe's values — no implicit "start from current state" frame. Include an explicit `time=0` keyframe matching the sprite's current values if a smooth start matters.
- After the last keyframe: `loop=false` holds the final values and `tween.isPlaying` becomes `false`; `loop=true` wraps elapsed time modulo the last keyframe's `time`.
- `tween.stop(sprite)` halts in place, holding whatever values were current.

`sprite` here is passed as the whole softBASIC object (matching `pathfinding.navigateTo`'s existing convention, not `sprite.descriptor.ts`'s convention of passing `self._handle` directly) — since `tween` is a free module function, not a class method, it receives whatever the caller passes and needs to unwrap `._handle` itself engine-side (same as `pathfinding.js` already does). Works identically for a plain `sprite` or an `animatedsprite` instance, since both expose `._handle` the same way.

## Engine implementation

New `src/components/Runner/engine/tween.js`, mixed into `_sb` in `softBasicEngine.js`:

```js
const _sbTween = {
  _playing: new Map(), // handle -> { frames: [...sorted by time], loop, elapsed }

  tweenPlay(spriteObj, frames, loop) {
    if (!spriteObj || !spriteObj._handle || !frames || frames.length === 0) return;
    const sorted = [...frames].sort((a, b) => a.time - b.time);
    this._playing.set(spriteObj._handle, { frames: sorted, loop: !!loop, elapsed: 0 });
  },

  tweenStop(spriteObj) {
    if (spriteObj && spriteObj._handle) this._playing.delete(spriteObj._handle);
  },

  tweenIsPlaying(spriteObj) {
    return !!(spriteObj && spriteObj._handle && this._playing.has(spriteObj._handle));
  },

  _tweenUpdate(delta) {
    const dt = delta / 1000;
    for (const [handle, state] of this._playing) {
      state.elapsed += dt;
      const { frames, loop } = state;
      const last = frames[frames.length - 1];
      let t = state.elapsed;

      if (loop) {
        t = t % last.time;
      } else if (t >= last.time) {
        this._applyFrame(handle, last);
        this._playing.delete(handle);
        continue;
      }

      let i = 0;
      while (i < frames.length - 1 && frames[i + 1].time <= t) i++;
      const a = frames[i];
      const b = frames[Math.min(i + 1, frames.length - 1)];
      const span = b.time - a.time;
      const f = span > 0 ? (t - a.time) / span : 0;

      // NOTE: Keyframe's softBASIC fields `scaleX`/`scaleY` compile to
      // lowercase `scalex`/`scaley` (confirmed via a throwaway transpile,
      // not assumed) -- read those, not the camelCase names.
      this._applyFrame(handle, {
        angle: a.angle + (b.angle - a.angle) * f,
        scaleX: a.scalex + (b.scalex - a.scalex) * f,
        scaleY: a.scaley + (b.scaley - a.scaley) * f,
        alpha: a.alpha + (b.alpha - a.alpha) * f,
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
      });
    }
  },

  _applyFrame(handle, v) {
    handle.angle = v.angle;
    handle.scale.set(v.scaleX, v.scaleY);
    handle.alpha = v.alpha;
    handle.position.set(v.x, v.y);
  },
};
```

Wired into the main loop exactly like `pathfinding`'s `_pathfindingUpdate`: `src/components/Runner/engine/scene.js`'s `_update(delta)` gains `this._tweenUpdate(delta);` alongside the existing `_cameraUpdate`/`_pathfindingUpdate` calls.

`Keyframe` instances passed from `.bas` code arrive here as real compiled class instances, not plain JS object literals — confirmed directly via a throwaway `compiler.transpile()` run rather than assumed: `time`/`angle`/`alpha`/`x`/`y` stay as-is (already lowercase, single-word), but `scaleX`/`scaleY` compile to `scalex`/`scaley`. The interpolation code above reads the correct lowercase names.

## Def registration

Both `Keyframe.bas` and `tween.bas` are hand-written (no descriptor, no generation step) — added to:
- `src/constants/packageModules.ts` (two new imports + map entries)
- `src/constants/firstPartyPackages.ts`'s `softgfx` `moduleNames` list, with a version bump (`2.5.0` → `2.6.0`, following this project's established convention of bumping `softGfx`'s version on every new module it ships — confirmed via git history, e.g. `collision.setTileSolid` bumped `2.4.0` → `2.5.0`)

No changes to `sprite.descriptor.ts` or `animatedsprite.bas` — this was the whole point of going with a free module.

## Docs + tests

- New API Reference page covering `Keyframe` and the `tween` module, added to `src/docs/manifest.ts`.
- Transpiler tests for `Keyframe`'s field/method codegen and `tween`'s three functions' call-through codegen (mirroring existing `pathfinding.test.ts` shape for the module, `marker.test.ts`-shape if one exists for the class — check first).
- `docs/language/library-roadmap.md` gets a new entry — this isn't closing out an existing tracked item, so it's a fresh bullet, not a status flip.

## Dungeon Explorer integration (the proving-out demo)

Scoped as its own follow-up plan once `tween`/`Keyframe` ship, so the engine feature gets a clean review/test/docs pass before the demo depends on it:

1. **`player.png`**: bake the Kenney sword sprite into the existing idle/walk frames (held in hand) — a static asset edit, no code.
2. **New `Sword.bas`** (extends `sprite`, using a separate Kenney sword tile): constructed alongside `Player`, invisible except during the attack window. `Player.tryAttack()` makes it visible, anchors a keyframe sequence at the player's current position + facing direction (a small outward arc — position, angle, and a brief scale/alpha flourish all keyframed), and hides it again once the sequence finishes.
3. **`Player.tryAttack()`**: calls `tween.play(self, frames, false)` for the 360° spin (`0°` at `time=0` → `360°` at `time=0.4`, matching the existing `attackCooldown` duration).
