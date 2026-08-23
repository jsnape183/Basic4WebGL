# Sprite Attachment (`attachTo` / `detach`) — Design

## Goal

A new softBASIC engine feature: `attachTo(parent)` / `detach()` instance methods on `sprite` (and duplicated onto `animatedsprite`) that let one sprite follow another's position and rotation automatically — a real parent/child relationship, not a hand-built approximation.

Motivated directly by Dungeon Explorer's melee attack: `Sword.bas`'s `swing()` currently hand-builds a circular path with `math.cos`/`math.sin` across 8 keyframes, timed by hand to match the player's own spin tween — functionally correct but explicitly called out in `src/docs/demos/dungeon-explorer.md` as "the most advanced code in this demo," not something a beginner should have to write. This feature replaces that workaround.

This was deliberately deferred out of the keyframe/tween work (`docs/superpowers/specs/2026-08-22-keyframe-animation-design.md`), which noted: *"If attached/child sprites get built later, 'position relative to parent' is a separate concern to design then, not something this feature needs to anticipate now."* This is that follow-up.

## Key design decision: lean on PIXI's native parenting

The engine already keeps every sprite as a flat child of `worldContainer` or `hudContainer` (`src/components/Runner/engine/stage.js`), added via plain `PIXI.Container.addChild`. PIXI containers already do everything this feature needs natively: a child's `position` and `angle` are automatically interpreted relative to whatever container holds it, and that stays true no matter how deep the nesting goes.

