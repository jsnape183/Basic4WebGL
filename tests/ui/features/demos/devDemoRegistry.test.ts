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

  test('includes the Phase 2 span-cast demo', () => {
    const p2 = devDemoRegistry.find((d) => d.slug === 'raycaster-p2-spancast');
    expect(p2?.file).toBe('RaycasterP2SpanCast');
  });

  test('includes the Phase 3 room-view demo', () => {
    const p3 = devDemoRegistry.find((d) => d.slug === 'raycaster-p3-roomview');
    expect(p3?.file).toBe('RaycasterP3RoomView');
  });

  test('includes the Phase 4 walk demo', () => {
    const p4 = devDemoRegistry.find((d) => d.slug === 'raycaster-p4-walk');
    expect(p4?.file).toBe('RaycasterP4Walk');
  });

  test('includes the Phase 5 lit-room demo', () => {
    const p5 = devDemoRegistry.find((d) => d.slug === 'raycaster-p5-lit');
    expect(p5?.file).toBe('RaycasterP5Lit');
  });

  test('includes the Phase 6 actors demo', () => {
    const p6 = devDemoRegistry.find((d) => d.slug === 'raycaster-p6-actors');
    expect(p6?.file).toBe('RaycasterP6Actors');
  });

  test('includes the Phase 7 diagonal-tiles demo', () => {
    const p7 = devDemoRegistry.find((d) => d.slug === 'raycaster-p7-diagonals');
    expect(p7?.file).toBe('RaycasterP7Diagonals');
  });
});
