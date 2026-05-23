import { test, expect, describe } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'classComposition';

const keyFile = { name: 'Key', source: loadSampleFile('Key', folder) };
const carFile = { name: 'Car', source: loadSampleFile('Car', folder) };
const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };

// Helper: compile and assert no diagnostics, return cleaned code
function compileOk(project: CompilerProject): string {
  const result = compiler.transpile(project);
  const errorMessages = result.diagnostics.map((d) => d.message).join('; ');
  expect(errorMessages, `compile errors: ${errorMessages}`).toBe('');
  expect(result.code).toBeDefined();
  return cleanWhitespace(result.code!);
}

// ---------------------------------------------------------------------------
// Level 1: dim x as Type  →  x = new Type()
// ---------------------------------------------------------------------------
describe('typed dim (dim x as Type)', () => {
  test('dim x as Type produces new Type() instantiation', () => {
    const src = `function onenter()\n    dim myCar as Car\nendfunction`;
    const result = compileOk({
      lib: [],
      files: [keyFile, carFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('onenter_mycar=newcar()');
  });
});

// ---------------------------------------------------------------------------
// Level 2: obj.prop = val  →  instance property write
// ---------------------------------------------------------------------------
describe('object property write (obj.prop = val)', () => {
  test('property write produces correct assignment', () => {
    const src = [
      'function onenter()',
      '    dim myCar as Car',
      '    dim myKey as Key',
      '    myCar.carKey = myKey',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [keyFile, carFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('onenter_myCar.carKey=onenter_myKey');
  });
});

// ---------------------------------------------------------------------------
// Level 3: obj.prop as rvalue  →  instance property read
// ---------------------------------------------------------------------------
describe('object property read (obj.prop as rvalue)', () => {
  test('property read compiles and appears correctly as rvalue', () => {
    const src = [
      'function onenter()',
      '    dim myCar as Car',
      '    dim result as Key',
      '    result = myCar.carKey',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [keyFile, carFile, { name: 'Main', source: src }],
    });
    expect(result).toContain('onenter_result=onenter_myCar.carKey');
  });
});

// ---------------------------------------------------------------------------
// Level 4: obj.prop.subprop  →  nested property access
// ---------------------------------------------------------------------------
describe('nested property access (obj.prop.subprop)', () => {
  test('nested property write produces correct assignment', () => {
    const result = compileOk({
      lib: [],
      files: [keyFile, carFile, mainFile],
    });
    expect(result).toContain('onenter_myCar.carKey.keyless=1');
  });
});
