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
// throwaway transpile during design, not assumed). Every channel is only
// marked "set" (hasangle/hasscalex/etc, read by tweenPlay to decide which
// channels this tween controls at all) when the caller actually passes it,
// mirroring how a real Keyframe only flips its has* flag when the matching
// setter is called -- angle included, so a test can build an angle-less
// (e.g. position-only) frame the same way a real .bas caller would by
// simply never calling setAngle.
function frame(
  time: number,
  angle?: number,
  scalex?: number,
  scaley?: number,
  alphaVal?: number,
  x?: number,
  y?: number
) {
  const hasPosition = x !== undefined || y !== undefined;
  return {
    time,
    angle: angle ?? 0,
    scalex: scalex ?? 1,
    scaley: scaley ?? 1,
    alpha: alphaVal ?? 1,
    x: x ?? 0,
    y: y ?? 0,
    hasangle: angle !== undefined,
    hasscalex: scalex !== undefined,
    hasscaley: scaley !== undefined,
    hasalpha: alphaVal !== undefined,
    hasposition: hasPosition,
  };
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
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(500); // 0.5s of a 1s span
    expect(handle.angle).toBeCloseTo(50);
  });

  test('interpolates scale, alpha, and position together', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(
      spriteObj,
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
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(1, 100), frame(0, 0)], false);
    tw._tweenUpdate(500);
    expect(handle.angle).toBeCloseTo(50);
  });

  test('before the first keyframe, snaps immediately to its values', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0.5, 40), frame(1, 100)], false);
    tw._tweenUpdate(16.67); // well before time=0.5
    expect(handle.angle).toBeCloseTo(40);
  });

  test('non-looping: holds the final keyframe and stops after it finishes', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    // Non-default scale/alpha/position on the final keyframe: the "finished"
    // path applies the raw Keyframe object directly rather than through the
    // interpolation remap, so this catches the scalex/scaley-vs-scaleX/scaleY
    // naming mismatch a defaults-only frame (scale 1, alpha 1) would hide.
    tw.tweenPlay(spriteObj, [frame(0, 0, 1, 1, 1, 0, 0), frame(0.5, 100, 2, 3, 0.5, 10, 20)], false);
    tw._tweenUpdate(1000); // well past the 0.5s span
    expect(handle.angle).toBeCloseTo(100);
    expect(handle.scale.x).toBeCloseTo(2);
    expect(handle.scale.y).toBeCloseTo(3);
    expect(handle.alpha).toBeCloseTo(0.5);
    expect(handle.position.x).toBeCloseTo(10);
    expect(handle.position.y).toBeCloseTo(20);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(false);
  });

  test('looping: wraps elapsed time modulo the last keyframe time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], true);
    tw._tweenUpdate(1500); // 1.5s -> wraps to 0.5s into the loop
    expect(handle.angle).toBeCloseTo(50);
    expect(tw.tweenIsPlaying(spriteObj)).toBe(true);
  });

  test('restarting play on an already-playing sprite resets elapsed time', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(900);
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false); // restart
    tw._tweenUpdate(0);
    expect(handle.angle).toBeCloseTo(0);
  });
});

describe('_tweenUpdate — only controls channels a keyframe actually set', () => {
  test('a tween that only sets angle leaves position, scale, and alpha alone', () => {
    const tw = loadTween();
    const handle = makeHandle();
    handle.position.x = 50;
    handle.position.y = 60;
    handle.scale.x = 2;
    handle.scale.y = 3;
    handle.alpha = 0.4;
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false);
    tw._tweenUpdate(500);
    expect(handle.angle).toBeCloseTo(50);
    expect(handle.position.x).toBe(50);
    expect(handle.position.y).toBe(60);
    expect(handle.scale.x).toBe(2);
    expect(handle.scale.y).toBe(3);
    expect(handle.alpha).toBe(0.4);
  });

  test('a tween that only sets position leaves angle, scale, and alpha alone', () => {
    const tw = loadTween();
    const handle = makeHandle();
    handle.angle = 30;
    handle.scale.x = 2;
    handle.scale.y = 3;
    handle.alpha = 0.4;
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(
      spriteObj,
      [frame(0, undefined, undefined, undefined, undefined, 0, 0), frame(1, undefined, undefined, undefined, undefined, 100, 200)],
      false
    );
    tw._tweenUpdate(500);
    expect(handle.position.x).toBeCloseTo(50);
    expect(handle.position.y).toBeCloseTo(100);
    expect(handle.angle).toBe(30);
    expect(handle.scale.x).toBe(2);
    expect(handle.scale.y).toBe(3);
    expect(handle.alpha).toBe(0.4);
  });

  test('a manual change to an untouched channel mid-tween is not overwritten on the next tick', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], false); // angle-only
    tw._tweenUpdate(200);
    // Something else (e.g. kinematic movement driven by setVelocity) moves
    // the sprite while the angle tween is still running.
    handle.position.x = 999;
    handle.position.y = 888;
    tw._tweenUpdate(200);
    expect(handle.position.x).toBe(999);
    expect(handle.position.y).toBe(888);
  });

  test('holding the final keyframe of a non-looping tween still only applies channels that were set', () => {
    const tw = loadTween();
    const handle = makeHandle();
    handle.position.x = 12;
    handle.position.y = 34;
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(0.5, 100)], false); // angle-only
    tw._tweenUpdate(1000); // well past the 0.5s span
    expect(handle.angle).toBeCloseTo(100);
    expect(handle.position.x).toBe(12);
    expect(handle.position.y).toBe(34);
  });
});

describe('_tweenUpdate — stale instance cleanup', () => {
  test('drops playing state for a sprite no longer registered in _sbInstances, without applying a frame', () => {
    const tw = loadTween();
    const handle = makeHandle();
    const spriteObj = { _handle: handle };
    tw._sbInstances = [spriteObj];
    tw.tweenPlay(spriteObj, [frame(0, 0), frame(1, 100)], true); // looping, would never self-clear
    tw._sbInstances = []; // simulate world.remove(spriteObj) / scene switch

    tw._tweenUpdate(500);

    expect(handle.angle).toBe(0); // untouched — no frame was applied
    expect(tw.tweenIsPlaying(spriteObj)).toBe(false);
  });

  test('does nothing when no sprite is playing', () => {
    const tw = loadTween();
    tw._sbInstances = [];
    expect(() => tw._tweenUpdate(16)).not.toThrow();
  });
});
