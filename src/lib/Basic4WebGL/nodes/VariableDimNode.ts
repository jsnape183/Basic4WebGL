import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class VariableDimNode extends Tree {
  constructor(data: any | undefined, loc?: SourceLocation) {
    super(nodeTypes.VariableDim, data, new Array<Tree>());
    this.loc = loc;
  }
}

export default VariableDimNode;
