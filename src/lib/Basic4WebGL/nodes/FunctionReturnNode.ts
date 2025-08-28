import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class FunctionReturnNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionReturn, data, children);
  }
}

export default FunctionReturnNode;
