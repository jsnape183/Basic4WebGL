import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from '@Basic4WebGL/builtInTypes';
import BaseEqualityValidatorNode from '@Basic4WebGL/validators/BaseEqualityValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class BoolEqualNode extends BaseEqualityValidatorNode {
  constructor(left: Tree, right: Tree, loc?: SourceLocation) {
    super(nodeTypes.Equals, undefined, [left, right]);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
    this.loc = loc;
  }
}

export default BoolEqualNode;
