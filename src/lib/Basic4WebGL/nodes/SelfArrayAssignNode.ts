import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class SelfArrayAssignNode extends Tree {
  constructor(data: { chain: string }, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.SelfArrayAssign, data, children);
    this.loc = loc;
  }
}

export default SelfArrayAssignNode;
