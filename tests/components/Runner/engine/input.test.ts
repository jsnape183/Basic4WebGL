import { readFileSync } from 'node:fs';
import { describe, test, expect, vi, afterEach } from 'vitest';

// engine/input.js is a plain script — it declares a bare `const _sbInput = { ... }`.
// Evaluate it in a Function context and return the object, the same technique
// scene.test.ts / collision.test.ts use for the other engine modules.
function loadInput() {
  const src = readFileSync('src/components/Runner/engine/input.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbInput;`);
  return factory() as any;
}

/** A standard-mapping gamepad snapshot. `buttons` entries may be a number
 *  (shorthand: value, pressed = value >= 0.5) or a full { pressed, value }. */
function makePad({ buttons = [], axes = [0, 0, 0, 0] }: { buttons?: any[]; axes?: number[] } = {}) {
  return {
    mapping: 'standard',
    connected: true,
    buttons: Array.from({ length: 17 }, (_, i) => {
      const b = buttons[i];
      if (b == null) return { pressed: false, value: 0 };
      if (typeof b === 'number') return { pressed: b >= 0.5, value: b };
      return b;
    }),
    axes: [axes[0] ?? 0, axes[1] ?? 0, axes[2] ?? 0, axes[3] ?? 0],
  };
}

function setPads(pads: any[]) {
  vi.stubGlobal('navigator', { getGamepads: () => pads });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('_sbInput.bind', () => {
  test('stores a binding under the action name', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    expect(inp._actions.jump).toEqual([{ device: 'key', code: 32 }]);
  });
  test('appends multiple bindings for one action', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.bind('jump', 'button', 0);
    expect(inp._actions.jump).toEqual([
      { device: 'key', code: 32 },
      { device: 'button', code: 0 },
    ]);
  });
  test('throws on an unknown device string', () => {
    const inp = loadInput();
    expect(() => inp.bind('jump', 'joystick', 0)).toThrow(/unknown device/i);
  });
});

describe('_sbInput.clearBindings', () => {
  test('empties an action without deleting the key', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.clearBindings('jump');
    expect(inp._actions.jump).toEqual([]);
  });
});

describe('_sbInput — pad state defaults', () => {
  test('starts with no pad connected and empty pad tables', () => {
    const inp = loadInput();
    expect(inp._padConnected).toBe(false);
    expect(inp._deadzone).toBeCloseTo(0.15);
    expect(inp._axisThreshold).toBeCloseTo(0.5);
    expect(inp._padButtons).toEqual([]);
    expect(inp._padAxisHalves).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
