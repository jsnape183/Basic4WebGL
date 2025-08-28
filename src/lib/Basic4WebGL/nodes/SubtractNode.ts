import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class SubtractNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Subtract, data, children);
  }
}

export default SubtractNode;
