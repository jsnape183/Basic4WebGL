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
