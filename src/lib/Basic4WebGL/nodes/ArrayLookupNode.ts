import { Symbol } from '../../symbols';
import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ArrayLookupNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.ArrayLookup, data, children);
    this.dataType = (data as Symbol).dataType;
  }
}

export default ArrayLookupNode;
