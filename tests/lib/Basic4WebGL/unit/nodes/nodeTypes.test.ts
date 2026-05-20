import { describe, test, expect } from 'vitest';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import VariableNode from '@Basic4WebGL/nodes/VariableNode';
import '@Basic4WebGL/builtInTypes';

describe('VariableNode', () => {
  test('has type nodeTypes.Variable (not nodeTypes.String)', () => {
    const n = new VariableNode('x');
    expect(n.type).toBe(nodeTypes.Variable);
    expect(n.type).not.toBe(nodeTypes.String);
  });
});
