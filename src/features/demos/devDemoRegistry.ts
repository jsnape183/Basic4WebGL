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
];
