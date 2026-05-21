import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';
import { Symbol } from '@CompilerLib/symbols';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class FunctionCallNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.FunctionCall, data, children);
    this.dataType = (data as Symbol).dataType;
    this.loc = loc;
  }
}

export default FunctionCallNode;
