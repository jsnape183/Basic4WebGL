import { describe, test, expect } from 'vitest';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';
import { packageModules } from '../../../src/constants/packageModules';

describe('packageModules — every declared module name resolves to real source', () => {
  test('no package moduleNames entry is missing from packageModules', () => {
    const missing: string[] = [];
    for (const pkg of firstPartyPackages) {
      for (const name of pkg.moduleNames) {
        if (!packageModules[name]) {
          missing.push(`${pkg.id}: ${name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
