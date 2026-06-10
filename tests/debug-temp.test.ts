import { test } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

test('debug truthy if', () => {
  const result = compiler.transpile({
    lib: [],
    files: [{ name: 'Main.bas', source: [
      'function check(n)',
      '  return n > 0',
      'endfunction',
      'function test()',
      '  if check(37)',
      '    print "key"',
      '  endif',
      'endfunction',
    ].join('\n') }],
  });
  console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics));
  console.log('CODE:', result.code?.substring(0, 200));
});
