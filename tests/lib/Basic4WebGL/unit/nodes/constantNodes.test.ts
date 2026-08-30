import { describe, test, expect } from 'vitest';
import nodeTypes from '@Basic4WebGL/nodeTypes';
import ConstBlockNode from '@Basic4WebGL/nodes/ConstBlockNode';
import ConstantRefNode from '@Basic4WebGL/nodes/ConstantRefNode';

describe('constant AST nodes', () => {
  test('nodeTypes has ConstBlock and ConstantRef', () => {
    expect(nodeTypes.ConstBlock).toBeTypeOf('number');
    expect(nodeTypes.ConstantRef).toBeTypeOf('number');
  });

  test('ConstBlockNode carries the module name', () => {
    const n = new ConstBlockNode({ module: 'keyboard' });
    expect(n.type).toBe(nodeTypes.ConstBlock);
    expect(n.data.module).toBe('keyboard');
    expect(n.children).toEqual([]);
  });

  test('ConstantRefNode carries module + name', () => {
    const n = new ConstantRefNode({ module: 'keyboard', name: 'space' });
    expect(n.type).toBe(nodeTypes.ConstantRef);
    expect(n.data).toEqual({ module: 'keyboard', name: 'space' });
  });
});
