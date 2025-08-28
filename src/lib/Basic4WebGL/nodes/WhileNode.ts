import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class WhileNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.While, data, children);
  }
}

export default WhileNode;
