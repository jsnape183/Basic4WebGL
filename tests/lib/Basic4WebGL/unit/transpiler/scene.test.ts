import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const sceneSource        = readFileSync('src/lib/Basic4WebGL/defs/scene.bas',        'utf-8');
const sceneManagerSource = readFileSync('src/lib/Basic4WebGL/defs/scenemanager.bas', 'utf-8');

// scene.bas is a class def file — goes into files[] with lowercase name
// scenemanager.bas is a module — goes into lib[] with lowercase name

const transpileWithScene = (childClassSource: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'scene.bas',  source: sceneSource },
      { name: 'MenuScene',  source: childClassSource },
    ],
  });

const transpileWithSceneManager = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'scenemanager', source: sceneManagerSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithBoth = (childClassSource: string, mainSource: string) =>
  compiler.transpile({
    lib: [{ name: 'scenemanager', source: sceneManagerSource }],
    files: [
      { name: 'scene.bas', source: sceneSource },
      { name: 'MenuScene',  source: childClassSource },
      { name: 'Main.bas',   source: mainSource },
    ],
  });

// ─── Scene base class ──────────────────────────────────────────────────────────
// In softBASIC, class inheritance is defined in a separate def file:
//   Class extends scene
//     function onenter() ... endfunction
//   EndClass
// Not in user source code.

describe('Scene — class extension', () => {
  test('Class extending scene compiles without error', () => {
    const result = transpileWithScene([
      'Class extends scene',
      '  function onenter()',
      '  endfunction',
      '  function onupdate(delta)',
      '  endfunction',
      '  function onexit()',
      '  endfunction',
      'EndClass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('Class extending scene with key hooks compiles without error', () => {
    const result = transpileWithScene([
      'Class extends scene',
      '  function onkeydown(key)',
      '  endfunction',
      '  function onkeyup(key)',
      '  endfunction',
      'EndClass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('empty Class extending scene compiles without error', () => {
    const result = transpileWithScene('Class extends scene\nEndClass');
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── scenemanager.register ────────────────────────────────────────────────────

describe('scenemanager — register', () => {
  test('compiles without error', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  dim s',
      '  scenemanager.register("menu", s)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.sceneRegister(', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  dim s',
      '  scenemanager.register("menu", s)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.sceneRegister(');
  });
});

// ─── scenemanager.switch ──────────────────────────────────────────────────────

describe('scenemanager — switch', () => {
  test('compiles without error', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  scenemanager.switch("game")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.sceneSwitch(', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  scenemanager.switch("game")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.sceneSwitch(');
  });
});

// ─── Integration: extend + register + switch ──────────────────────────────────

describe('Scene + scenemanager — integration', () => {
  test('full scene setup compiles without error', () => {
    const menuSceneSource = [
      'Class extends scene',
      '  function onenter()',
      '  endfunction',
      '  function onupdate(delta)',
      '    scenemanager.switch("game")',
      '  endfunction',
      'EndClass',
    ].join('\n');

    const mainSource = [
      'function onenter()',
      '  dim menu = new menuscene()',
      '  scenemanager.register("menu", menu)',
      '  scenemanager.switch("menu")',
      'endfunction',
    ].join('\n');

    const result = transpileWithBoth(menuSceneSource, mainSource);
    expect(result.diagnostics).toHaveLength(0);
  });
});
