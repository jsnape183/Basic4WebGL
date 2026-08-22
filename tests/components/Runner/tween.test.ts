import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/tween.js is a plain script (not an ES module) — same loading
// technique tests/components/Runner/pathfinding.test.ts already uses for
// engine/pathfinding.js, since it declares a bare `const _sbTween` that the
// runner concatenates into the sandboxed iframe rather than importing.
function loadTween() {
  const src = readFileSync('src/components/Runner/engine/tween.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbTween;`);
  return factory();
}

function makeHandle() {
  return {
    angle: 0,
    alpha: 1,
    scale: { x: 1, y: 1, set(x: number, y: number) { this.x = x; this.y = y; } },
    position: { x: 0, y: 0, set(x: number, y: number) { this.x = x; this.y = y; } },
  };
}

// Matches the compiled field names a real `Keyframe` instance has —
// scaleX/scaleY compile to lowercase scalex/scaley (confirmed via a
// throwaway transpile during design, not assumed).
function frame(time: number, angle: number, scalex = 1, scaley = 1, alpha = 1, x = 0, y = 0) {
  return { time, angle, scalex, scaley, alpha, x, y };
}

describe('tweenPlay / tweenIsPlaying / tweenStop', () => {
  test('a sprite is not playing until tweenPlay is called', () => {
    const tw = loadTween();
    const handle = makeHandle();
    expect(tw.tweenIsPlaying({ _handle: handle })).toBe(false);
  });

  test('tweenPlay starts it, tweenStop halts it', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 90)], false);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(true);
    tw.tweenStop(spriteObj);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(false);
  });

  test('does nothing given no handle or an empty frames array', () => {
    const tw = loadTween();
    expect(() => tw.tweenPlay({ _handle: null }, [frame(0, 0)], false)).not.toThrow();
    expect(() => tw.tweenPlay({ _handle: makeHandle() }, [], false)).not.toThrow();
  });
});

describe('_tweenUpdate — interpolation', () => {
  test('linearly interpolates angle between two keyframes', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay({ _handle: handle }, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(500); // 0.5s of a 1s span
    expect(handle.angle).toBeCloseTo(50);
  });

  test('interpolates scale, alpha, and position together', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay(
      { _handle: handle },
      [frame(0, 0, 1, 1, 1, 0, 0), frame(1, 0, 3, 3, 0, 100, 200)],
      false
    );
    tw._tweenUpdate(500);
    expect(handle.scale.x).toBeCloseTo(2);
    expect(handle.scale.y).toBeCloseTo(2);
    expect(handle.alpha).toBeCloseTo(0.5);
    expect(handle.position.x).toBeCloseTo(50);
    expect(handle.position.y).toBeCloseTo(100);
  });

  test('frames need not be pre-sorted — engine sorts by time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay({ _handle: handle }, [frame(1, 100), frame(0, 0)], false);
    tw._tweenUpdate(500);
    expect(handle.angle).toBeCloseTo(50);
  });

  test('before the first keyframe, snaps immediately to its values', () => {
    const tw = loadTween();
    const handle = makeHandle();
    tw.tweenPlay({ _handle: handle }, [frame(0.5, 40), frame(1, 100)], false);
    tw._tweenUpdate(16.67); // well before time=0.5
    expect(handle.angle).toBeCloseTo(40);
  });

  test('non-looping: holds the final keyframe and stops after it finishes', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(0.5, 100)], false);
    tw._tweenUpdate(1000); // well past the 0.5s span
    expect(handle.angle).toBeCloseTo(100);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(false);
  });

  test('looping: wraps elapsed time modulo the last keyframe time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], true);
    tw._tweenUpdate(1500); // 1.5s -> wraps to 0.5s into the loop
    expect(handle.angle).toBeCloseTo(50);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(true);
  });

  test('restarting play on an already-playing sprite resets elapsed time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(900);
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false); // restart
    tw._tweenUpdate(0);
    expect(handle.angle).toBeCloseTo(0);
  });
});
