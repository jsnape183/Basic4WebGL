import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class UMinusNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.UMinus, data, children);
    this.dataType = builtInTypes.Number;
  }
}

export default UMinusNode;
