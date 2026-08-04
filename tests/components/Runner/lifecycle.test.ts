import { readFileSync } from 'node:fs';
import { describe, test, expect, vi } from 'vitest';

// engine/lifecycle.js is a plain script (not an ES module) — it declares a
// bare `const _sbLifecycle` that the runner concatenates into the sandboxed
// iframe. Evaluate it in a Function context with the globals it expects, the
// same technique bootstrapper.test.ts uses for the inline runtime helpers.
function loadLifecycle(throwError: (e: Error) => void = () => {}) {
  const src = readFileSync('src/components/Runner/engine/lifecycle.js', 'utf-8');
  const factory = new Function('_throwError', `${src}\n return _sbLifecycle;`);
  return factory(throwError);
}

describe('_deferModuleBody / _runModuleBodies', () => {
  test('replays deferred module bodies in registration order', () => {
    const lifecycle = loadLifecycle();
    const order: string[] = [];
    lifecycle._deferModuleBody(() => order.push('player'));
    lifecycle._deferModuleBody(() => order.push('enemy'));
    lifecycle._deferModuleBody(() => order.push('main'));

    expect(order).toEqual([]);
    lifecycle._runModuleBodies();
    expect(order).toEqual(['player', 'enemy', 'main']);
  });

  test('drains the queue so a second run does not re-execute bodies', () => {
    const lifecycle = loadLifecycle();
    const body = vi.fn();
    lifecycle._deferModuleBody(body);
    lifecycle._runModuleBodies();
    lifecycle._runModuleBodies();
    expect(body).toHaveBeenCalledTimes(1);
  });

  test('lets a throwing module body propagate to the bootstrapper try/catch', () => {
    const lifecycle = loadLifecycle();
    lifecycle._deferModuleBody(() => {
      throw new Error('bad top-level statement');
    });
    expect(() => lifecycle._runModuleBodies()).toThrow('bad top-level statement');
  });
});

describe('_fireInit', () => {
  test('calls oninit on every module that defines it', () => {
    const lifecycle = loadLifecycle();
    const mainInit = vi.fn();
    const settingsInit = vi.fn();
    lifecycle._sbClasses = [
      { name: 'main', symbol: { oninit: mainInit } },
      { name: 'math', symbol: {} },
      { name: 'settings', symbol: { oninit: settingsInit } },
    ];

    lifecycle._fireInit();

    expect(mainInit).toHaveBeenCalledTimes(1);
    expect(settingsInit).toHaveBeenCalledTimes(1);
  });

  test('skips modules with no oninit without throwing', () => {
    const lifecycle = loadLifecycle();
    lifecycle._sbClasses = [{ name: 'math', symbol: {} }];
    expect(() => lifecycle._fireInit()).not.toThrow();
  });

  test('routes an error thrown inside oninit through _throwError', () => {
    const thrown: Error[] = [];
    const lifecycle = loadLifecycle((e) => thrown.push(e));
    lifecycle._sbClasses = [
      {
        name: 'main',
        symbol: {
          oninit() {
            throw new Error('bad init');
          },
        },
      },
    ];

    expect(() => lifecycle._fireInit()).not.toThrow();
    expect(thrown.map((e) => e.message)).toEqual(['bad init']);
  });
});
