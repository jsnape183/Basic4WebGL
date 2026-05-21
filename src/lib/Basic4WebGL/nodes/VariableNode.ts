import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class VariableNode extends Tree {
  constructor(data: any | undefined, loc?: SourceLocation) {
    super(nodeTypes.Variable, data, []);
    this.dataType = getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
  }
}

export default VariableNode;
