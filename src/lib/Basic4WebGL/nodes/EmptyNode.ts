import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class EmptyNode extends Tree {
  constructor(loc?: SourceLocation) {
    super(nodeTypes.Empty, undefined);
    this.loc = loc;
  }
}

export default EmptyNode;
