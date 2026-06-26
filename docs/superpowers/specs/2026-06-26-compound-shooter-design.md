# COMPOUND — Top-Down Shooter Demo Design

## Goal

A polished, multi-file softBASIC demo: a military top-down shooter on a scrolling tilemap. Showcases scenes, class inheritance, camera following, tilemap collision, and multi-file composition. Ships as the second entry on the `/demos` page.

## Prerequisites

These must be completed before the demo itself is implemented:

1. **Scene system** (tasks 111–115) — `scene.js` engine module, bootstrapper wiring, package registration, and docs. The demo depends on `scenemanager.switch()` and scene lifecycle (`onEnter`, `onExit`, `update`).
2. **`camera.shake(intensity, duration)`** — new method in `camera.bas` and `camera.js`. Triggered when the player takes damage.

---

## Architecture

9 softBASIC files in a multi-file project named **"COMPOUND"**.

```
Main.bas           — entry point, registers all 3 scenes, switches to "title"
GameState.bas      — shared module-level globals: finalScore, highScore
TitleScene.bas     — title card screen (scene class)
GameScene.bas      — gameplay: tilemap, spawning, wave logic, score (scene class)
GameOverScene.bas  — score display, high score, restart (scene class)
Player.bas         — player class: movement, aiming, shooting, health
Enemy.bas          — base enemy class: sprite, HP, hit flash, destroy
Grunt.bas          — extends Enemy: charge AI, melee damage
Sniper.bas         — extends Enemy: standoff AI, fires enemy bullets
Bullet.bas         — shared bullet class: movement, wall + target collision
```

### File responsibilities

**`GameState.bas`**
Module-level globals only: `dim finalScore = 0` and `dim highScore = 0`. Because all files in a multi-file project are compiled together, these are accessible from any other file. GameScene writes `finalScore` before switching to game-over; GameOverScene reads it and updates `highScore`.

**`Main.bas`**
Registers TitleScene, GameScene, GameOverScene with `scenemanager`. Calls `scenemanager.switch("title")` to start. No game logic.

**`TitleScene.bas`**
Displays "COMPOUND" title, subtitle "A SOFTBASIC DEMO", and WASD/mouse/click controls hint. Listens for any key press → `scenemanager.switch("game")`.

**`GameScene.bas`**
- Creates tilemap (40×30 tiles, 20×20px each = 800×600 world)
- Sets world background to concrete floor colour (`#2a2a1e`)
- Sets `camera.setBounds(800, 600)`, `camera.follow(player, 5)`
- Scans map for tile ID 2 (spawn markers) at `onEnter` to build spawn point list
- Creates Player; manages arrays of Grunt, Sniper, Bullet instances
- HUD: health bar (drawing.drawRect), score text, wave text — all via `hud.add()`
- Wave logic: spawn wave on start; when enemy count = 0, show "WAVE N INCOMING" overlay for 3s then spawn next wave
- Writes score to `finalScore` (from GameState.bas) before switching scene
- On player death → `scenemanager.switch("gameover")`

**`GameOverScene.bas`**
- Reads `finalScore` from GameState.bas
- Tracks `_highScore` (module-level, persists for session)
- Displays "MISSION FAILED", score, best score, "PRESS R TO RETRY"
- R key → `scenemanager.switch("game")`

**`Player.bas`**
- `animatedsprite` using `player.png` (static, single frame — no animation frames needed)
- WASD movement at 150px/s; wall collision via `tilemap.tileAt(x, y) == 1`
- Mouse aim: `setAngle(math.atan2(worldMouseY - y, worldMouseX - x))`
  - World mouse coords: `input.mouseX() + camera.x()`, `input.mouseY() + camera.y()`
- Left click or Space → create Bullet (owner = "player")
- 100 HP; 0.5s invincibility (flicker) after hit; `camera.shake(6, 0.3)` on damage
- `takeDamage(amount)` method — called by Bullet

**`Enemy.bas`** (base class)
- Properties: `self.hp`, `self.sprite` (animatedsprite), `self.flashTimer`
- `hit(damage)` — reduces HP, triggers white flash for 0.1s; if HP ≤ 0 calls `self.destroy()`
- `destroy()` — hides sprite, sets `self.dead = true` (GameScene filters dead enemies each frame)
- `update(dt)` — override in subclasses
- Wall collision helper shared with Player logic

