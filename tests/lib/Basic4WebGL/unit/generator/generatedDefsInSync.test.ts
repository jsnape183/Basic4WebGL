import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test, expect } from 'vitest';
import { generateClass, generateModule } from '@Basic4WebGL/library/generator/index';
import { classDescriptors, moduleDescriptors } from '@Basic4WebGL/library/registry';

// Generated .bas files are checked in so the compiler can import them directly
// (`?raw`), but they must never be hand-edited — the descriptor is the source
// of truth. This test catches the drift that happens when someone edits a
// generated .bas file by hand instead of its descriptor: it fails the moment
// `npm run generate:library` output would stop matching what's checked in.
const DEFS_DIR = join(__dirname, '../../../../../src/lib/Basic4WebGL/defs');

describe('generated .bas defs match their descriptors', () => {
  for (const { descriptor, fileName } of classDescriptors) {
    const name = fileName ?? descriptor.name;
    test(`${name}.bas is in sync with ${descriptor.name}'s descriptor`, () => {
      const shipped = readFileSync(join(DEFS_DIR, `${name}.bas`), 'utf-8');
      expect(shipped).toBe(generateClass(descriptor));
    });
  }

  for (const descriptor of moduleDescriptors) {
    test(`${descriptor.name}.bas is in sync with its descriptor`, () => {
      const shipped = readFileSync(join(DEFS_DIR, `${descriptor.name}.bas`), 'utf-8');
      expect(shipped).toBe(generateModule(descriptor));
    });
  }
});
