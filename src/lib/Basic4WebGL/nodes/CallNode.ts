import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class CallNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Call, data, children);
  }
}

export default CallNode;
