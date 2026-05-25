// tests/monacoHelpers/monarchRules.test.ts
import { describe, it, expect } from 'vitest';
import { buildMonarchRules } from '../../src/monacoHelpers';
import { SOFTBASIC_KEYWORDS, SOFTBASIC_LIFECYCLE_EVENTS } from '../../src/lib/Basic4WebGL/keywords';

describe('buildMonarchRules', () => {
  it('includes all keywords from the keyword list', () => {
    const rules = buildMonarchRules();
    for (const kw of SOFTBASIC_KEYWORDS) {
      expect(rules.keywords).toContain(kw);
    }
  });

  it('includes all lifecycle events', () => {
    const rules = buildMonarchRules();
    for (const ev of SOFTBASIC_LIFECYCLE_EVENTS) {
      expect(rules.lifecycleEvents).toContain(ev);
    }
  });

  it('has a tokenizer with a root rule array', () => {
    const rules = buildMonarchRules();
    expect(Array.isArray(rules.tokenizer.root)).toBe(true);
    expect(rules.tokenizer.root.length).toBeGreaterThan(0);
  });
});
