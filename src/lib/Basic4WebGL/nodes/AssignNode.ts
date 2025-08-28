import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class AssignNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Assign, data, children);
  }
}

export default AssignNode;
