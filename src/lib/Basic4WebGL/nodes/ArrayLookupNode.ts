import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ArrayLookupNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.ArrayLookup, data, children);
  }
}

export default ArrayLookupNode;
