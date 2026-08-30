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

describe('_sbInput._pollGamepads — axis half deadzone rescale', () => {
  test('a raw value at the deadzone edge produces 0', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [0.15, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(0);
  });
  test('full deflection produces 1', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(1);
  });
  test('halfway past the deadzone produces ~0.5', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [0.575, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(0.5, 5);
  });
  test('negative axis feeds the opposite half; the active half is 0', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [-1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[0]).toBeCloseTo(1);
    expect(inp._padAxisHalves[1]).toBeCloseTo(0);
  });
  test('a larger deadzone rescales the ramp', () => {
    const inp = loadInput();
    inp.setDeadzone(0.5);
    setPads([makePad({ axes: [0.75, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[1]).toBeCloseTo(0.5, 5);
  });
  test('vertical axis maps to UP (negative) and DOWN (positive) halves', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [0, -1, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._padAxisHalves[2]).toBeCloseTo(1);
    expect(inp._padAxisHalves[3]).toBeCloseTo(0);
  });
});

describe('_sbInput._pollGamepads — connectivity', () => {
  test('no pads: _padConnected false, tables cleared', () => {
    const inp = loadInput();
    setPads([]);
    inp._pollGamepads();
    expect(inp._padConnected).toBe(false);
    expect(inp._padButtons).toEqual([]);
    expect(inp._padAxisHalves).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
  test('null-padded array: picks the first non-null pad', () => {
    const inp = loadInput();
    setPads([null, makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp._padConnected).toBe(true);
    expect(inp._padButtons[0]).toEqual({ pressed: true, value: 1 });
  });
  test('navigator without getGamepads is treated as no pad', () => {
    const inp = loadInput();
    vi.stubGlobal('navigator', {});
    inp._pollGamepads();
    expect(inp._padConnected).toBe(false);
  });
});

describe('_sbInput._pollGamepads — button edges', () => {
  test('a newly-pressed button sets _justPressed["b0"] once', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp._justPressed['b0']).toBe(true);
    expect(inp._justReleased['b0']).toBeUndefined();
  });
  test('a held button produces no repeat edge on the next poll', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp._justPressed['b0']).toBeUndefined();
  });
  test('releasing a button sets _justReleased["b0"]', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [0] })]);
    inp._pollGamepads();
    expect(inp._justReleased['b0']).toBe(true);
  });
});

