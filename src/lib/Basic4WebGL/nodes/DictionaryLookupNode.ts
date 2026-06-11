import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DictionaryLookupNode extends Tree {
  constructor(data: any, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.DictionaryLookup, data, children);
    this.loc = loc;
  }
}

export default DictionaryLookupNode;
