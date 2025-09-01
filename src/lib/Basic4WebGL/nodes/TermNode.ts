import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class TermNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Term, data, children);
    this.dataType = children.dataType;
  }
}

export default TermNode;
