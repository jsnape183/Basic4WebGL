import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ParenNode extends Tree {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Paren, data, children);
    this.dataType = children.dataType;
    this.loc = loc;
  }
}

export default ParenNode;
