import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class DivideNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.Divide, data, children);
    this.dataType = getBuiltInType(builtInTypes.Number);
    this.loc = loc;
  }
}

export default DivideNode;
