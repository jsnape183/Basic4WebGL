import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const cameraSource = readFileSync('src/lib/Basic4WebGL/defs/camera.bas', 'utf-8');
const worldSource  = readFileSync('src/lib/Basic4WebGL/defs/world.bas',  'utf-8');
const hudSource    = readFileSync('src/lib/Basic4WebGL/defs/hud.bas',    'utf-8');

const transpileWithCamera = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'camera', source: cameraSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithWorld = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'world', source: worldSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithHud = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'hud', source: hudSource }],
    files: [{ name: 'Main.bas', source }],
  });

// ─── camera.follow ────────────────────────────────────────────────────────────

describe('camera — follow', () => {
  test('compiles without error (snap)', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim s',
      '  camera.follow(s, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('compiles without error (smooth)', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim s',
      '  camera.follow(s, 0.1)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraFollow(', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim s',
      '  camera.follow(s, 0)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraFollow(');
  });
});

// ─── camera.setPosition ───────────────────────────────────────────────────────

describe('camera — setPosition', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  camera.setPosition(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraSetPosition(', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  camera.setPosition(100, 200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraSetPosition(');
  });
});

// ─── camera.setBounds ─────────────────────────────────────────────────────────

describe('camera — setBounds', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function onenter()',
      '  camera.setBounds(2000, 1000)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraSetBounds(', () => {
    const result = transpileWithCamera([
      'function onenter()',
      '  camera.setBounds(2000, 1000)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraSetBounds(');
  });
});

// ─── camera.x and camera.y ────────────────────────────────────────────────────

describe('camera — x and y', () => {
  test('camera.x() compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cx',
      '  cx = camera.x()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('camera.x() emits _sb.cameraX()', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cx',
      '  cx = camera.x()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraX()');
  });

  test('camera.y() compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cy',
      '  cy = camera.y()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('camera.y() emits _sb.cameraY()', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim cy',
      '  cy = camera.y()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraY()');
  });
});

// ─── camera.shake ─────────────────────────────────────────────────────────────

describe('camera — shake', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  camera.shake(6, 0.3)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraShake(', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  camera.shake(6, 0.3)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraShake(');
  });
});

// ─── camera.setZoom and camera.zoom ───────────────────────────────────────────

describe('camera — setZoom', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function oninit()',
      '  camera.setZoom(4)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraSetZoom(', () => {
    const result = transpileWithCamera([
      'function oninit()',
      '  camera.setZoom(4)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraSetZoom(');
  });
});

describe('camera — zoom', () => {
  test('compiles without error', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim z',
      '  z = camera.zoom()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.cameraZoom()', () => {
    const result = transpileWithCamera([
      'function onupdate(delta)',
      '  dim z',
      '  z = camera.zoom()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.cameraZoom()');
  });
});

// ─── world ────────────────────────────────────────────────────────────────────

describe('world — add', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.addToWorld(', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addToWorld(');
  });
});

describe('world — remove', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.removeFromWorld(', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  dim obj',
      '  world.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.removeFromWorld(');
  });
});

describe('world — clear', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  world.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.clearWorld()', () => {
    const result = transpileWithWorld([
      'function onenter()',
      '  world.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.clearWorld()');
  });
});

describe('world — setPixelPerfect', () => {
  test('compiles without error', () => {
    const result = transpileWithWorld([
      'function oninit()',
      '  world.setPixelPerfect(true)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setPixelPerfect(', () => {
    const result = transpileWithWorld([
      'function oninit()',
      '  world.setPixelPerfect(true)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setPixelPerfect(');
  });
});

// ─── hud ──────────────────────────────────────────────────────────────────────

describe('hud — add', () => {
  test('compiles without error', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.addToHud(', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.add(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.addToHud(');
  });
});

describe('hud — remove', () => {
  test('compiles without error', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.removeFromHud(', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  dim obj',
      '  hud.remove(obj)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.removeFromHud(');
  });
});

describe('hud — clear', () => {
  test('compiles without error', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  hud.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.clearHud()', () => {
    const result = transpileWithHud([
      'function onenter()',
      '  hud.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.clearHud()');
  });
});
