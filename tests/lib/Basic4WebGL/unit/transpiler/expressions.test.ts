import { describe, test, expect } from 'vitest';
import { node } from '@CompilerLib/tree';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import '@Basic4WebGL/transpilerRules';

import AddRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/AddRule';
import SubtractRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/SubtractRule';
import MultiplyRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/MultiplyRule';
import DivideRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/DivideRule';
import BoolEqualRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BoolEqualRule';
import BoolNotEqualRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BoolNotEqualRule';
import BoolLessThanRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BoolLessThanRule';
import BoolGreaterThanRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BoolGreaterThanRule';
import BoolLessThanEqualToRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BoolLessThanEqualToRule';
import BoolGreaterThanEqualToRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/BoolGreaterThanEqualToRule';
import AndRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/AndRule';
import OrRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/OrRule';
import NotRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/NotRule';
import ParenRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/ParenRule';
import ExpressionRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/ExpressionRule';
import PrintRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/PrintRule';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const term = (v: string) => node(nodeTypes.Term, v);
const bin = (type: number, l = '2', r = '3') => node(type, null, [term(l), term(r)]);

// ─── Arithmetic ───────────────────────────────────────────────────────────────

describe('arithmetic rules', () => {
  test('Add generates +', () => {
    expect(new AddRule().generate(bin(nodeTypes.Add), undefined)).toBe('2+3');
  });

  test('Subtract generates -', () => {
    expect(new SubtractRule().generate(bin(nodeTypes.Subtract), undefined)).toBe('2-3');
  });

  test('Multiply generates *', () => {
    expect(new MultiplyRule().generate(bin(nodeTypes.Multiply), undefined)).toBe('2*3');
  });

  test('Divide generates /', () => {
    expect(new DivideRule().generate(bin(nodeTypes.Divide), undefined)).toBe('2/3');
  });

  test('operators are not commutative — left and right operands are preserved', () => {
    expect(new SubtractRule().generate(bin(nodeTypes.Subtract, '10', '3'), undefined)).toBe('10-3');
  });
});

// ─── Comparison operators ─────────────────────────────────────────────────────

describe('comparison rules', () => {
  test('Equals generates ==', () => {
    expect(new BoolEqualRule().generate(bin(nodeTypes.Equals), undefined)).toBe('2 == 3');
  });

  test('NotEquals generates !=', () => {
    expect(new BoolNotEqualRule().generate(bin(nodeTypes.NotEquals), undefined)).toBe('2 != 3');
  });

  test('LessThan generates <', () => {
    expect(new BoolLessThanRule().generate(bin(nodeTypes.LessThan), undefined)).toBe('2 < 3');
  });

  test('GreaterThan generates >', () => {
    expect(new BoolGreaterThanRule().generate(bin(nodeTypes.GreaterThan), undefined)).toBe('2 > 3');
  });

  test('LessThanEqualTo generates <=', () => {
    expect(new BoolLessThanEqualToRule().generate(bin(nodeTypes.LessThanEqualTo), undefined)).toBe('2 <= 3');
  });

  test('GreaterThanEqualTo generates >=', () => {
    expect(new BoolGreaterThanEqualToRule().generate(bin(nodeTypes.GreaterThanEqualTo), undefined)).toBe('2 >= 3');
  });
});

// ─── Logical operators ────────────────────────────────────────────────────────

describe('logical rules', () => {
  const eq = (l: string, r: string) => bin(nodeTypes.Equals, l, r);

  test('And generates &&', () => {
    const andNode = node(nodeTypes.And, null, [eq('1', '1'), eq('2', '2')]);
    expect(new AndRule().generate(andNode, undefined)).toBe('1 == 1 && 2 == 2');
  });

  test('Or generates ||', () => {
    const orNode = node(nodeTypes.Or, null, [eq('1', '1'), eq('2', '2')]);
    expect(new OrRule().generate(orNode, undefined)).toBe('1 == 1 || 2 == 2');
  });

  test('Not wraps child in !()', () => {
    const notNode = node(nodeTypes.Not, null, [eq('1', '1')]);
    expect(new NotRule().generate(notNode, undefined)).toBe('!(1 == 1)');
  });
});

// ─── Grouping ─────────────────────────────────────────────────────────────────

describe('Paren rule', () => {
  test('wraps child in parentheses', () => {
    const parenNode = node(nodeTypes.Paren, null, [term('5')]);
    expect(new ParenRule().generate(parenNode, undefined)).toBe('(5)');
  });

  test('preserves nested expressions', () => {
    const inner = node(nodeTypes.Add, null, [term('2'), term('3')]);
    const parenNode = node(nodeTypes.Paren, null, [inner]);
    expect(new ParenRule().generate(parenNode, undefined)).toBe('(2+3)');
  });
});

// ─── Pass-throughs ────────────────────────────────────────────────────────────

describe('Expression rule', () => {
  test('passes through its single child', () => {
    const exprNode = node(nodeTypes.Expression, null, [term('42')]);
    expect(new ExpressionRule().generate(exprNode, undefined)).toBe('42');
  });
});

// ─── Print ────────────────────────────────────────────────────────────────────

describe('Print rule', () => {
  test('wraps child in _print()', () => {
    const printNode = node(nodeTypes.Print, null, [term('42')]);
    expect(new PrintRule().generate(printNode, undefined)).toBe('_print(42)');
  });

  test('works with an expression child', () => {
    const printNode = node(nodeTypes.Print, null, [bin(nodeTypes.Add)]);
    expect(new PrintRule().generate(printNode, undefined)).toBe('_print(2+3)');
  });

  test('works with a string literal', () => {
    const printNode = node(nodeTypes.Print, null, [term('"hello"')]);
    expect(new PrintRule().generate(printNode, undefined)).toBe('_print("hello")');
  });
});
