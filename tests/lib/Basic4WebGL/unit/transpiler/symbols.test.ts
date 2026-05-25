import { describe, test, expect } from 'vitest';
import { node } from '@CompilerLib/tree';
import BuiltInType from '@CompilerLib/builtInTypes';
import { Symbol, SymbolScope } from '@CompilerLib/symbols';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import '@Basic4WebGL/transpilerRules';

import AssignRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/AssignRule';
import DimRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/DimRule';
import VariableDimRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableDimRule';
import TermRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/TermRule';
import ToRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/ToRule';
import ForRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/ForRule';
import FunctionDeclRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionDeclRule';
import FunctionCallRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionCallRule';
import FunctionReturnRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionReturnRule';
import FunctionTermRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/FunctionTermRule';
import VariableListRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/VariableListRule';
import ExpressionListRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/ExpressionListRule';
import PropertyMethodCallRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodCallRule';
import PropertyMethodTermRule from '@Basic4WebGL/transpilerRules/jsRules/ruleSets/PropertyMethodTermRule';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const variant = new BuiltInType('Variant');

const varSym = (name: string, scopeName = 'main', fullScope = 'main') =>
  new Symbol(name, 'Variable', new SymbolScope(scopeName, 'Module'), fullScope, variant);

const fnSym = (name: string, scopeName = 'main', fullScope = 'main') =>
  new Symbol(name, 'Function', new SymbolScope(scopeName, 'Module'), fullScope, variant);

const paramSym = (name: string, fnName: string) =>
  new Symbol(name, 'Parameter', new SymbolScope(fnName, 'Function'), `main.${fnName}`, variant);

const term = (v: string) => node(nodeTypes.Term, v);
const emptyBlock = () => node(nodeTypes.Block, null, []);
const emptyList = (type: number) => node(type, null, []);

// ─── Term (symbol data) ───────────────────────────────────────────────────────

describe('Term rule — symbol data', () => {
  test('module-scoped variable formats as scope.name', () => {
    const t = node(nodeTypes.Term, varSym('x'));
    expect(new TermRule().generate(t, undefined)).toBe('main.x');
  });

  test('parameter formats as functionName_paramName', () => {
    const t = node(nodeTypes.Term, paramSym('count', 'greet'));
    expect(new TermRule().generate(t, undefined)).toBe('greet_count');
  });

  test('function symbol formats as fullScope.name', () => {
    const t = node(nodeTypes.Term, fnSym('greet'));
    expect(new TermRule().generate(t, undefined)).toBe('main.greet');
  });
});

// ─── VariableDim ──────────────────────────────────────────────────────────────

describe('VariableDim rule', () => {
  test('module-scoped variable generates scope.name = undefined', () => {
    const vd = node(nodeTypes.VariableDim, varSym('x'), []);
    expect(new VariableDimRule().generate(vd, undefined)).toBe('main.x = undefined;');
  });
});

// ─── Assign ───────────────────────────────────────────────────────────────────

describe('Assign rule', () => {
  test('assigns a literal value', () => {
    const a = node(nodeTypes.Assign, varSym('x'), [term('5')]);
    expect(new AssignRule().generate(a, undefined)).toBe('main.x = 5;');
  });

  test('assigns a string literal', () => {
    const a = node(nodeTypes.Assign, varSym('msg'), [term('"hello"')]);
    expect(new AssignRule().generate(a, undefined)).toBe('main.msg = "hello";');
  });

  test('assigns to a differently-named variable', () => {
    const a = node(nodeTypes.Assign, varSym('counter', 'main'), [term('0')]);
    expect(new AssignRule().generate(a, undefined)).toBe('main.counter = 0;');
  });
});

// ─── Dim ──────────────────────────────────────────────────────────────────────

describe('Dim rule', () => {
  test('generates let with _createArray wrapper', () => {
    const d = node(nodeTypes.Dim, varSym('x'), [emptyList(nodeTypes.VariableList)]);
    expect(new DimRule().generate(d, undefined)).toBe('let main.x = _createArray([]);');
  });
});

// ─── VariableList / ExpressionList ───────────────────────────────────────────

describe('VariableList rule', () => {
  test('empty list generates empty string', () => {
    expect(new VariableListRule().generate(emptyList(nodeTypes.VariableList), undefined)).toBe('');
  });

  test('single parameter is emitted without a comma', () => {
    const p = node(nodeTypes.Term, paramSym('n', 'greet'));
    const list = node(nodeTypes.VariableList, null, [p]);
    expect(new VariableListRule().generate(list, undefined)).toBe('greet_n');
  });

  test('multiple parameters are comma-separated', () => {
    const p1 = node(nodeTypes.Term, paramSym('a', 'add'));
    const p2 = node(nodeTypes.Term, paramSym('b', 'add'));
    const list = node(nodeTypes.VariableList, null, [p1, p2]);
    expect(new VariableListRule().generate(list, undefined)).toBe('add_a,add_b');
  });
});

