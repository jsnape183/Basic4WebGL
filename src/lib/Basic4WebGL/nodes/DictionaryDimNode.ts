import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DictionaryDimNode extends Tree {
  constructor(data: any, loc?: SourceLocation) {
    super(nodeTypes.DictionaryDim, data, []);
    this.loc = loc;
  }
}

export default DictionaryDimNode;
