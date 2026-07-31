import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const mathSource = readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8');

test('show math output', () => {
  const result = compiler.transpile({
    lib: [{ name: 'math', source: mathSource }],
    files: [{ name: 'Main', source: 'function onenter()\n  dim x = math.floor(3.5)\nendfunction' }],
  });
  console.log('CODE:', result.code?.substring(0, 600));
});
