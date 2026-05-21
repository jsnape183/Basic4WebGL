import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseAssignableValidatorNode from '../validators/BaseAssignableValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ArrayAssignNode extends BaseAssignableValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.ArrayAssign, data, children);
    this.dataType = getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
  }
}

export default ArrayAssignNode;
