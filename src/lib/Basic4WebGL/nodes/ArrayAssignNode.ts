import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ArrayAssignNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.ArrayAssign, data, children);
  }
}

export default ArrayAssignNode;
