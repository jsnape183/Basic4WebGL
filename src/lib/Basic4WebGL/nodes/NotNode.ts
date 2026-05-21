import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class NotNode extends Tree {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Not, data, children);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
    this.loc = loc;
  }
}

export default NotNode;
