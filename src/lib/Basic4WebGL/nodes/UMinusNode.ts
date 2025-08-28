import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class UMinusNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.UMinus, data, children);
  }
}

export default UMinusNode;
