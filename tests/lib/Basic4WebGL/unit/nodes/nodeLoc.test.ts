import { describe, test, expect } from 'vitest';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import BuiltInType from '@CompilerLib/builtInTypes';
import { Tree } from '@CompilerLib/tree';
import PrintNode from '@Basic4WebGL/nodes/PrintNode';
import AddNode from '@Basic4WebGL/nodes/AddNode';
import IfNode from '@Basic4WebGL/nodes/IfNode';
import { NumberNode } from '@Basic4WebGL/nodes/NumberNode';
import StringNode from '@Basic4WebGL/nodes/StringNode';
import EmptyNode from '@Basic4WebGL/nodes/EmptyNode';

const loc: SourceLocation = { line: 10, col: 3, filename: 'test.bas' };

const makeChild = () => {
  const t = new Tree(0, null, []);
  t.dataType = new BuiltInType('Variant');
  return t;
};

describe('Direct Tree subclasses store loc', () => {
  test('PrintNode stores loc', () => {
    const n = new PrintNode(null, makeChild(), loc);
    expect(n.loc).toEqual(loc);
  });

  test('PrintNode loc is undefined when omitted', () => {
    const n = new PrintNode(null, makeChild());
    expect(n.loc).toBeUndefined();
  });

  test('EmptyNode stores loc', () => {
    const n = new EmptyNode(loc);
    expect(n.loc).toEqual(loc);
  });

  test('StringNode stores loc', () => {
    const n = new StringNode('hello', loc);
    expect(n.loc).toEqual(loc);
  });

  test('NumberNode stores loc', () => {
    const n = new NumberNode('42', loc);
    expect(n.loc).toEqual(loc);
  });
});

describe('BaseArithmaticValidatorNode subclasses store loc', () => {
  test('AddNode stores loc', () => {
    const child = makeChild();
    const n = new AddNode(null, [child, child], loc);
    expect(n.loc).toEqual(loc);
  });

  test('AddNode loc is undefined when omitted', () => {
    const child = makeChild();
    const n = new AddNode(null, [child, child]);
    expect(n.loc).toBeUndefined();
  });
});

describe('BaseConditionalValidatorNode subclasses store loc', () => {
  test('IfNode stores loc', () => {
    const child = makeChild();
    const n = new IfNode(null, [child, child], loc);
    expect(n.loc).toEqual(loc);
  });

  test('IfNode loc is undefined when omitted', () => {
    const child = makeChild();
    const n = new IfNode(null, [child, child]);
    expect(n.loc).toBeUndefined();
  });
});

import '@Basic4WebGL/builtInTypes'; // registers Boolean and other built-in types
import { SemanticTypeError } from '@CompilerLib/errors';

describe('Validator nodes attach loc to thrown SemanticTypeError', () => {
  test('AddNode.validate() throws SemanticTypeError carrying this.loc', () => {
    const wrongType = new BuiltInType('String');
    const intType = new BuiltInType('Integer');
    (intType as any).acceptsTypes = ['Integer'];
    (intType as any).canAccept = (t: BuiltInType) => t.name === 'Integer';

    const child = new Tree(0, null, []);
    child.dataType = wrongType;

    const n = new AddNode(null, [child, child], loc);
    (n as any).dataType = intType;

    let caught: SemanticTypeError | undefined;
    try { n.validate(); } catch (e) { caught = e as SemanticTypeError; }
    expect(caught).toBeInstanceOf(SemanticTypeError);
    expect(caught?.loc).toEqual(loc);
  });

  test('AddNode.validate() SemanticTypeError has no loc when node has no loc', () => {
    const wrongType = new BuiltInType('String');
    const intType = new BuiltInType('Integer');
    (intType as any).acceptsTypes = ['Integer'];
    (intType as any).canAccept = (t: BuiltInType) => t.name === 'Integer';

    const child = new Tree(0, null, []);
    child.dataType = wrongType;

    const n = new AddNode(null, [child, child]);
    (n as any).dataType = intType;

    let caught: SemanticTypeError | undefined;
    try { n.validate(); } catch (e) { caught = e as SemanticTypeError; }
    expect(caught?.loc).toBeUndefined();
  });
});

describe('IfNode validates condition is Boolean type', () => {
  test('IfNode.validate() throws SemanticTypeError carrying this.loc', () => {
    const nonBoolChild = new Tree(0, null, []);
    nonBoolChild.dataType = new BuiltInType('Object'); // not in Boolean acceptsTypes

    const block = new Tree(0, null, []);
    block.dataType = new BuiltInType('Variant');

    const n = new IfNode(null, [nonBoolChild, block], loc);

    let caught: SemanticTypeError | undefined;
    try { n.validate(); } catch (e) { caught = e as SemanticTypeError; }
    expect(caught).toBeInstanceOf(SemanticTypeError);
    expect(caught?.loc).toEqual(loc);
  });

  test('IfNode.validate() SemanticTypeError has no loc when node has no loc', () => {
    const nonBoolChild = new Tree(0, null, []);
    nonBoolChild.dataType = new BuiltInType('Object');

    const block = new Tree(0, null, []);
    block.dataType = new BuiltInType('Variant');

    const n = new IfNode(null, [nonBoolChild, block]);

    let caught: SemanticTypeError | undefined;
    try { n.validate(); } catch (e) { caught = e as SemanticTypeError; }
    expect(caught?.loc).toBeUndefined();
  });
});
