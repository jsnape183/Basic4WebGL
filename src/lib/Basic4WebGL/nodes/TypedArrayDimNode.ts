import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a typed array declaration: dim arr(n) as Type(args)
 * data: { arraySymbol: ArraySymbol, classSymbol: Symbol }
 * children[0]: ExpressionList of dimension sizes
 * children[1]: ExpressionList of constructor args (may be absent)
 */
class TypedArrayDimNode extends Tree {
  constructor(data: any, children: Tree[] = [], loc?: SourceLocation) {
    super(nodeTypes.TypedArrayDim, data, children);
    this.loc = loc;
  }
}

export default TypedArrayDimNode;
