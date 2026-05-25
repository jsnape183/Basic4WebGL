import { describe, it, expect } from 'vitest';
import { SOFTBASIC_KEYWORDS, SOFTBASIC_LIFECYCLE_EVENTS } from '@Basic4WebGL/keywords';

describe('SOFTBASIC_KEYWORDS', () => {
  it('contains control flow keywords', () => {
    for (const kw of ['function', 'endfunction', 'if', 'endif', 'while', 'endwhile', 'for', 'next', 'to', 'in', 'do', 'until']) {
      expect(SOFTBASIC_KEYWORDS).toContain(kw);
    }
  });

  it('contains declaration keywords', () => {
    for (const kw of ['dim', 'class', 'as', 'constructor', 'endconstructor', 'endclass']) {
      expect(SOFTBASIC_KEYWORDS).toContain(kw);
    }
  });

  it('contains operator and literal keywords', () => {
    for (const kw of ['and', 'or', 'not', 'return', 'true', 'false', 'print', 'call']) {
      expect(SOFTBASIC_KEYWORDS).toContain(kw);
    }
  });

  it('has no duplicates', () => {
    expect(SOFTBASIC_KEYWORDS.length).toBe(new Set(SOFTBASIC_KEYWORDS).size);
  });
});

describe('SOFTBASIC_LIFECYCLE_EVENTS', () => {
  it('contains lifecycle hook names', () => {
    for (const e of ['onenter', 'onupdate', 'onkeydown', 'onkeyup', 'onpointerdown', 'onpointermove']) {
      expect(SOFTBASIC_LIFECYCLE_EVENTS).toContain(e);
    }
  });

  it('has no duplicates', () => {
    expect(SOFTBASIC_LIFECYCLE_EVENTS.length).toBe(new Set(SOFTBASIC_LIFECYCLE_EVENTS).size);
  });
});
