import { Tree } from '@CompilerLib/tree';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';
import nodeTypes from '../nodeTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from '@Basic4WebGL/builtInTypes';
import BaseNumericEqualityValidatorNode from '@Basic4WebGL/validators/BaseNumericEqualityValidatorNode';

class BoolLessThanNode extends BaseNumericEqualityValidatorNode {
  constructor(left: Tree, right: Tree) {
    super(nodeTypes.LessThan, undefined, [left, right]);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
  }
}

export default BoolLessThanNode;
