import { test, expect, describe } from 'vitest';
import { compileOk, loadSampleFile } from '../../helpers';

const folder = 'instanceMethods';
const playerFile = { name: 'Player', source: loadSampleFile('Player', folder) };
const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };

describe('class instance methods use function() not arrow function', () => {
  test('class method is emitted as function expression, not arrow function', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    expect(result).toContain('player.prototype.takedamage=function(');
    expect(result).not.toContain('player.prototype.takedamage=(');
    expect(result).toContain('player.prototype.gethealth=function(');
  });
});
