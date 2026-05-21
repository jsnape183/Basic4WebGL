import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import { Symbol } from '@CompilerLib/symbols';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class CloneNode extends Tree {
  constructor(data: any | undefined, loc?: SourceLocation) {
    super(nodeTypes.Clone, data, new Array<Tree>());
    this.dataType = (data.object as Symbol).dataType;
    this.loc = loc;
  }
}

export default CloneNode;
