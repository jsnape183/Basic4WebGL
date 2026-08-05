import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Roadmap deferred issue #14(c): chaining a method/property access onto an
// element read out of a `self` TYPED array field — `self.bullets(0).getX()`
// — failed to parse ("Expected NewLine,EndOfFile,SoftNewLine got Dot").
// TypedElementAccessNode/Rule already implement exactly this shape for
// ordinary non-self arrays (see typed-collections.test.ts); this wires the
// same node into the self path, in both expression (SelfFactorRule) and
// statement (SelfRule) context.
//
// Scope: self only. Chaining a call onto a typed element read through an
// *external* instance (someInstance.bullets(0).getX()) is a related but
// separate follow-on, not one of the three reported shapes — see the plan
// doc's Architecture note.
// ---------------------------------------------------------------------------

const bulletFile = {
  name: 'Bullet',
  source: [
    'Class',
    '  dim x',
    '  function getX()',
    '    return self.x',
    '  endfunction',
    '  function explode()',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

const shipFile = {
  name: 'Ship',
  source: [
    'Class',
    '  dim bullets(3) as Bullet',
    '  dim coins(0)',
    '',
    '  function getFirstBulletX()',
    '    return self.bullets(0).getX()',
    '  endfunction',
    '',
    '  function explodeFirst()',
    '    self.bullets(0).explode()',
    '  endfunction',
    '',
    '  function readCoin()',
    '    dim v',
    '    v = self.coins(0)',
    '    return v',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

const transpileWith = (
  files: { name: string; source: string }[],
  mainSource: string
) =>
  compiler.transpile({
    lib: [],
    files: [...files, { name: 'Main', source: mainSource }],
  });

describe('self typed-array element — chained call (expression context)', () => {
  test('self.bullets(0).getX() used as a return value', () => {
    const result = transpileWith([bulletFile, shipFile], 'dim s as Ship()');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(this.bullets[0],"bullets(0)").getx()'
    );
  });

  test('does not affect an existing self.coins(0) plain array read (issue #13)', () => {
    const result = transpileWith([bulletFile, shipFile], 'dim s as Ship()');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('this.coins[0]');
  });
});

describe('self typed-array element — chained call (statement context)', () => {
  test('self.bullets(0).explode() as a bare statement', () => {
    const result = transpileWith([bulletFile, shipFile], 'dim s as Ship()');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(this.bullets[0],"bullets(0)").explode();'
    );
  });
});

describe('non-self typed-array chaining — unaffected by the TypedElementAccessRule change', () => {
  test('bullets(0).getX() outside a class still resolves via collectionSymbol', () => {
    const result = transpileWith(
      [bulletFile],
      ['dim bullets(3) as Bullet', 'print bullets(0).getX()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(main.bullets[0],"bullets(0)").getx()'
    );
  });
});
