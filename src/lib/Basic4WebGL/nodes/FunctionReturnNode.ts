import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class FunctionReturnNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionReturn, data, children);
    this.dataType = children.dataType;
  }
}

export default FunctionReturnNode;
