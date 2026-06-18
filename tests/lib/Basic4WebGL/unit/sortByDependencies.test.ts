import { describe, test, expect } from 'vitest';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { ProjectFile } from '@CompilerLib/compiler/types';

const f = (name: string, source = ''): ProjectFile => ({ name, source });

describe('sortByDependencies', () => {
  test('empty array returns empty', () => {
    const { files, error } = sortByDependencies([]);
    expect(error).toBeUndefined();
    expect(files).toEqual([]);
  });

  test('no dependencies — preserves original order', () => {
    const { files, error } = sortByDependencies([f('A'), f('B'), f('C')]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['A', 'B', 'C']);
  });

  test('direct dependency — dependent compiled after', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'new Enemy()'),
      f('Enemy', ''),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Enemy', 'Main']);
  });

  test('transitive chain — full chain resolved', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'new Enemy()'),
      f('Enemy', 'new Ammo()'),
      f('Ammo', ''),
    ]);
    expect(error).toBeUndefined();
    const names = files.map((x) => x.name);
    expect(names.indexOf('Ammo')).toBeLessThan(names.indexOf('Enemy'));
    expect(names.indexOf('Enemy')).toBeLessThan(names.indexOf('Main'));
  });

  test('diamond dependency — base before both; both before main', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'new A()\nnew B()'),
      f('A', 'new Base()'),
      f('B', 'new Base()'),
      f('Base', ''),
    ]);
    expect(error).toBeUndefined();
    const names = files.map((x) => x.name);
    expect(names.indexOf('Base')).toBeLessThan(names.indexOf('A'));
    expect(names.indexOf('Base')).toBeLessThan(names.indexOf('B'));
    expect(names.indexOf('A')).toBeLessThan(names.indexOf('Main'));
    expect(names.indexOf('B')).toBeLessThan(names.indexOf('Main'));
  });

  test('already correct order — unchanged', () => {
    const { files, error } = sortByDependencies([
      f('Ammo', ''),
      f('Enemy', 'new Ammo()'),
      f('Main', 'new Enemy()'),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Ammo', 'Enemy', 'Main']);
  });

  test('tiebreaker — independent files keep relative original order', () => {
    // A and B have no constraints; C depends on D
    const { files, error } = sortByDependencies([
      f('A', ''),
      f('B', ''),
      f('C', 'new D()'),
      f('D', ''),
    ]);
    expect(error).toBeUndefined();
    const names = files.map((x) => x.name);
    expect(names.indexOf('D')).toBeLessThan(names.indexOf('C'));
    expect(names.indexOf('A')).toBeLessThan(names.indexOf('B'));
  });

  test('circular dependency — returns error string, original files unchanged', () => {
    const input = [f('A', 'new B()'), f('B', 'new A()')];
    const { error } = sortByDependencies(input);
    expect(error).toBeDefined();
    expect(error).toContain('Circular dependency');
  });

  test('case-insensitive matching', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'dim e as Enemy()'),
      f('Enemy', ''),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Enemy', 'Main']);
  });

  test('comment containing another file name is not a dependency', () => {
    // Enemy.bas has "dim a as Ammo" (real dep).
    // Ammo.bas has "' enemy ammo" in a comment — must NOT create a false Ammo→Enemy edge.
    const { files, error } = sortByDependencies([
      f('Enemy', "dim a as Ammo\n' loads ammo objects"),
      f('Ammo', "' enemy ammo\ndim b as ammoRemaining"),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Ammo', 'Enemy']);
  });

  test('plain variable name matching a file name is not a dependency', () => {
    // Ammo.bas declares "dim enemy" — a plain untyped variable, not a type reference.
    // Must NOT create a false Ammo→Enemy edge that produces a phantom cycle.
    const { files, error } = sortByDependencies([
      f('Enemy', 'dim a as Ammo'),
      f('Ammo', 'dim enemy\nenemy = 5'),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Ammo', 'Enemy']);
  });

  test('.bas extension in filename — dependency still detected', () => {
    // In production, ProjectFile.name carries the .bas extension ("Enemy.bas").
    // The sort must strip it before pattern matching so "new Enemy()" still resolves.
    const { files, error } = sortByDependencies([
      { name: 'Main.bas', source: 'new Enemy()' },
      { name: 'Enemy.bas', source: '' },
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Enemy.bas', 'Main.bas']);
  });
});
