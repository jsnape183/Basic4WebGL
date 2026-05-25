// tests/monacoHelpers/completions.test.ts
import { describe, it, expect } from 'vitest';
import { parseCompletionModule } from '../../src/monacoHelpers/completions';

describe('parseCompletionModule', () => {
  it('extracts module name from "math."', () => {
    expect(parseCompletionModule('math.')).toBe('math');
  });

  it('extracts module name from mid-line text', () => {
    expect(parseCompletionModule('dim x = math.')).toBe('math');
  });

  it('extracts module name from "stage."', () => {
    expect(parseCompletionModule('stage.')).toBe('stage');
  });

  it('lowercases the module name', () => {
    expect(parseCompletionModule('Math.')).toBe('math');
    expect(parseCompletionModule('STAGE.')).toBe('stage');
  });

  it('returns null when there is no dot', () => {
    expect(parseCompletionModule('math')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseCompletionModule('')).toBeNull();
  });

  it('returns null when dot is not at the end', () => {
    // "math.sin" — dot is in the middle, cursor is after "sin" not after "."
    expect(parseCompletionModule('math.sin')).toBeNull();
  });
});
