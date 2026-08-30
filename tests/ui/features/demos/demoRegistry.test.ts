import { describe, test, expect } from 'vitest';
import { demoRegistry, loadDemoJson } from '../../../../src/features/demos/demoRegistry';

describe('demoRegistry', () => {
  test('entries carry metadata but not inline json', () => {
    expect(demoRegistry.length).toBeGreaterThan(0);
    for (const d of demoRegistry) {
      expect(d).toHaveProperty('slug');
      expect(d).toHaveProperty('name');
      expect(d).not.toHaveProperty('json');
    }
  });

  test('loadDemoJson dynamically loads a demo export by slug', async () => {
    const json = await loadDemoJson('raycaster');
    expect(json.version).toBe(1);
    expect(Array.isArray(json.assets)).toBe(true);
  });
});
