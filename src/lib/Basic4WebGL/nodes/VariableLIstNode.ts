import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class VariableListNode extends Tree {
  constructor(data: any | undefined, children: Tree | Array<Tree>, loc?: SourceLocation) {
    super(nodeTypes.VariableList, data, children);
    this.loc = loc;
  }
}

export default VariableListNode;
