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

// The order of these steps is the whole point of the `oninit` feature — user
// code has to be declared, and oninit fired, before a single asset loads. A
// unit test can't prove the async sequence actually behaves (cypress/e2e/
// oninit.cy.ts does that), but it can lock the source order so an accidental
// reorder fails loudly here first.
describe('boot sequence order', () => {
  const html = readFileSync('src/components/Runner/bootstrapper.html', 'utf-8');
  const at = (needle: string) => {
    const index = html.indexOf(needle);
    expect(index, `bootstrapper.html no longer contains ${needle}`).toBeGreaterThan(-1);
    return index;
  };

  test('declares transpiled code and fires oninit before any preloading', () => {
    expect(at('//${transpiled}')).toBeLessThan(at('_sb._fireInit()'));
    expect(at('_sb._fireInit()')).toBeLessThan(at('//${inlineAssets}'));
    expect(at('_sb._fireInit()')).toBeLessThan(at('_sb.preloadFromLocalStorage'));
    expect(at('_sb._fireInit()')).toBeLessThan(at('_sb.preloadAudioFromLocalStorage'));
  });

  test('runs deferred module bodies after preloading and before the scene switch', () => {
    expect(at('_sb.preloadAudioFromLocalStorage')).toBeLessThan(
      at('_sb._runModuleBodies()')
    );
    expect(at('_sb._runModuleBodies()')).toBeLessThan(at('_sb._applySwitch()'));
  });

  test('registers input listeners, the ticker and onenter after module bodies', () => {
    expect(at('_sb._runModuleBodies()')).toBeLessThan(at("addEventListener('keydown'"));
    expect(at('_sb._runModuleBodies()')).toBeLessThan(at('app.ticker.add'));
    expect(at('_sb._runModuleBodies()')).toBeLessThan(at('c.symbol.onenter'));
  });

  test('initialises the stage before firing oninit', () => {
    expect(at('_sb._initStage()')).toBeLessThan(at('_sb._fireInit()'));
  });
});

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