**`Grunt.bas`** (extends Enemy)
- 2 HP, worth 100 points
- Charges toward player at 80px/s
- Rotates sprite to face player each frame
- On `collision.spriteCollide(self.sprite, player.sprite)` → `player.takeDamage(10)` (max once per 0.5s cooldown)

**`Sniper.bas`** (extends Enemy)
- 3 HP, worth 250 points
- Preferred range: 200px. If closer than 150px, moves away; if farther than 250px, moves toward
- Fires enemy Bullet every 2s toward player's current position
- Rotates to face player

**`Bullet.bas`**
- `sprite.png` (player) or `enemy_bullet.png` (enemy) depending on `owner` arg
- Travels at 300px/s in direction set at creation
- Each frame: check `tilemap.tileAt(x, y) != 0` → destroy
- Player bullets: check `collision.spriteCollide(self.sprite, enemy.sprite)` for each enemy → `enemy.hit(1)`
- Enemy bullets: check `collision.spriteCollide(self.sprite, player.sprite)` → `player.takeDamage(15)`
- Max lifetime: 3s (auto-destroy)

---

## Tilemap

**Format:** Simple 2D JSON array. Each value is a tile ID:
- `0` = floor (not rendered; world background colour shows through)
- `1` = wall (rendered using tileset.png frame 0)
- `2` = spawn point (out of tileset range = not rendered; read by GameScene on start)

**Tileset:** `tileset.png` — 20×20px single tile image (the wall tile).

**Map size:** 40 columns × 30 rows = 800×600px world. Hand-authored JSON with a border of walls, internal room dividers, corridors, and ~12 spawn points distributed around the map.

**Wall collision:** `tilemap.tileAt(worldX, worldY)` returns the tile ID at that world position. Any non-zero value = solid. Check is done on the entity's centre point (and optionally 4 corners for robust collision).

---

## Wave System

Wave N spawns `3 + N × 2` enemies total. Distribution:
- Waves 1–2: all grunts
- Wave 3+: `math.floor(N / 3)` snipers, remainder grunts (capped at 40% snipers)

Spawn positions chosen randomly from the spawn point list. Enemies never spawn within 200px of the player's current position.

Between waves: 3-second "— WAVE N INCOMING —" text overlay on the HUD, then spawn.

---

## Score & High Score

- Grunt killed: +100 points
- Sniper killed: +250 points
- Score accumulates until player death
- High score = best score in current browser session (in-memory `dim _highScore`)
- Displayed on game-over screen; carried across retries without page reload

---

## HUD Layout

All HUD elements added to `hud` layer (renders above world). Positioned in screen space.

- **Top-left:** "HP" label + health bar drawn with `drawing.drawRect` (green fill, dark background)
- **Top-right:** Wave number ("WAVE 3") and score ("12,400") as `text` objects
- **Centre (transient):** Wave incoming text — visible for 3s between waves, then hidden

---

## Screens

### Title screen (TitleScene)
- World background: dark green-black
- Centre: "COMPOUND" in large military green mono font
- Below: "A SOFTBASIC DEMO" in small muted text
- Controls hint: "WASD MOVE · MOUSE AIM · CLICK FIRE"
- Bottom: "PRESS ANY KEY TO START" (blinking via alpha)
- Any `getKeyDown` → switch to "game"

### Game over screen (GameOverScene)
- Black background
- "MISSION FAILED" in red
- Score and best score
- "PRESS R TO RETRY"
- R key → switch to "game" (resets all state via GameScene.onEnter)

---

## Assets Required (user-provided)

| File | Size | Description |
|---|---|---|
| `tileset.png` | 20×20px | Wall tile — concrete/sandbag, khaki/brown military palette |
| `player.png` | 24×24px | Top-down soldier, facing right, green military |
| `grunt.png` | 24×24px | Top-down enemy grunt, facing right, dark brown uniform |
| `sniper.png` | 24×24px | Top-down sniper, facing right, camo, longer rifle |
| `bullet.png` | 12×4px | Player bullet, yellow/white |
| `enemy_bullet.png` | 12×4px | Enemy bullet, red/orange |

`map.json` is authored during implementation (not a user asset).

---

## Demos Page Integration

- Registered in `src/features/demos/demoRegistry.ts`
- Tags: `["Top-down", "Tilemap", "Scenes", "Inheritance"]`
- Docs entry: `Tutorials → Demos → COMPOUND` in `src/docs/manifest.ts`
- Tutorial page: `src/docs/demos/compound.md` (written as part of demo implementation)
