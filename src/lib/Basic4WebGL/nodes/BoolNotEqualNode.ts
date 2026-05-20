import { Tree } from '@CompilerLib/tree';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';
import nodeTypes from '../nodeTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from '@Basic4WebGL/builtInTypes';
import BaseEqualityValidatorNode from '@Basic4WebGL/validators/BaseEqualityValidatorNode';

class BoolNotEqualNode extends BaseEqualityValidatorNode {
  constructor(left: Tree, right: Tree) {
    super(nodeTypes.NotEquals, undefined, [left, right]);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
  }
}

export default BoolNotEqualNode;
