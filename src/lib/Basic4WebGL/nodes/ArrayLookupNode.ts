import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ArrayLookupNode extends Tree {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.ArrayLookup, data, children);
    this.dataType = (data as Symbol).dataType;
    this.loc = loc;
  }
}

export default ArrayLookupNode;
