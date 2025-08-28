import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ForNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.For, data, children);
  }
}

export default ForNode;
