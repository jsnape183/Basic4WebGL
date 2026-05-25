// tests/monacoHelpers/catalogue.test.ts
import { describe, it, expect } from 'vitest';
import {
  CATALOGUE,
  getModuleMethods,
  getModuleMethod,
  getConstructor,
  isKnownModule,
} from '../../src/monacoHelpers/catalogue';

describe('CATALOGUE', () => {
  it('contains all expected modules', () => {
    for (const name of ['sprite', 'text', 'gfx', 'drawing', 'stage', 'pen', 'assetmanager', 'math', 'string', 'array']) {
      expect(name in CATALOGUE).toBe(true);
    }
  });

  it('sprite is a class with a constructor', () => {
    expect(CATALOGUE['sprite'].kind).toBe('class');
    expect(CATALOGUE['sprite'].constructorEntry).toBeDefined();
    expect(CATALOGUE['sprite'].constructorEntry!.params).toContain('imagePath');
  });

  it('math is a module with no constructor', () => {
    expect(CATALOGUE['math'].kind).toBe('module');
    expect(CATALOGUE['math'].constructorEntry).toBeUndefined();
  });
});

describe('getModuleMethods', () => {
  it('returns methods for sprite', () => {
    const names = getModuleMethods('sprite').map(m => m.name);
    expect(names).toContain('setPosition');
    expect(names).toContain('getX');
    expect(names).toContain('setAlpha');
  });

  it('returns methods for math', () => {
    const names = getModuleMethods('math').map(m => m.name);
    expect(names).toContain('sin');
    expect(names).toContain('atan2');
    expect(names).toContain('floor');
  });

  it('returns methods for string', () => {
    const names = getModuleMethods('string').map(m => m.name);
    expect(names).toContain('len');
    expect(names).toContain('split');
  });

  it('returns empty array for unknown module', () => {
    expect(getModuleMethods('unknown')).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(getModuleMethods('MATH').length).toBeGreaterThan(0);
  });
});

describe('getModuleMethod', () => {
  it('finds a known method with its params and description', () => {
    const m = getModuleMethod('math', 'sin');
    expect(m).toBeDefined();
    expect(m!.params).toEqual(['n']);
    expect(m!.description.length).toBeGreaterThan(0);
    expect(m!.hasReturn).toBe(true);
  });

  it('finds a stage method', () => {
    const m = getModuleMethod('stage', 'add');
    expect(m).toBeDefined();
    expect(m!.params).toEqual(['obj']);
  });

  it('returns undefined for unknown method', () => {
    expect(getModuleMethod('math', 'unknownfn')).toBeUndefined();
  });

  it('is case-insensitive on method name', () => {
    expect(getModuleMethod('math', 'SIN')).toBeDefined();
  });
});

describe('getConstructor', () => {
  it('returns constructor for sprite', () => {
    const ctor = getConstructor('sprite');
    expect(ctor).toBeDefined();
    expect(ctor!.params).toContain('imagePath');
    expect(ctor!.description.length).toBeGreaterThan(0);
  });

  it('returns constructor for text', () => {
    const ctor = getConstructor('text');
    expect(ctor).toBeDefined();
    expect(ctor!.params).toEqual(['content', 'x', 'y']);
  });

  it('returns undefined for modules (not classes)', () => {
    expect(getConstructor('math')).toBeUndefined();
    expect(getConstructor('stage')).toBeUndefined();
  });
});

describe('isKnownModule', () => {
  it('returns true for known modules', () => {
    expect(isKnownModule('sprite')).toBe(true);
    expect(isKnownModule('math')).toBe(true);
  });

  it('returns false for unknown names', () => {
    expect(isKnownModule('xyz')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isKnownModule('SPRITE')).toBe(true);
  });
});
