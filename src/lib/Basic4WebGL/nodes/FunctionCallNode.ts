import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class FunctionCallNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionCall, data, children);
  }
}

export default FunctionCallNode;
