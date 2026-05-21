import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class SubtractNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.Subtract, data, children);
    this.dataType = getBuiltInType(builtInTypes.Number);
    this.loc = loc;
  }
}

export default SubtractNode;
