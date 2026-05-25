// tests/monacoHelpers/hover.test.ts
import { describe, it, expect } from 'vitest';
import { parseHoverContext } from '../../src/monacoHelpers/hover';

// Monaco word ranges use 1-based columns.
// startColumn is the column of the first character of the word.

describe('parseHoverContext', () => {
  it('identifies module.method when cursor is over the method', () => {
    // "stage.add(bunny)" — "add" starts at column 7 (1-based)
    const word = { word: 'add', startColumn: 7 };
    const result = parseHoverContext('stage.add(bunny)', word);
    expect(result).toEqual({ moduleName: 'stage', methodName: 'add' });
  });

  it('identifies module.method mid-line', () => {
    // "    result = math.sin(x)" — "sin" starts at column 19
    const line = '    result = math.sin(x)';
    const word = { word: 'sin', startColumn: 19 };
    const result = parseHoverContext(line, word);
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin' });
  });

  it('lowercases both module and method names', () => {
    const word = { word: 'Sin', startColumn: 6 };
    const result = parseHoverContext('math.Sin(x)', word);
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin' });
  });

  it('returns null when char before word is not a dot', () => {
    // Hovering over a plain variable name
    const word = { word: 'bunny', startColumn: 5 };
    expect(parseHoverContext('dim bunny', word)).toBeNull();
  });

  it('returns null when word is at column 1 (nothing before it)', () => {
    const word = { word: 'stage', startColumn: 1 };
    expect(parseHoverContext('stage', word)).toBeNull();
  });

  it('returns null when dot is at the very start (no module before it)', () => {
    // ".add(x)" — dot is at column 1, word "add" starts at column 2
    const word = { word: 'add', startColumn: 2 };
    expect(parseHoverContext('.add(x)', word)).toBeNull();
  });
});
