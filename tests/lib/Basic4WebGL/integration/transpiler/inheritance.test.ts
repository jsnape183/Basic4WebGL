import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, compileOk } from '../../helpers';

function compileErr(src: string, name = 'Test'): string {
  const result = compiler.transpile({ lib: [], files: [{ name, source: src }] });
  return result.diagnostics.map((d) => d.message).join('; ');
}

// ── class X extends Y — output ──────────────────────────────────────────────

describe('class extends — transpiler output', () => {
  test.todo('class with extends emits class Boss extends Enemy — requires Tasks 4 and 6');

  test('class without extends still emits class X {}', () => {
    const src = ['Class Enemy', 'dim health'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Enemy', source: src }] });
    expect(result).toContain('classenemy{');
    expect(result).not.toContain('extends');
  });
});

// ── compile errors — extends ─────────────────────────────────────────────────

describe('class extends — compile errors', () => {
  test('extending an unknown class throws compile error', () => {
    const src = 'Class Boss extends Unknown';
    const err = compileErr(src, 'Boss');
    expect(err).toMatch(/unknown.*has not been declared/i);
  });

  test('chained inheritance throws compile error', () => {
    const enemySrc = 'Class Enemy';
    const bossSrc = 'Class Boss extends Enemy';
    const minibossSrc = 'Class MiniBoss extends Boss';
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Enemy', source: enemySrc },
        { name: 'Boss', source: bossSrc },
        { name: 'MiniBoss', source: minibossSrc },
      ],
    });
    expect(result.diagnostics[0].message).toMatch(/already extends.*cannot be chained/i);
  });
});
