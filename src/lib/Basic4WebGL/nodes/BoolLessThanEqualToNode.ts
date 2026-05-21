import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from '@Basic4WebGL/builtInTypes';
import BaseNumericEqualityValidatorNode from '@Basic4WebGL/validators/BaseNumericEqualityValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class BoolLessThanEqualToNode extends BaseNumericEqualityValidatorNode {
  constructor(left: Tree, right: Tree, loc?: SourceLocation) {
    super(nodeTypes.LessThanEqualTo, undefined, [left, right]);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
    this.loc = loc;
  }
}

export default BoolLessThanEqualToNode;
