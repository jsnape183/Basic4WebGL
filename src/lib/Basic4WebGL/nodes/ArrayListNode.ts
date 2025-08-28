import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ArrayListNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.ArrayList, data, children);
  }
}

export default ArrayListNode;
