import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const spriteSource = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8');

const transpileWithSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Sprite.bas', source: spriteSource },
      { name: 'Main.bas', source },
    ],
  });

describe('sprite — setVelocity', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  s.setVelocity(100, -50)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setVelocity(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  s.setVelocity(100, -50)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setVelocity(');
  });
});

describe('sprite — velocityX / velocityY', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  dim vx',
      '  dim vy',
      '  vx = s.velocityX()',
      '  vy = s.velocityY()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.getVelocityX( and _sb.getVelocityY(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  dim vx',
      '  vx = s.velocityX()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getVelocityX(');
  });
});

describe('sprite — isBlockedUp / isBlockedDown / isBlockedLeft / isBlockedRight', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  if s.isBlockedDown() then',
      '    if s.isBlockedUp() then',
      '    endif',
      '    if s.isBlockedLeft() then',
      '    endif',
      '    if s.isBlockedRight() then',
      '    endif',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.isBlockedUp( / Down / Left / Right', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  dim a',
      '  dim b',
      '  dim c',
      '  dim d',
      '  a = s.isBlockedUp()',
      '  b = s.isBlockedDown()',
      '  c = s.isBlockedLeft()',
      '  d = s.isBlockedRight()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isBlockedUp(');
    expect(result.code).toContain('_sb.isBlockedDown(');
    expect(result.code).toContain('_sb.isBlockedLeft(');
    expect(result.code).toContain('_sb.isBlockedRight(');
  });
});

describe('sprite — attachTo / detach', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim child as Sprite("sword.png")',
      '  dim par as Sprite("player.png")',
      '  child.attachTo(par)',
      '  child.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.attachSprite( and _sb.detachSprite(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim child as Sprite("sword.png")',
      '  dim par as Sprite("player.png")',
      '  child.attachTo(par)',
      '  child.detach()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.attachSprite(');
    expect(result.code).toContain('_sb.detachSprite(');
  });
});
