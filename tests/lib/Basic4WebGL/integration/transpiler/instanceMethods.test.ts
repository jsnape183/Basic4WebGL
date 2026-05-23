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

describe('class method body — instance property write', () => {
  test('assignment to class-level property emits this.prop', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    // takeDamage: health = health - amount  →  this.health = this.health - takedamage_amount
    expect(result).toContain('this.health=this.health-takedamage_amount');
  });
});

describe('class method body — instance property read', () => {
  test('reading class-level property in expression emits this.prop', () => {
    const result = compileOk({ lib: [], files: [playerFile, mainFile] });
    // getHealth: return health  →  return this.health
    expect(result).toContain('returnthis.health');
  });
});
