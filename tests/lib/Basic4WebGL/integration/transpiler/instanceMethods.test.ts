import { test, expect, describe } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'instanceMethods';
const playerFile = { name: 'Player', source: loadSampleFile('Player', folder) };
const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };

function compileOk(project: CompilerProject): string {
  const result = compiler.transpile(project);
  const errorMessages = result.diagnostics.map((d) => d.message).join('; ');
  expect(errorMessages, `compile errors: ${errorMessages}`).toBe('');
  expect(result.code).toBeDefined();
  return cleanWhitespace(result.code!);
}

describe('class instance methods use function() not arrow function', () => {
  test('class method is emitted as function expression, not arrow function', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    expect(result).toContain('player.prototype.takedamage=function(');
    expect(result).not.toContain('player.prototype.takedamage=(');
  });
});
