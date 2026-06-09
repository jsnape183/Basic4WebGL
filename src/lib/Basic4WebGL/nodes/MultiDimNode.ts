import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class MultiDimNode extends Tree {
  constructor(declarators: Tree[], loc?: SourceLocation) {
    super(nodeTypes.MultiDim, null, declarators);
    this.loc = loc;
  }
}

export default MultiDimNode;
