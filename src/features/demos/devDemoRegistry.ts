import { DemoEntry } from './demoRegistry';

// Phase demos for the raycaster softBASIC library (spec
// docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §10). Deliberately
// NOT rendered on /demos (DemosPage only maps `demoRegistry`) and given no docs
// page. They exist so each library phase ships a runnable, Cypress-verified
// artifact.
export const devDemoRegistry: DemoEntry[] = [
  {
    // p1testmap.stm references a tileImage ('rc_placeholder_tiles.png', a copied
    // BulletHell tilesheet) because the .stm format requires one, but Phase 1
    // never renders it — MapProbeScene draws only `drawing` primitives.
    slug: 'raycaster-p1-mapload',
    name: 'Raycaster P1 — Map Load',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 1 probe: builds RcWorld from a tagged .stm and prints cell heights, flags and upper-region data. No rendering.',
    docsSlug: '',
    file: 'RaycasterP1MapLoad',
  },
  {
    slug: 'raycaster-p2-spancast',
    name: 'Raycaster P2 — Span Cast',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 2 probe: RcCast DDA-marches the grid and collects wall / floor-step / ceiling-step spans; top-down visualiser + probes.',
    docsSlug: '',
    file: 'RaycasterP2SpanCast',
  },
  {
    slug: 'raycaster-p3-roomview',
    name: 'Raycaster P3 — Room View',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 3 probe: the first real first-person view — a static camera in a small room, rendered with RcRender, plus projection-identity probes and a frame-time readout.',
    docsSlug: '',
    file: 'RaycasterP3RoomView',
  },
  {
    slug: 'raycaster-p4-walk',
    name: 'Raycaster P4 — Walk',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 4 probe: RcMover walks the room — circle-vs-wall collision, step-up, gravity, jump — with the camera bound to the mover.',
    docsSlug: '',
    file: 'RaycasterP4Walk',
  },
  {
    slug: 'raycaster-p5-lit',
    name: 'Raycaster P5 — Lit Room',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 5 probe: RcLights — ambient + baked static + a player-following flashlight, wall-occluded via LOS. Dark room with a moving shadow.',
    docsSlug: '',
    file: 'RaycasterP5Lit',
  },
  {
    slug: 'raycaster-p6-actors',
    name: 'Raycaster P6 — Actors',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 6/6b probe: RcActors billboards depth-clipped per column against the wall buffer (the NPC behind the wall stub stays hidden) + los/hitscan/near; RcRender now also fills floor/ceiling horizontal surfaces (a pit you see into, a staircase up to the ledge) so the ledge NPC stands on solid ground.',
    docsSlug: '',
    file: 'RaycasterP6Actors',
  },
  {
    slug: 'raycaster-p7-diagonals',
    name: 'Raycaster P7 — Diagonal Tiles',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 7 probe: corner-solid 45° diagonal-wall tiles — RcWorld parses diag: markers, RcCast ray-tests the chord in cast/los, RcMover slides along the 45° face. Octagonal room + a canted dead-end passage.',
    docsSlug: '',
    file: 'RaycasterP7Diagonals',
  },
  {
    slug: 'raycaster-p8-tiers',
    name: 'Raycaster P8 — Multi-Tier Level',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 8 probe: multi-tier level design with pure floor:/ceil: height variation — a sunken arena, a west staircase up to a raised north walkway and a higher NE nook. Wall textures, per-tile fcol:/ccol: colour, WASD + RF camera look.',
    docsSlug: '',
    file: 'RaycasterP8Tiers',
  },
  {
    slug: 'raycaster-p9-bench',
    name: 'Raycaster P9 — Frame-Cost Bench',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 9 benchmark: a generated stress scene (all Phase 8 features + idle billboard enemies, 16/32/48 cells) with an on-screen frame-time + primitive-count readout and a fixed-path autopilot.',
    docsSlug: '',
    file: 'RaycasterP9Bench',
  },
  {
    slug: 'raycaster-p10-finale',
    name: 'Raycaster Finale — Full Showcase',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Capstone showcase: a 32x32 grid of six rooms joined by corridors, a single wall texture, a staircase up to a raised dais in the Torch Hall, low ambient light with a player-carried torch, and full keyboard + controller input (WASD/left stick move, arrows/right-stick look on both axes, Space/A to jump). No new engine features -- everything already ships in the library.',
    docsSlug: '',
    file: 'RaycasterP10Finale',
  },
  {
    slug: 'raycaster-lightpool-poc',
    name: 'Raycaster — Light-Pool POC',
    tags: ['Raycaster', 'POC'],
    description:
      'Rough, throwaway POC validating a screen-space radial-gradient "light pool" overlay for floor/ceiling static lighting -- two rooms and a corridor, testing whether a static light now reads as a round pool instead of the rectangular shaft the per-column-strip approach produced. Not production code.',
    docsSlug: '',
    file: 'RaycasterLightpoolPoc',
  },
  {
    slug: 'survival-slice',
    name: 'Survival Slice',
    tags: ['Raycaster', 'Survival Horror', 'WIP'],
    description:
      'Survival-horror vertical slice, built phase by phase (spec docs/superpowers/specs/2026-09-07-survival-horror-slice-design.md). Phase 1: three connected raycaster scenes — Old Platform, Disused Tunnel, Concourse Stairwell — joined by interact-to-use doorways; entry points and doorways authored as .stm markers, target entry carried across scenemanager.switch via a shared GameState.',
    docsSlug: '',
    file: 'SurvivalSlice',
  },
];
