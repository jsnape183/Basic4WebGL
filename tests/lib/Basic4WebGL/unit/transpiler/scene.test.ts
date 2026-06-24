import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const sceneSource        = readFileSync('src/lib/Basic4WebGL/defs/Scene.bas',        'utf-8');
const sceneManagerSource = readFileSync('src/lib/Basic4WebGL/defs/SceneManager.bas', 'utf-8');

const transpileWithScene = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Scene.bas',  source: sceneSource },
      { name: 'Main.bas',   source },
    ],
  });

const transpileWithSceneManager = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'SceneManager', source: sceneManagerSource }],
    files: [{ name: 'Main.bas', source }],
  });

const transpileWithBoth = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'SceneManager', source: sceneManagerSource }],
    files: [
      { name: 'Scene.bas', source: sceneSource },
      { name: 'Main.bas',  source },
    ],
  });

// ─── Scene base class ──────────────────────────────────────────────────────────

describe('Scene — class extension', () => {
  test('class extending Scene compiles without error', () => {
    const result = transpileWithScene([
      'class MenuScene extends Scene',
      '  function onenter()',
      '  endfunction',
      '  function onupdate(delta)',
      '  endfunction',
      '  function onexit()',
      '  endfunction',
      'endclass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('class extending Scene with key hooks compiles without error', () => {
    const result = transpileWithScene([
      'class GameScene extends Scene',
      '  function onkeydown(key)',
      '  endfunction',
      '  function onkeyup(key)',
      '  endfunction',
      'endclass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('scene subclass with no methods compiles without error', () => {
    const result = transpileWithScene([
      'class EmptyScene extends Scene',
      'endclass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── SceneManager.register ────────────────────────────────────────────────────

describe('SceneManager — register', () => {
  test('compiles without error', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  dim s',
      '  SceneManager.register("menu", s)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.sceneRegister(', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  dim s',
      '  SceneManager.register("menu", s)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.sceneRegister(');
  });
});

// ─── SceneManager.switch ──────────────────────────────────────────────────────

describe('SceneManager — switch', () => {
  test('compiles without error', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  SceneManager.switch("game")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.sceneSwitch(', () => {
    const result = transpileWithSceneManager([
      'function test()',
      '  SceneManager.switch("game")',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.sceneSwitch(');
  });
});

// ─── Integration: extend + register + switch ──────────────────────────────────

describe('Scene + SceneManager — integration', () => {
  test('full scene setup compiles without error', () => {
    const result = transpileWithBoth([
      'class MenuScene extends Scene',
      '  function onenter()',
      '  endfunction',
      '  function onupdate(delta)',
      '    SceneManager.switch("game")',
      '  endfunction',
      'endclass',
      'dim menu = new MenuScene()',
      'SceneManager.register("menu", menu)',
      'SceneManager.switch("menu")',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