So instead of hand-computing rotated offsets per frame (the approach the keyframe/tween spec's author originally worried about), `attachTo(parent)` simply **reparents** the child's PIXI display object to be a child of `parent`'s display object instead of the world/hud container. From that point on:

- The child's *existing* `setPosition(x, y)` call sets its offset in the parent's local space — no new offset parameters needed.
- The child's *existing* `setAngle(a)` call sets a local angle added on top of the parent's rotation — no new angle-offset parameter needed.
- As the parent moves or spins, the child moves and spins with it, automatically, every render frame — handled entirely by PIXI's transform stack.

**Consequence: no per-frame engine update loop is needed for this feature at all.** Unlike `tween`, which needs a `_tweenUpdate(delta)` hook in `scene.js`, attachment is purely structural — set it up once at `attachTo()` time and PIXI does the rest on its own.

## API

Two instance methods, added to `sprite` (via its descriptor) and hand-duplicated onto `animatedsprite` (same convention already used for `setAngle`/`setAlpha`/`setScale`/etc., since `animatedsprite` does not inherit from `sprite` in this codebase):

```bas
' Attach a sword to the player. Position/angle are now relative to the player.
sword.attachTo(player)
sword.transform.setPosition(0, 0)   ' centered on the player
sword.setAngle(90)                  ' held out to the side, rotates with the player

' Later, to stop following:
sword.detach()
```

- `attachTo(parent)` — reparents `self` under `parent`. Calling it again while already attached silently switches to the new parent (no error, no need to `detach()` first) — consistent with `tween.play()`'s existing "restart cleanly" convention.
- `detach()` — reparents `self` back into whichever container (`world` or `hud`) it lived in *before the first* `attachTo()` call. A no-op if `self` isn't currently attached to anything.
- A sprite can only ever have one parent at a time (inherent to PIXI's tree structure — not an extra restriction this feature adds). **Multi-level chains are fully supported for free**: if `sword.attachTo(player)` and `player.attachTo(cart)`, the sword inherits the player's local transform, which itself inherits the cart's — no special-casing needed, this falls straight out of PIXI's normal scene graph.

## Engine implementation

New `src/components/Runner/engine/attach.js`, mixed into `_sb` in `softBasicEngine.js` (mirroring `tween.js`'s shape — a small `Map` tracking state, no per-frame work):

```js
const _sbAttach = {
  _originalParents: new Map(), // childHandle -> the container it lived in before its first attachTo

  attachSprite(childHandle, parentObj) {
    if (!childHandle || !parentObj || !parentObj._handle) return;
    if (!this._originalParents.has(childHandle)) {
      this._originalParents.set(childHandle, childHandle.parent);
    }
    parentObj._handle.addChild(childHandle);
  },

  detachSprite(childHandle) {
    const originalParent = this._originalParents.get(childHandle);
    if (!originalParent) return;
    originalParent.addChild(childHandle);
    this._originalParents.delete(childHandle);
  },
};
```

`PIXI.Container.addChild` already handles removing a display object from its previous parent before adding it to the new one, so no explicit `removeChild` call is needed on either path.

## Def registration

**`sprite.descriptor.ts`** gains two methods (regenerate `sprite.bas` via `npm run generate:library` — this file is descriptor-generated, never hand-edited):

```ts
{
  name: 'attachTo',
  params: ['parent'],
  body: (p, self) => `_sb.attachSprite(${self._handle}, ${p.parent})`,
},
{
  name: 'detach',
  params: [],
  body: (_p, self) => `_sb.detachSprite(${self._handle})`,
},
```

**`animatedsprite.bas`** (hand-written) gets the matching duplicate, calling the same engine functions directly on `this._handle` — no "Anim"-specific variants needed, since reparenting is generic and doesn't touch any animation-specific state:

```bas
function attachTo(parent)
    call("_sb.attachSprite(this._handle, attachto_parent)")
endfunction

function detach()
    call("_sb.detachSprite(this._handle)")
endfunction
```

No changes needed to `sprites.js`/`stage.js` themselves — `attach.js` is a self-contained new module.

## Caveats (documented plainly, not silently patched around)

Consistent with this codebase's existing preference for a clear, documented constraint over magic fallback behavior (e.g. `Keyframe`'s undefined-position-snaps-to-origin rule):

1. **Position/angle getters become parent-local while attached.** `transform.x()`, `transform.y()`, and angle reads return coordinates relative to the parent, not world coordinates, for as long as the sprite is attached.
2. **Depth sorting becomes parent-local while attached.** `setDepth`/z-index while attached only sorts among the parent's own children — an attached sword's depth is no longer compared against the global world z-order (other enemies, tiles, etc.).
3. **Attachment cycles are unsupported.** Attaching an ancestor back onto its own descendant (e.g., after `B.attachTo(A)` and `C.attachTo(B)`, calling `A.attachTo(C)`) creates a cycle in PIXI's transform/render walk. This isn't detected or guarded against — don't do it.
4. **Call `detach()` before `world.remove()`-ing an attached sprite.** `world.remove()`/`removeFromWorld` calls `worldContainer.removeChild(obj._handle)`, which is a no-op if the object isn't actually a direct child of `worldContainer` anymore (because it's been reparented under another sprite). An attached sprite removed from the world this way stops receiving `onupdate` but remains a dangling PIXI child of its (still-alive) parent.

## Tests

- Transpiler codegen tests for `sprite.attachTo`/`detach` (mirroring existing `sprite.descriptor.ts` test coverage) and for `animatedsprite`'s hand-written equivalents.
- Engine-level test `tests/components/Runner/attach.test.ts`, following the real-module-concatenation pattern in `tests/components/Runner/stage.test.ts` / `tween.test.ts`. Covers: `attachTo` reparents the child under the parent's fake container; `detach` restores the original container; calling `attachTo` again while already attached switches parents but still restores the *original* container on eventual `detach`; `detach` on a never-attached sprite is a no-op.
  - Note: the `FakeContainer` test helper in the existing engine tests doesn't currently set `.parent` on `addChild` (real `PIXI.Container` does). It needs a small extension to track `.parent` so `attach.js`'s `childHandle.parent` read has something real to capture.

## Docs

- New "Attaching sprites" section on the `sprite` and `animatedsprite` API reference pages, covering `attachTo`/`detach`, the local-space semantics, and all four caveats above.
- `docs/language/library-roadmap.md` gets a new entry (this isn't closing out an existing tracked item — the earlier keyframe/tween entry explicitly deferred this rather than tracking it as open work).

## Validating integration: Dungeon Explorer's sword

Proven out immediately by rewriting the exact workaround that motivated this feature. `demo-src/dungeon-explorer/Sword.bas`'s `swing()` currently builds a full circular keyframe path by hand:

```bas
function swing(px, py)
  ' ... 8-step loop computing math.cos/math.sin around (px, py) ...
  tween.play(self, frames, false)
endfunction
```

This becomes:

```bas
function swing()
  self.attachTo(self._player)
  self.transform.setPosition(0, 0)
  self.setVisible(true)
  self.active = true

  dim s1 as Keyframe
  s1 = new Keyframe()
  s1.setTime(0)
  s1.setAngle(0)

  dim s2 as Keyframe
  s2 = new Keyframe()
  s2.setTime(0.4)
  s2.setAngle(360)

  dim frames(0)
  array.push(frames, s1)
  array.push(frames, s2)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if self.active then
    if not tween.isPlaying(self) then
      self.active = false
      self.setVisible(false)
      self.detach()
    endif
  endif
endfunction
```

The sword tweens its own angle from 0° to 360° while attached to the player — since it's parented to the player, that angle is already relative to the player's own rotation, so as both spin together the sword sweeps around exactly like the original hand-built circular path, with no trig and no manual sync between the two tweens' timings. (Exact field/wiring details — e.g. how `Sword` gets a reference to its player — to be finalized in the implementation plan.)

`Player.tryAttack()`'s own call site (`self.sword.swing(self.transform.x(), self.transform.y())`) simplifies to `self.sword.swing()` since the sword no longer needs the player's world position passed in.

`src/docs/demos/dungeon-explorer.md`'s "most advanced code in this demo" callout is removed/updated to reflect the simplified implementation.
