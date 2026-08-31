import { DemoEntry } from './demoRegistry';

// Phase demos for the raycaster softBASIC library (spec
// docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §10). Deliberately
// NOT rendered on /demos (DemosPage only maps `demoRegistry`) and given no docs
// page. They exist so each library phase ships a runnable, Cypress-verified
// artifact.
export const devDemoRegistry: DemoEntry[] = [
  {
    slug: 'raycaster-p1-mapload',
    name: 'Raycaster P1 — Map Load',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 1 probe: builds RcWorld from a tagged .stm and prints cell heights, flags and upper-region data. No rendering.',
    docsSlug: '',
    file: 'RaycasterP1MapLoad',
  },
];
