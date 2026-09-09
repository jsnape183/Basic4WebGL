import { describe, test } from 'vitest';

// Retired one-off probe (isolated the finale's light sources — confirmed the
// lit rooms come from `light:` markers, not `floor:`/`fcol:`/`ftex:` tags).
// Kept inert; the real guard is raycasterFlatFillHeightVariation.test.ts.
describe.skip('finale light-source probe (retired)', () => {
  test('noop', () => {});
});
