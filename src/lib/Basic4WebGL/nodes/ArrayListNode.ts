import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ArrayListNode extends Tree {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.ArrayList, data, children);
    this.loc = loc;
  }
}

export default ArrayListNode;
