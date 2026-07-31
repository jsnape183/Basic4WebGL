import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const mathSource = readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8');

test('math output executability', () => {
  const result = compiler.transpile({
    lib: [{ name: 'math', source: mathSource }],
    files: [{ name: 'Main', source: 'function onenter()\n  dim x = math.floor(3.5)\nendfunction' }],
  });
  const code = result.code ?? '';
  // Try executing in a Function context (like browser would)
  try {
    const fn = new Function('_sb', '_createArray', '_createDict', '_print', code + '\n return {math, main};');
    const stub_sb = { _sbClasses: [] };
    const ns = fn(stub_sb, () => [], () => new Map(), console.log);
    console.log('math type:', typeof ns.math);
    console.log('math.floor type:', typeof ns.math?.floor);
    const r = ns.math?.floor(3.5);
    console.log('math.floor(3.5)=', r);
  } catch(e: any) {
    console.log('ERROR:', e.message);
  }
});
