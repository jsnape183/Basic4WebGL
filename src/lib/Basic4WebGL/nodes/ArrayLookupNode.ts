import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class ArrayLookupNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.ArrayLookup, data, children);
    this.dataType = builtInTypes.Variant;
  }
}

export default ArrayLookupNode;
