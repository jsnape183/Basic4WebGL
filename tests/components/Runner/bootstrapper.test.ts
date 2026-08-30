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

// The language contract is that `delta` is elapsed **milliseconds**: the
// Language Guide says so outright, and every tutorial doing frame-rate
// independent movement writes `speed * delta / 1000`. PIXI's ticker exposes two
// different numbers — `deltaTime` is frame-count-normalised (~1.0 per frame at
// 60fps) and `deltaMS` is the millisecond value — and the frame loop was
// originally wired to the former, making every game run ~16.7x slow.
//
// Vitest cannot drive a real PIXI.Ticker, so cypress/e2e/deltaUnits.cy.ts owns
// the behavioural proof. This is the cheap static guard that fails the moment
// the wiring is edited back, without waiting for a browser run.
// The frame loop is driven by exactly two ticker callbacks, and their ORDER is
// load-bearing. PIXI runs ticker callbacks in descending priority, and
// Application registers its own render at UPDATE_PRIORITY.LOW (-25). So:
//
//   NORMAL  (0)  _sb._update      — fixed steps, then write interpolated positions
//   LOW    (-25) PIXI render      — draws the interpolated positions
//   UTILITY(-50) _sb._afterRender — restores the authoritative positions
//
// All three run synchronously inside one requestAnimationFrame tick, which is
// what guarantees no softBASIC code can ever observe an interpolated position.
// Get the priority wrong and either the render draws un-interpolated positions
// or game logic starts reading smoothed ones.
describe('per-frame ticker wiring', () => {
  const html = readFileSync('src/components/Runner/bootstrapper.html', 'utf-8');
  // The wiring statements themselves, with comments excluded — the surrounding
  // explanation deliberately names `deltaTime` to say why it is wrong, so the
  // assertions have to look at code rather than at the whole file.
  const tickerLines = html
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .filter((line) => line.includes('app.ticker.add'));

  test('registers exactly two per-frame ticker callbacks', () => {
    expect(tickerLines).toHaveLength(2);
  });

  test('drives _sb._update from the millisecond delta, not the normalised one', () => {
    expect(tickerLines[0]).toContain('_sb._update(ticker.deltaMS)');
  });

  test('never reads the frame-normalised ticker.deltaTime', () => {
    expect(tickerLines.join('\n')).not.toContain('deltaTime');
  });

  test('restores interpolated positions after PIXI renders', () => {
    expect(tickerLines[1]).toContain('_sb._afterRender()');
    expect(tickerLines[1]).toContain('PIXI.UPDATE_PRIORITY.UTILITY');
  });
});

// engine/frameloop.js has to be part of the assembled `_sb`, or _sb._update
// resolves to something else and fixed stepping silently stops happening.
describe('frame loop engine wiring', () => {
  const engine = readFileSync('src/components/Runner/softBasicEngine.js', 'utf-8');

  test('spreads _sbFrameLoop into _sb', () => {
    expect(engine).toContain('..._sbFrameLoop,');
  });

  test('spreads it last, so its _update wins over the same-named siblings', () => {
    const spreads = engine.match(/\.\.\._sb\w+,/g) ?? [];
    expect(spreads[spreads.length - 1]).toBe('..._sbFrameLoop,');
  });

  test('the runner concatenates frameloop.js into the sandboxed iframe', () => {
    const runner = readFileSync('src/components/Runner/index.tsx', 'utf-8');
    expect(runner).toContain("./engine/frameloop.js?raw");
    expect(runner).toContain('sbFrameLoop,');
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

describe('bootstrapper — gamepad connectivity listeners', () => {
  const html = readFileSync('src/components/Runner/bootstrapper.html', 'utf-8');
  const template = html;

  test('registers a gamepadconnected listener that sets _padConnected true', () => {
    expect(template).toContain("addEventListener('gamepadconnected'");
    expect(template).toMatch(/gamepadconnected[\s\S]{0,120}_sb\._padConnected\s*=\s*true/);
  });
  test('registers a gamepaddisconnected listener', () => {
    expect(template).toContain("addEventListener('gamepaddisconnected'");
    expect(template).toMatch(/gamepaddisconnected[\s\S]{0,160}navigator\.getGamepads/);
  });
});
