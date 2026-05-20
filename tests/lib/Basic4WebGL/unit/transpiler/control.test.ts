import { describe, test, expect } from 'vitest';
import { node } from '@CompilerLib/tree';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import '@Basic4WebGL/transpilerRules';

import BlockRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BlockRule';
import IfRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/IfRule';
import WhileRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/WhileRule';
import PrintRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/PrintRule';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const term = (v: string) => node(nodeTypes.Term, v);
const eq = (l: string, r: string) => node(nodeTypes.Equals, null, [term(l), term(r)]);
const emptyBlock = () => node(nodeTypes.Block, null, []);
const printBlock = (v: string) =>
  node(nodeTypes.Block, null, [node(nodeTypes.Print, null, [term(v)])]);

// ─── Block ────────────────────────────────────────────────────────────────────

describe('Block rule', () => {
  test('empty block generates empty string', () => {
    expect(new BlockRule().generate(emptyBlock(), undefined)).toBe('');
  });

  test('single child block generates that child', () => {
    const result = new BlockRule().generate(printBlock('42'), undefined);
    expect(result).toContain('_print(42)');
  });

  test('multiple children are all generated', () => {
    const block = node(nodeTypes.Block, null, [
      node(nodeTypes.Print, null, [term('"first"')]),
      node(nodeTypes.Print, null, [term('"second"')]),
    ]);
    const result = new BlockRule().generate(block, undefined);
    expect(result).toContain('_print("first")');
    expect(result).toContain('_print("second")');
  });
});

// ─── If ───────────────────────────────────────────────────────────────────────

describe('If rule', () => {
  test('generates if(condition){body}', () => {
    const ifNode = node(nodeTypes.If, null, [eq('1', '1'), emptyBlock()]);
    expect(new IfRule().generate(ifNode, undefined)).toBe('if(1 == 1){}');
  });

  test('body is included in the output', () => {
    const ifNode = node(nodeTypes.If, null, [eq('1', '1'), printBlock('"yes"')]);
    const result = new IfRule().generate(ifNode, undefined);
    expect(result).toContain('if(1 == 1){');
    expect(result).toContain('_print("yes")');
  });

  test('condition is evaluated correctly', () => {
    const ifNode = node(nodeTypes.If, null, [eq('5', '10'), emptyBlock()]);
    expect(new IfRule().generate(ifNode, undefined)).toBe('if(5 == 10){}');
  });
});

// ─── While ────────────────────────────────────────────────────────────────────

describe('While rule', () => {
  test('generates while(condition){body}', () => {
    const whileNode = node(nodeTypes.While, null, [eq('1', '1'), emptyBlock()]);
    expect(new WhileRule().generate(whileNode, undefined)).toBe('while(1 == 1){}');
  });

  test('body is included in the output', () => {
    const whileNode = node(nodeTypes.While, null, [eq('1', '1'), printBlock('"looping"')]);
    const result = new WhileRule().generate(whileNode, undefined);
    expect(result).toContain('while(1 == 1){');
    expect(result).toContain('_print("looping")');
  });
});
