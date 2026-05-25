// tests/monacoHelpers/signatures.test.ts
import { describe, it, expect } from 'vitest';
import { parseCallContext } from '../../src/monacoHelpers/signatures';

describe('parseCallContext', () => {
  it('identifies a module.method call with no args yet', () => {
    // "stage.add(" — cursor just after the opening paren
    const result = parseCallContext('stage.add(');
    expect(result).toEqual({ moduleName: 'stage', methodName: 'add', activeParameter: 0 });
  });

  it('identifies a module.method call with one arg', () => {
    // "math.atan2(dy, " — cursor after the comma, second param active
    const result = parseCallContext('math.atan2(dy, ');
    expect(result).toEqual({ moduleName: 'math', methodName: 'atan2', activeParameter: 1 });
  });

  it('identifies a module.method call with three args', () => {
    // "pen.setFillColor(255, 128, " — third param active
    const result = parseCallContext('pen.setFillColor(255, 128, ');
    expect(result).toEqual({ moduleName: 'pen', methodName: 'setfillcolor', activeParameter: 2 });
  });

  it('identifies a bare class constructor', () => {
    // "dim x as Sprite(" — no module, methodName = "sprite" (lowercased)
    const result = parseCallContext('dim x as Sprite(');
    expect(result).toEqual({ moduleName: undefined, methodName: 'sprite', activeParameter: 0 });
  });

  it('handles nested parens by tracking only the innermost call', () => {
    // "stage.add(bunny.getX(" — cursor is INSIDE bunny.getX(, so result should be bunny.getX
    const result = parseCallContext('stage.add(bunny.getX(');
    expect(result).toEqual({ moduleName: 'bunny', methodName: 'getx', activeParameter: 0 });
  });

  it('returns null when there is no open paren', () => {
    expect(parseCallContext('stage.add')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseCallContext('')).toBeNull();
  });

  it('returns null when paren is closed before cursor', () => {
    // "stage.add(bunny)" — all parens balanced; no active call
    expect(parseCallContext('stage.add(bunny)')).toBeNull();
  });

  it('lowercases module and method names', () => {
    const result = parseCallContext('Math.Sin(');
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin', activeParameter: 0 });
  });
});
