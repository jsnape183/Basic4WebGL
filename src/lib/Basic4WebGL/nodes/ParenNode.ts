import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class ParenNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Paren, data, children);
    this.dataType = children.dataType;
  }
}

export default ParenNode;
