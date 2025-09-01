import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class ArrayLookupNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.ArrayLookup, data, children);
    this.dataType = (data as Symbol).dataType;
  }
}

export default ArrayLookupNode;
