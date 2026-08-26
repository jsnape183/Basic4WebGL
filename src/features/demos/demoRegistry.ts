import { ProjectExportJson } from '../projects/exportProject';
import raycasterJson from '../../docs/demos/Raycaster.b4wgl.json';
import coinsPlatformerJson from '../../docs/demos/CoinsPlatformer.b4wgl.json';
import bulletHellShooterJson from '../../docs/demos/BulletHellShooter.b4wgl.json';
import dungeonExplorerJson from '../../docs/demos/DungeonExplorer.b4wgl.json';

export interface DemoEntry {
  slug: string;
  name: string;
  tags: string[];
  description: string;
  docsSlug: string;
  json: ProjectExportJson;
}

export const demoRegistry: DemoEntry[] = [
  {
    slug: 'raycaster',
    name: 'Wolfenstein-Style Raycaster',
    tags: ['Raycasting', 'DDA', 'Sprites', 'Z-buffer'],
    description: `A single-file demo that renders a textured 3D maze using DDA raycasting.

Casts 200 rays per frame, drawing textured wall strips scaled by distance to create a 3D perspective. A **z-buffer** tracks wall distances so a billboard enemy sprite is correctly occluded by walls. One enemy chases the player, deals melee damage on contact, and dies after 10 hits.

**Spacebar** fires — hit detection checks if the centre ray is within 15 columns of the enemy's projected screen position and that the z-buffer confirms it's visible. The HUD weapon, health counter, game-over screen, and every particle emitter are rendered via \`hud.add()\` so they always sit above the world layer, which this demo redraws from scratch every frame.

Firing, landing a hit, and killing the enemy each burst an \`Emitter\` — a particle muzzle flash replacing the old \`drawing.drawCircle\` flash, plus a hit spark and a death burst, positioned using the same projected screen coordinates the enemy billboard itself already computes.

**Key techniques:** DDA raycasting, perpendicular wall distance (no fisheye), texture column sampling via \`drawing.drawImageStrip\`, camera-plane billboard projection, separate x/y wall-sliding collision, particle effects via a shared \`Emitter\` module added to \`hud\` instead of \`world\`.

**Assets required:** \`wall.png\`, \`enemy.png\`, \`enemy_hit.png\`, \`enemy_dead.png\`, \`gun.png\`, \`particle.png\` — **Controls:** WASD to move, Space to fire`,
    docsSlug: 'raycaster',
    json: raycasterJson as ProjectExportJson,
  },
  {
    slug: 'coins-platformer',
    name: 'Collect the Coins: A Platformer',
    tags: ['Scenes', 'Tilemap', 'Kinematic Movement', 'Collision', 'Save/Load'],
    description: `A three-level scrolling platformer showing off scene switching, tilemap levels, and persistent save data.

Each level is its own scene, built from a tilemap loaded with \`tilemap.load()\`. The player is an **animated sprite** with idle/run/jump/land animations, using the engine's built-in kinematics — \`setVelocity()\` plus a tilemap collision layer — for ground and wall collision, with simple physics (gravity, jump velocity) layered on top via \`isBlockedDown()\`/\`isBlockedUp()\`. Patrolling enemies reset the player to the level start on contact, and a **deadzone** catches missed jumps over gaps.

Since softBASIC's \`Extends\` only supports single-level inheritance, the logic shared by all three levels lives in \`LevelHelpers.bas\` — a plain module, not a base class — called as \`levelhelpers.someFunction(...)\` from each scene.

Reaching the end of a level switches to the next via \`scenemanager.switch(...)\`; a single shared \`GameData\` object carries the running coin count across every scene. On winning, the final score is inserted into a small leaderboard and persisted with \`save.set(...)\`, so it survives a page reload.

**Key techniques:** multi-scene games via \`scenemanager\`, \`setVelocity\`/\`isBlockedDown\` kinematic tilemap collision, \`animatedsprite\` animation states, persistent save data via \`save\`, sharing logic across scenes via a helper module, particle effects via a shared \`Emitter\` module.

**Assets required:** \`player.png\`, \`enemy.png\`, \`coin.png\`, \`tilemap_trimmed.png\`, \`particle.png\`, \`level1.json\`, \`level2.json\`, \`level3.json\` — **Controls:** Arrow keys/WASD to move, Space to jump`,
    docsSlug: 'coins-platformer',
    json: coinsPlatformerJson as ProjectExportJson,
  },
  {
    slug: 'bullet-hell-shooter',
    name: 'Bullet-Hell Shooter',
    tags: ['Scenes', 'Pathfinding', 'Tilemap Markers', 'Kinematic Movement', 'Collision'],
    description: `A three-level top-down shooter: destroy every spawn point in a level as fast as you can, before its mobs overwhelm you.

The player moves with \`setVelocity\`, sliding cleanly to a stop against walls instead of passing through them — the engine handles collision automatically once \`collision.setupTileCollision\` is called on the level's tilemap, using a dedicated collision layer painted in the Tilemap Editor. Mobs are **pathfinding-driven** — they route around the same walls to chase the player instead of moving in a straight line. Spawn points and weapon pickups are placed visually in the Tilemap Editor using **tagged markers**, queried at runtime with \`tileMapSet.markersByTag(tag)\`, instead of being hardcoded in the level's \`.bas\` file.

The player aims with the mouse, fires with the left click or spacebar, and can pick up one of three weapons (pistol, shotgun, SMG) with different fire rates and spread patterns. Each level's clear time is tracked, and a completed run's total time is compared against a **personal best**, persisted with \`save.set(...)\` so it survives a page reload.

**Key techniques:** \`sprite.setVelocity\` + \`collision.setupTileCollision\` for automatic kinematic tile collision, \`pathfinding.navigateTo\` for obstacle-avoiding enemy movement, \`tileMapSet.markersByTag\` for visually-authored spawn/pickup placement, per-weapon \`Bullet\` parameterization, HUD built from \`sprite\`/\`text\` instances added via \`hud.add()\` (not \`drawing\`, which draws into camera-relative world space).

**Assets required:** \`player.png\`, \`mob.png\`, \`spawnpoint.png\`, \`spawnpoint_destroyed.png\`, \`pickup.png\`, \`bullet.png\`, a tileset image, three tilemaps — **Controls:** WASD to move, mouse to aim, left click or Space to fire`,
    docsSlug: 'bullet-hell-shooter',
    json: bulletHellShooterJson as ProjectExportJson,
  },
  {
    slug: 'dungeon-explorer',
    name: 'Dungeon Explorer',
    tags: ['Scenes', 'Kinematic Movement', 'Runtime Collision', 'Tilemap Markers', 'Pathfinding', 'Keyframe Animation'],
    description: `A room-by-room dungeon crawl: fight through two branches of enemies, find the key, and defeat the boss guarding the treasure room.

The whole dungeon is one tilemap, but the camera treats it as discrete rooms — walking off one room's edge hard-cuts the view to the next, classic-adventure-game style, instead of scrolling continuously. The boss room's door is a real \`collision\` tile, solid until \`collision.setTileSolid(x, y, false)\` opens it once the player has the key — the tilemap's collision layer is only the *starting* state, not a fixed layout.

The player moves with \`setVelocity\` (sliding cleanly along walls, automatic tile collision, no hand-rolled checks) and attacks with a short-range melee swing in whichever direction they last moved — a \`tween\`-driven 360° spin plus a separate sword sprite swinging out through its own keyframed arc. Enemies patrol until the player gets close, then chase via \`pathfinding.navigateTo\`; the boss skips patrolling entirely and adds a periodic speed-boosted lunge on top of its full-time chase. Losing all 3 hearts ends the run; defeating the boss wins it. Combat and pickups get particle feedback via a shared \`Emitter\` module — hit sparks, enemy/boss death bursts, and a key pickup sparkle.

**Key techniques:** \`tween.play\`/\`isPlaying\` + \`Keyframe\` for the spin-and-swing melee attack, \`collision.setTileSolid\`/\`isTileSolid\` for a runtime-unlockable door, \`camera.setPosition\` for discrete room-snap transitions instead of continuous scrolling, \`sprite.setVelocity\` + \`collision.setupTileCollision\` for kinematic movement, \`tileMapSet.markersByTag\` for visually-placed enemies/key/boss, \`pathfinding.navigateTo\` for chase AI, particle effects via a shared \`Emitter\` module.

**Assets required:** \`player.png\`, \`enemy.png\`, \`boss.png\`, \`key.png\`, \`sword.png\`, \`heart_full.png\`, \`heart_empty.png\`, a tileset image, one tilemap, \`particle.png\` — **Controls:** WASD to move, J to attack`,
    docsSlug: 'dungeon-explorer',
    json: dungeonExplorerJson as ProjectExportJson,
  },
];
