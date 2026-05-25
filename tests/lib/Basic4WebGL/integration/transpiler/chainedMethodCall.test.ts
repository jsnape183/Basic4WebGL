import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { compileOk } from '../../helpers';

const actuatorFile = {
  name: 'Actuator',
  source: readFileSync('tests/sampleFiles/chainedMethod/Actuator.bas', 'utf-8'),
};
const robotFile = {
  name: 'Robot',
  source: readFileSync('tests/sampleFiles/chainedMethod/Robot.bas', 'utf-8'),
};

// ─── Statement context: obj.prop.method(args) ─────────────────────────────────

describe('chained method call — statement context', () => {
  test('obj.prop.method(arg) compiles without error', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    r.actuator.doAction(5)',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.doaction(5)');
  });

  test('obj.prop.method() with no args compiles', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    r.actuator.doAction()',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.doaction()');
  });
});

// ─── Expression context: x = obj.prop.method() ───────────────────────────────

describe('chained method call — expression context', () => {
  test('obj.prop.method() as RHS of assignment compiles', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    dim result',
      '    result = r.actuator.getValue()',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.getvalue()');
  });

  test('obj.prop.method() used as argument — no spurious semicolons', () => {
    const src = [
      'function onenter()',
      '    dim r as Robot',
      '    r.actuator.doAction(r.actuator.getValue())',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [actuatorFile, robotFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('actuator.doaction(');
    expect(result).not.toContain('getvalue();');
    expect(result).toContain('actuator.getvalue()');
  });
});
