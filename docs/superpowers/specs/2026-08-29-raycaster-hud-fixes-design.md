# Raycaster HUD Fixes — Design

**Date:** 2026-08-29
**Status:** Approved

## Context

Follow-up to the endless-levels feature (`docs/superpowers/specs/2026-08-28-raycaster-levels-design.md`, plan `docs/superpowers/plans/2026-08-28-raycaster-levels.md`). After playing the shipped feature, three gaps were reported:

1. No visual feedback when taking damage.
2. The compass arrow added in the endless-levels plan doesn't actually appear during play.
3. No level number shown in the HUD.

## 1. Compass positioning bug (root cause + fix)

**Root cause:** `demo-src/raycaster/GameScene.bas` hardcodes `self.SW = 800` / `self.SH = 600` in `oninit()` and uses those constants throughout the raycasting math (wall-strip projection, `RAYS`/`STRIP` sizing, `drawExit()`, `drawCompass()`). The actual game canvas is a responsive PIXI canvas (`resizeTo: window` in `bootstrapper.html`) — its real pixel size depends on whatever container it's rendered into, and is **not** guaranteed to be 800×600. In the editor's embedded Run panel (and confirmed live via WebGL pixel readback during this investigation), the real canvas came out smaller than 800×600, so `drawCompass()`'s anchor point (`cx = self.SW - margin = 760`) falls entirely outside the visible canvas and never appears on screen — confirmed by scanning the rendered pixels for the compass's gold color and finding none, despite the underlying PIXI graphics objects existing at the expected in-code coordinates.

The raycasting math itself (wall projection, `RAYS`/`STRIP`) is out of scope for this fix — changing that is a bigger, separate architectural question (whether the raycaster should render at a truly dynamic resolution) and isn't needed to fix the reported bug. The gun sprite in this same file already positions itself using `stage.width()`/`stage.height()` dynamically rather than the fixed constants (`self.weaponSprite.transform.setPosition(stage.width() / 2 + 128, ...)`) — the compass should follow that same established pattern, since it's a HUD-style element anchored to a screen corner, not part of the fixed-resolution raycast projection itself.

**Fix:** In `drawCompass()`, change:
```
cx = self.SW - margin
cy = margin
```
to:
```
cx = stage.width() - margin
cy = margin
```
No other changes needed — the rest of `drawCompass()`'s math (angle calculation, arrow geometry) is unaffected by the anchor point.

## 2. Damage flash

**New asset:** `demo-src/raycaster/assets/damage_flash.png` — a small (8x8) solid opaque red square. Solid + opaque because the *fade* is achieved via `sprite.setAlpha()` at runtime, not baked into the image.

**Implementation:** A new `Sprite` field (`self.damageFlash`), created once in `setupHud()`:
- `new Sprite("damage_flash.png")`, added to `hud`.
- Scaled via `setScale()` to cover the full screen: `self.damageFlash.setScale(stage.width() / 8, stage.height() / 8)` (image is 8x8, so this stretches it to fill `stage.width()` x `stage.height()`).
- Positioned at screen centre: `stage.width() / 2, stage.height() / 2` (sprite is centre-anchored per this codebase's convention).
- `setAlpha(0)` initially — invisible until damage is taken.

**Timer:** A new field `self.damageFlashTimer`, counting down in frames (mirroring the existing `self.flashTimer`/`self.damageCooldown` frame-counter pattern already used in this file — no delta-time needed since this file's other timers use the same convention).
- Peak duration: 18 frames (~0.3s at 60fps).
- When `self.playerHealth` decreases in `onupdate()` (the existing `if dist < 0.8 and self.damageCooldown = 0 then ... self.playerHealth = self.playerHealth - 10 ... endif` block), also set `self.damageFlashTimer = 18`.
- Each frame (in `updateFlashCooldown()`, renamed conceptually but keeping the function — or a small new step in `onupdate()` right after the existing cooldown decrement): if `self.damageFlashTimer > 0`, decrement it and set `self.damageFlash.setAlpha(0.35 * self.damageFlashTimer / 18)`; when it reaches 0, alpha is 0 (fully faded).

Peak alpha of 0.35 keeps this "quick and subtle" per the approved design choice — visible feedback without obscuring enemies/walls underneath.

## 3. Level HUD text

**New field:** `self.levelHudText as Text`, created once in `setupHud()`:
```
self.levelHudText = new Text("Level 1", 20, 50)
self.levelHudText.setStyle(12, 255, 255, 255)
hud.add(self.levelHudText)
```
Positioned directly below the existing `"HP"` label (`self.hpLabel`, at `(20, 36)`), same 12px white style, consistent with the existing top-left HUD cluster.

**Update:** In `startLevel()` (which already runs at the start of every level, both the first and every subsequent one), after `self.level` is set, call `self.levelHudText.setText("Level " + string.str(self.level))`. `Text` already has a `setText(content)` method (`src/lib/Basic4WebGL/defs/text.bas`, backed by `sprites.js`'s `setText`) — no new engine work needed here, this is purely a `GameScene.bas` change.

## Files touched

- `demo-src/raycaster/GameScene.bas` — compass fix, damage flash fields/logic, level HUD text.
- `demo-src/raycaster/assets/damage_flash.png` — new asset (generated, solid red 8x8 PNG).
- `src/docs/demos/raycaster.md` — mention the damage flash and level HUD text in "How it works"; re-sync the `GameScene.bas` code fence.

## Verification

Same live-in-browser approach used throughout the endless-levels plan: import the compiled demo, drive frames via synthetic ticks, and this time **also verify visually** — read back actual WebGL pixel colors (not just "no console errors") to confirm the compass appears within the true visible canvas bounds, the damage flash fires and fades on taking damage, and the level text updates on a level transition. This is a direct correction to the gap that let the compass bug ship undetected in the original plan (visual state was never actually sampled, only console-error-freeness).
