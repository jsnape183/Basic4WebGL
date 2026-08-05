import { ProjectExportJson } from '../projects/exportProject';
import raycasterJson from '../../docs/demos/Raycaster.b4wgl.json';
import coinsPlatformerJson from '../../docs/demos/CoinsPlatformer.b4wgl.json';

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

**Spacebar** fires — hit detection checks if the centre ray is within 15 columns of the enemy's projected screen position and that the z-buffer confirms it's visible. The HUD weapon, health counter, and game-over screen are rendered via \`hud.add()\` so they always sit above the world layer.

**Key techniques:** DDA raycasting, perpendicular wall distance (no fisheye), texture column sampling via \`drawing.drawImageStrip\`, camera-plane billboard projection, separate x/y wall-sliding collision.

**Assets required:** \`wall.png\`, \`enemy.png\`, \`enemy_hit.png\`, \`enemy_dead.png\`, \`gun.png\` — **Controls:** WASD to move, Space to fire`,
    docsSlug: 'raycaster',
    json: raycasterJson as ProjectExportJson,
  },
  {
    slug: 'coins-platformer',
    name: 'Collect the Coins: A Platformer',
    tags: ['Scenes', 'Tilemap', 'Collision', 'Save/Load'],
    description: `A three-level scrolling platformer showing off scene switching, tilemap levels, and persistent save data.

Each level is its own scene, built from a tilemap loaded with \`tilemap.load()\`. The player is an **animated sprite** with idle/run/jump/land animations, hand-rolled ground and wall collision sampled from the tilemap, and simple physics (gravity, jump velocity). Patrolling enemies reset the player to the level start on contact, and a **deadzone** catches missed jumps over gaps.

Since softBASIC's \`Extends\` only supports single-level inheritance, the logic shared by all three levels lives in \`LevelHelpers.bas\` — a plain module, not a base class — called as \`levelhelpers.someFunction(...)\` from each scene.

Reaching the end of a level switches to the next via \`scenemanager.switch(...)\`; a single shared \`GameData\` object carries the running coin count across every scene. On winning, the final score is inserted into a small leaderboard and persisted with \`save.set(...)\`, so it survives a page reload.

**Key techniques:** multi-scene games via \`scenemanager\`, point-sampled tilemap collision (\`tileAt\`), \`animatedsprite\` animation states, persistent save data via \`save\`, sharing logic across scenes via a helper module.

**Assets required:** \`player.png\`, \`enemy.png\`, \`coin.png\`, \`tilemap_trimmed.png\`, \`level1.json\`, \`level2.json\`, \`level3.json\` — **Controls:** Arrow keys/WASD to move, Space to jump`,
    docsSlug: 'coins-platformer',
    json: coinsPlatformerJson as ProjectExportJson,
  },
];
