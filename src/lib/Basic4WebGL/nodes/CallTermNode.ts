import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class CallTermNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.CallTerm, data, children);
  }
}

export default CallTermNode;
