import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../../src/constants/packageModules';

// Roadmap #35: a `dim`-declared array or dict FIELD in a class body was
// initialised once on the class prototype, so two live instances of the same
// class shared one array/dict object. The fix moves the array/dict/typed-array
// initialiser into the constructor (`this.x = _createArray(...)`), per instance.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function build(files: { name: string; source: string }[]) {
  const { files: sorted, error } = sortByDependencies(files);
  expect(error).toBeUndefined();
  const r = compiler.transpile({ lib, files: sorted });
  expect(r.diagnostics).toEqual([]);
  return String(r.code);
}

function evalMod(code: string, exportsExpr: string) {
  const deferred: Array<() => void> = [];
  const _sb: Record<string, unknown> = {
    _deferModuleBody: (cb: () => void) => deferred.push(cb),
  };
  const _createArray = (init: unknown[]) =>
    Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])];
  const _createDict = () => new Map();
  const _createTypedArray = (sizes: number[], fill: () => unknown) =>
    Array.from({ length: sizes[0] ?? 0 }, () => fill());
  const helpers: Record<string, unknown> = {
    _createDict,
    _createTypedArray,
    _sbArrLength: (x: unknown[]) => x.length,
    _sbPush: (x: unknown[], v: unknown) => x.push(v),
    _sbDictSet: (m: Map<unknown, unknown>, k: unknown, v: unknown) => m.set(k, v),
    _sbDictGet: (m: Map<unknown, unknown>, k: unknown) => m.get(k),
    _sbDictCount: (m: Map<unknown, unknown>) => m.size,
  };
  const factory = new Function(
    '_sb',
    '_createArray',
    ...Object.keys(helpers),
    `${code}\n; return (${exportsExpr});`,
  );
  const out = factory(_sb, _createArray, ...Object.values(helpers));
  deferred.forEach((cb) => cb());
  return out;
}

describe('class array/dict fields are per-instance (#35)', () => {
  test('array field: two instances do not share the array', () => {
    const bag = [
      'Class',
      'dim items(0)',
      'dim scalarSeen',
      'Constructor(seed)',
      '    self.scalarSeen = seed',
      '    array.push(self.items, seed)',
      'EndConstructor',
      'function count()',
      '    return array.arrLength(self.items)',
      'endfunction',
      'function seen()',
      '    return self.scalarSeen',
      'endfunction',
      'EndClass',
    ].join('\n');
    const main = ['dim b1 = new Bag(1)', 'dim b2 = new Bag(2)'].join('\n');
    const code = build([
      { name: 'Bag.bas', source: bag },
      { name: 'Main.bas', source: main },
    ]);
    const Bag = evalMod(code, "typeof _sb_bag !== 'undefined' ? _sb_bag : null");
    const b1 = new Bag(1);
    const b2 = new Bag(2);
    expect(b1.count()).toBe(1);
    expect(b2.count()).toBe(1);
    expect(b1.seen()).toBe(1);
    expect(b2.seen()).toBe(2);
    expect(b1.items).not.toBe(b2.items);
  });

  test('dict field: two instances do not share the dict', () => {
    const bag = [
      'Class',
      'dim d[]',
      'Constructor(key)',
      '    self.d[key] = 1',
      'EndConstructor',
      'function size()',
      '    return array.arrLength(dict.keys(self.d))',
      'endfunction',
      'EndClass',
    ].join('\n');
    const main = ['dim b1 = new Store("a")', 'dim b2 = new Store("b")'].join('\n');
    const code = build([
      { name: 'Store.bas', source: bag },
      { name: 'Main.bas', source: main },
    ]);
    const Store = evalMod(code, "typeof _sb_store !== 'undefined' ? _sb_store : null");
    const s1 = new Store('a');
    const s2 = new Store('b');
    expect(s1.size()).toBe(1);
    expect(s2.size()).toBe(1);
  });

  test('no explicit constructor: array field still per-instance', () => {
    const bag = [
      'Class',
      'dim items(0)',
      'function add(v)',
      '    array.push(self.items, v)',
      'endfunction',
      'function count()',
      '    return array.arrLength(self.items)',
      'endfunction',
      'EndClass',
    ].join('\n');
    const main = ['dim b1 = new Sack()'].join('\n');
    const code = build([
      { name: 'Sack.bas', source: bag },
      { name: 'Main.bas', source: main },
    ]);
    const Sack = evalMod(code, "typeof _sb_sack !== 'undefined' ? _sb_sack : null");
    const a = new Sack();
    const b = new Sack();
    a.add(1);
    a.add(2);
    expect(a.count()).toBe(2);
    expect(b.count()).toBe(0);
  });

  test('Extends: own and inherited array fields are per-instance', () => {
    const animal = [
      'Class',
      'dim sounds(0)',
      'Constructor()',
      '    array.push(self.sounds, "generic")',
      'EndConstructor',
      'function soundcount()',
      '    return array.arrLength(self.sounds)',
      'endfunction',
      'EndClass',
    ].join('\n');
    const dog = [
      'Class',
      'Extends Animal',
      'dim tricks(0)',
      'Constructor()',
      '    array.push(self.tricks, "sit")',
      'EndConstructor',
      'function trickcount()',
      '    return array.arrLength(self.tricks)',
      'endfunction',
      'EndClass',
    ].join('\n');
    const main = ['dim d1 = new Dog()'].join('\n');
    const code = build([
      { name: 'Animal.bas', source: animal },
      { name: 'Dog.bas', source: dog },
      { name: 'Main.bas', source: main },
    ]);
    const Dog = evalMod(code, "typeof _sb_dog !== 'undefined' ? _sb_dog : null");
    const d1 = new Dog();
    const d2 = new Dog();
    expect(d1.soundcount()).toBe(1);
    expect(d1.trickcount()).toBe(1);
    expect(d2.soundcount()).toBe(1);
    expect(d2.trickcount()).toBe(1);
  });
});
