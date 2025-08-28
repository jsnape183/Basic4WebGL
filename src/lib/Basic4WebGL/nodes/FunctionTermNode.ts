import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class FunctionTermNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionTerm, data, children);
  }
}

export default FunctionTermNode;
