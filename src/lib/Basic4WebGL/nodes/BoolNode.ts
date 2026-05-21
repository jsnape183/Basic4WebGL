import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class BoolNode extends Tree {
  constructor(data: any | undefined, loc?: SourceLocation) {
    super(nodeTypes.String, data, []);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
    this.loc = loc;
  }
}

export default BoolNode;
