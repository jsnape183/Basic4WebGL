import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const mathSource = readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8');

test('show math full output', () => {
  const result = compiler.transpile({
    lib: [{ name: 'math', source: mathSource }],
    files: [{ name: 'Main', source: 'function onenter()\n  dim x = math.floor(3.5)\nendfunction' }],
  });
  // print start of code
  const code = result.code ?? '';
  console.log('FIRST 200:', JSON.stringify(code.substring(0, 200)));
  // find where math.floor call appears
  const idx = code.indexOf('math.floor(3');
  console.log('floor call at', idx, ':', JSON.stringify(code.substring(Math.max(0,idx-50), idx+80)));
  // check for any 'const math' or 'var math' or 'let math'
  const mathDecl = code.indexOf('math = ');
  console.log('math = at', mathDecl, ':', JSON.stringify(code.substring(Math.max(0,mathDecl-20), mathDecl+40)));
});
