import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/time.js is a plain script (not an ES module) — it declares a bare
// `const _sbTime` that the runner concatenates into the sandboxed iframe.
// Evaluate it in a Function context, the same technique frameloop.test.ts uses.
function loadTime() {
  const src = readFileSync('src/components/Runner/engine/time.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbTime;`);
  return factory() as { timeNow(): number };
}

describe('_sbTime.timeNow (time.now())', () => {
  test('returns a number', () => {
    expect(typeof loadTime().timeNow()).toBe('number');
  });

  test('is monotonically non-decreasing across successive calls', () => {
    const time = loadTime();
    const a = time.timeNow();
    for (let i = 0; i < 5000; i++) {
      /* burn a little wall-clock time */
    }
    const b = time.timeNow();
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
