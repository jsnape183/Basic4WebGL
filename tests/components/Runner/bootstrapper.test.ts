import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// The runtime helpers live inline in bootstrapper.html's first <script>
// block (no separate JS module exists for them — see _sbDictGet/_createDict
// next to them). We extract just the pure-function block (no `window`/DOM
// references, which don't exist under vitest) and eval it so these can be
// unit-tested without spinning up a browser.
function loadRuntimeHelpers() {
  const html = readFileSync('src/components/Runner/bootstrapper.html', 'utf-8');
  const match = html.match(/const _createDict[\s\S]*?(?=\n\s*const _print)/);
  if (!match) {
    throw new Error('Could not find runtime helper block in bootstrapper.html');
  }
  const factory = new Function(`${match[0]}
    return { _sbCheckedDictGet, _sbCheckedDictSet, _sbCheckedArrayGet, _sbCheckedArraySet };`);
  return factory();
}

describe('checked dict/array runtime accessors', () => {
  test('_sbCheckedDictGet reads a Map value', () => {
    const { _sbCheckedDictGet } = loadRuntimeHelpers();
    const map = new Map([['level', 3]]);
    expect(_sbCheckedDictGet(map, 'level', 'state')).toBe(3);
  });

  test('_sbCheckedDictGet throws a friendly error for a non-dictionary value', () => {
    const { _sbCheckedDictGet } = loadRuntimeHelpers();
    expect(() => _sbCheckedDictGet(5, 'level', 'state')).toThrow(
      "'state' does not hold a dictionary — cannot read key \"level\"."
    );
  });

  test('_sbCheckedDictSet writes into a Map value', () => {
    const { _sbCheckedDictSet } = loadRuntimeHelpers();
    const map = new Map();
    _sbCheckedDictSet(map, 'level', 3, 'state');
    expect(map.get('level')).toBe(3);
  });

  test('_sbCheckedDictSet throws a friendly error for a non-dictionary value', () => {
    const { _sbCheckedDictSet } = loadRuntimeHelpers();
    expect(() => _sbCheckedDictSet(5, 'level', 3, 'state')).toThrow(
      "'state' does not hold a dictionary — cannot set key \"level\"."
    );
  });

  test('_sbCheckedArrayGet reads an array value', () => {
    const { _sbCheckedArrayGet } = loadRuntimeHelpers();
    expect(_sbCheckedArrayGet(['sword', 'shield'], 0, 'items')).toBe('sword');
  });

  test('_sbCheckedArrayGet throws a friendly error for a non-array value', () => {
    const { _sbCheckedArrayGet } = loadRuntimeHelpers();
    expect(() => _sbCheckedArrayGet(5, 0, 'items')).toThrow(
      "'items' does not hold an array — cannot read index 0."
    );
  });

  test('_sbCheckedArraySet writes into an array value', () => {
    const { _sbCheckedArraySet } = loadRuntimeHelpers();
    const arr = ['sword', 'shield'];
    _sbCheckedArraySet(arr, 1, 'bow', 'items');
    expect(arr[1]).toBe('bow');
  });

  test('_sbCheckedArraySet throws a friendly error for a non-array value', () => {
    const { _sbCheckedArraySet } = loadRuntimeHelpers();
    expect(() => _sbCheckedArraySet(5, 0, 'bow', 'items')).toThrow(
      "'items' does not hold an array — cannot set index 0."
    );
  });
});
