import { describe, test, expect } from 'vitest';
import { devDemoRegistry } from '../../../../src/features/demos/devDemoRegistry';
import { demoRegistry } from '../../../../src/features/demos/demoRegistry';

describe('devDemoRegistry', () => {
  test('every dev demo has slug, file, name', () => {
    for (const d of devDemoRegistry) {
      expect(d.slug).toBeTruthy();
      expect(d.file).toBeTruthy();
      expect(d.name).toBeTruthy();
    }
  });

  test('dev slugs never collide with public demo slugs', () => {
    const publicSlugs = new Set(demoRegistry.map((d) => d.slug));
    for (const d of devDemoRegistry) {
      expect(publicSlugs.has(d.slug)).toBe(false);
    }
  });

  test('includes the Phase 1 map-load demo', () => {
    const p1 = devDemoRegistry.find((d) => d.slug === 'raycaster-p1-mapload');
    expect(p1?.file).toBe('RaycasterP1MapLoad');
  });
});
