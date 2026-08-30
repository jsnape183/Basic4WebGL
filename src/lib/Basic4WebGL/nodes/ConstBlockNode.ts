import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ConstBlockNode extends Tree {
  constructor(data: { module: string }, loc?: SourceLocation) {
    super(nodeTypes.ConstBlock, data, []);
    this.loc = loc;
  }
}

export default ConstBlockNode;