describe('_sbInput._pollGamepads — analog->digital crossover at 0.5', () => {
  test('crossing the threshold once yields a single h# pressed edge', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [0.4, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ axes: [0.7, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._justPressed['h1']).toBe(true);
    inp._resetFrameInput();
    setPads([makePad({ axes: [0.9, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._justPressed['h1']).toBeUndefined();
  });
  test('dropping back below the threshold yields an h# released edge', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ axes: [0.1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp._justReleased['h1']).toBe(true);
  });
});

describe('_sbInput._pollGamepads — disconnect flushes releases', () => {
  test('a held button that disappears on disconnect fires a released edge', () => {
    const inp = loadInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([]); // disconnect
    inp._pollGamepads();
    expect(inp._justReleased['b0']).toBe(true);
    expect(inp._padConnected).toBe(false);
  });
  test('a deflected stick that disconnects fires an h# released edge', () => {
    const inp = loadInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([]);
    inp._pollGamepads();
    expect(inp._justReleased['h1']).toBe(true);
  });
});

describe('_sbInput.held', () => {
  test('keyboard source: true while the key is down', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    expect(inp.held('jump')).toBe(false);
    inp.registerKey(32, true);
    expect(inp.held('jump')).toBe(true);
  });
  test('button source: true while the pad button is pressed', () => {
    const inp = loadInput();
    inp.bind('fire', 'button', 0);
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.held('fire')).toBe(true);
  });
  test('axis source: true once the half-strength reaches the threshold', () => {
    const inp = loadInput();
    inp.bind('move_right', 'axis', 1);
    setPads([makePad({ axes: [0.4, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.held('move_right')).toBe(false);
    inp._resetFrameInput();
    setPads([makePad({ axes: [0.9, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.held('move_right')).toBe(true);
  });
  test('OR across sources: either the key or the button activates it', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.bind('jump', 'button', 0);
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.held('jump')).toBe(true);
  });
  test('unbound action is never held', () => {
    const inp = loadInput();
    expect(inp.held('nothing')).toBe(false);
  });
});

describe('_sbInput.pressed / released', () => {
  test('pressed: true only on the key-down edge', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.registerKey(32, true);
    expect(inp.pressed('jump')).toBe(true);
    inp._resetFrameInput();
    expect(inp.pressed('jump')).toBe(false);
  });
  test('pressed: true on the button-down edge (b# namespace)', () => {
    const inp = loadInput();
    inp.bind('fire', 'button', 0);
    setPads([makePad({ buttons: [0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.pressed('fire')).toBe(true);
  });
  test('pressed: true on the axis threshold-crossing edge (h# namespace)', () => {
    const inp = loadInput();
    inp.bind('move_right', 'axis', 1);
    setPads([makePad({ axes: [0, 0, 0, 0] })]);
    inp._pollGamepads();
    inp._resetFrameInput();
    setPads([makePad({ axes: [1, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.pressed('move_right')).toBe(true);
  });
  test('released: true on the key-up edge', () => {
    const inp = loadInput();
    inp.bind('jump', 'key', 32);
    inp.registerKey(32, true);
    inp._resetFrameInput();
    inp.registerKey(32, false);
    expect(inp.released('jump')).toBe(true);
  });
});

describe('_sbInput.strength', () => {
  test('digital key source: 1 when down, 0 when up', () => {
    const inp = loadInput();
    inp.bind('fire', 'key', 32);
    expect(inp.strength('fire')).toBe(0);
    inp.registerKey(32, true);
    expect(inp.strength('fire')).toBe(1);
  });
  test('button source: the analog button value (e.g. a trigger)', () => {
    const inp = loadInput();
    inp.bind('fire', 'button', 7);
    setPads([makePad({ buttons: (() => { const a: any[] = []; a[7] = { pressed: true, value: 0.3 }; return a; })() })]);
    inp._pollGamepads();
    expect(inp.strength('fire')).toBeCloseTo(0.3);
  });
  test('axis source: the deadzoned half-strength', () => {
    const inp = loadInput();
    inp.bind('move_right', 'axis', 1);
    setPads([makePad({ axes: [0.575, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.strength('move_right')).toBeCloseTo(0.5, 5);
  });
  test('max across sources: key down (1) beats a weak stick push', () => {
    const inp = loadInput();
    inp.bind('move_right', 'key', 39);
    inp.bind('move_right', 'axis', 1);
    inp.registerKey(39, true);
    setPads([makePad({ axes: [0.3, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.strength('move_right')).toBe(1);
  });
  test('unbound action has strength 0', () => {
    const inp = loadInput();
    expect(inp.strength('nope')).toBe(0);
  });
});

describe('_sbInput.axis', () => {
  test('returns strength(pos) - strength(neg)', () => {
    const inp = loadInput();
    inp.bind('left', 'axis', 0);
    inp.bind('right', 'axis', 1);
    setPads([makePad({ axes: [0.575, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.axis('left', 'right')).toBeCloseTo(0.5, 5);
  });
  test('is negative when the neg action wins', () => {
    const inp = loadInput();
    inp.bind('left', 'key', 37);
    inp.bind('right', 'key', 39);
    inp.registerKey(37, true);
    expect(inp.axis('left', 'right')).toBe(-1);
  });
  test('clamps to [-1, 1]', () => {
    const inp = loadInput();
    inp.bind('right', 'key', 39);
    inp.bind('right', 'button', 0);
    inp.registerKey(39, true);
    setPads([makePad({ buttons: [1] })]);
    inp._pollGamepads();
    expect(inp.axis('left', 'right')).toBe(1);
  });
  test('rest position is 0', () => {
    const inp = loadInput();
    inp.bind('left', 'axis', 0);
    inp.bind('right', 'axis', 1);
    setPads([makePad({ axes: [0, 0, 0, 0] })]);
    inp._pollGamepads();
    expect(inp.axis('left', 'right')).toBe(0);
  });
});
