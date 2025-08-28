import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ParenNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Paren, data, children);
  }
}

export default ParenNode;
