import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class FunctionReturnNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionReturn, data, children);
    this.dataType = builtInTypes.Variant;
  }
}

export default FunctionReturnNode;
