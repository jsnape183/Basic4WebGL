import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { readFileSync } from 'fs';

const mathLib = { name: 'math', source: readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8') };

const transpile = (source: string) =>
  compiler.transpile({ lib: [mathLib], files: [{ name: 'Main.bas', source }] });

describe('math.random — bug fix', () => {
  test('random(max) emits Math.random()*max not Math.random(max)', () => {
    const result = transpile('function test()\n  dim x\n  x = math.random(100)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('Math.random()*');
    expect(result.code).not.toContain('Math.random(main');
  });
});

describe('math — new utility functions compile', () => {
  const fn = (body: string) =>
    transpile(`function test()\n  dim x\n  ${body}\nendfunction`);

  test('randomint compiles', () => {
    expect(fn('x = math.randomint(10)').diagnostics).toHaveLength(0);
  });
  test('min compiles', () => {
    expect(fn('x = math.min(3, 5)').diagnostics).toHaveLength(0);
  });
  test('max compiles', () => {
    expect(fn('x = math.max(3, 5)').diagnostics).toHaveLength(0);
  });
  test('clamp compiles', () => {
    expect(fn('x = math.clamp(x, 0, 100)').diagnostics).toHaveLength(0);
  });
  test('lerp compiles', () => {
    expect(fn('x = math.lerp(0, 10, 0.5)').diagnostics).toHaveLength(0);
  });
  test('distance compiles', () => {
    expect(fn('x = math.distance(0, 0, 3, 4)').diagnostics).toHaveLength(0);
  });
});

describe('math — output correctness', () => {
  const fn = (body: string) =>
    transpile(`function test()\n  dim x\n  ${body}\nendfunction`);

  test('randomint emits Math.floor(Math.random()*...)', () => {
    const result = fn('x = math.randomint(10)');
    expect(result.code).toContain('Math.floor(Math.random()');
  });
  test('min emits Math.min(...)', () => {
    const result = fn('x = math.min(3, 5)');
    expect(result.code).toContain('Math.min(');
  });
  test('max emits Math.max(...)', () => {
    const result = fn('x = math.max(3, 5)');
    expect(result.code).toContain('Math.max(');
  });
  test('clamp emits nested Math.min(Math.max(...))', () => {
    const result = fn('x = math.clamp(x, 0, 100)');
    expect(result.code).toContain('Math.min(Math.max(');
  });
  test('lerp emits interpolation expression', () => {
    const result = fn('x = math.lerp(0, 10, 0.5)');
    expect(result.code).toContain('+(');
  });
  test('distance emits Math.sqrt(Math.pow(...))', () => {
    const result = fn('x = math.distance(0, 0, 3, 4)');
    expect(result.code).toContain('Math.sqrt(Math.pow(');
  });
});
