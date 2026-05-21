import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DimNode extends Tree {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Dim, data, children);
    this.loc = loc;
  }
}

export default DimNode;