describe('ExpressionList rule', () => {
  test('empty list generates empty string', () => {
    expect(new ExpressionListRule().generate(emptyList(nodeTypes.ExpressionList), undefined)).toBe('');
  });

  test('single argument is emitted without a comma', () => {
    const list = node(nodeTypes.ExpressionList, null, [term('42')]);
    expect(new ExpressionListRule().generate(list, undefined)).toBe('42');
  });

  test('multiple arguments are comma-separated', () => {
    const list = node(nodeTypes.ExpressionList, null, [term('1'), term('2'), term('3')]);
    expect(new ExpressionListRule().generate(list, undefined)).toBe('1,2,3');
  });
});

// ─── To / For ────────────────────────────────────────────────────────────────

describe('To rule', () => {
  test('generates for-loop initialiser, condition, and increment', () => {
    const to = node(nodeTypes.To, varSym('i'), [term('0'), term('9')]);
    expect(new ToRule().generate(to, undefined)).toBe('main.i = 0; main.i <= 9; main.i++');
  });
});

describe('For rule', () => {
  test('wraps To and body in for(){} structure', () => {
    const to = node(nodeTypes.To, varSym('i'), [term('0'), term('4')]);
    const forNode = node(nodeTypes.For, null, [to, emptyBlock()]);
    expect(new ForRule().generate(forNode, undefined)).toBe('for(main.i = 0; main.i <= 4; main.i++){}');
  });
});

// ─── Function rules ───────────────────────────────────────────────────────────

describe('FunctionReturn rule', () => {
  test('wraps child in return statement', () => {
    const ret = node(nodeTypes.FunctionReturn, null, [term('42')]);
    expect(new FunctionReturnRule().generate(ret, undefined)).toBe('return 42;');
  });

  test('works with a string literal', () => {
    const ret = node(nodeTypes.FunctionReturn, null, [term('"done"')]);
    expect(new FunctionReturnRule().generate(ret, undefined)).toBe('return "done";');
  });
});

describe('FunctionCall rule', () => {
  test('generates scope.name() with no args', () => {
    const call = node(nodeTypes.FunctionCall, fnSym('greet'), [emptyList(nodeTypes.ExpressionList)]);
    expect(new FunctionCallRule().generate(call, undefined)).toBe('main.greet();');
  });

  test('passes arguments through expression list', () => {
    const args = node(nodeTypes.ExpressionList, null, [term('1'), term('2')]);
    const call = node(nodeTypes.FunctionCall, fnSym('add'), [args]);
    expect(new FunctionCallRule().generate(call, undefined)).toBe('main.add(1,2);');
  });
});

describe('FunctionTerm rule', () => {
  test('generates scope.name() as expression — no semicolon (FunctionCallRule adds ; for statements)', () => {
    const call = node(nodeTypes.FunctionTerm, fnSym('greet'), [emptyList(nodeTypes.ExpressionList)]);
    expect(new FunctionTermRule().generate(call, undefined)).toBe('main.greet()');
  });
});

// ─── PropertyMethodCall / PropertyMethodTerm ─────────────────────────────────

describe('PropertyMethodCallRule', () => {
  test('emits chain(args); with semicolon', () => {
    const args = node(nodeTypes.ExpressionList, null, []);
    const n = node(nodeTypes.PropertyMethodCall, 'onenter_bunny.transform.setposition', [args]);
    expect(new PropertyMethodCallRule().generate(n, undefined)).toBe(
      'onenter_bunny.transform.setposition();'
    );
  });

  test('emits chain with populated args', () => {
    const args = node(nodeTypes.ExpressionList, null, [term('100'), term('200')]);
    const n = node(nodeTypes.PropertyMethodCall, 'onenter_bunny.transform.setposition', [args]);
    expect(new PropertyMethodCallRule().generate(n, undefined)).toBe(
      'onenter_bunny.transform.setposition(100,200);'
    );
  });
});

describe('PropertyMethodTermRule', () => {
  test('emits chain(args) without semicolon', () => {
    const args = node(nodeTypes.ExpressionList, null, []);
    const n = node(nodeTypes.PropertyMethodTerm, 'onenter_bunny.transform.x', [args]);
    expect(new PropertyMethodTermRule().generate(n, undefined)).toBe(
      'onenter_bunny.transform.x()'
    );
  });
});

describe('FunctionDecl rule', () => {
  test('generates arrow function with no params and empty body', () => {
    const fn = node(nodeTypes.FunctionDecl, fnSym('greet'), [
      emptyList(nodeTypes.VariableList),
      emptyBlock(),
    ]);
    const result = new FunctionDeclRule().generate(fn, undefined);
    expect(result).toContain('main.greet = () =>');
  });

  test('params are forwarded into the arrow function signature', () => {
    const params = node(nodeTypes.VariableList, null, [
      node(nodeTypes.Term, paramSym('n', 'double')),
    ]);
    const fn = node(nodeTypes.FunctionDecl, fnSym('double'), [params, emptyBlock()]);
    const result = new FunctionDeclRule().generate(fn, undefined);
    expect(result).toContain('(double_n)');
  });
});
