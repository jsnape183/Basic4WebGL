import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ExpressionListNode extends Tree {
  constructor(data: any | undefined, children: Tree | Tree[] | undefined, loc?: SourceLocation) {
    super(nodeTypes.ExpressionList, data, children);
    this.loc = loc;
  }
}

export default ExpressionListNode;
