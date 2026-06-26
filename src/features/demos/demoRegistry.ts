import { ProjectExportJson } from '../projects/exportProject';
import raycasterJson from '../../docs/demos/raycaster.b4wgl.json';

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
];
