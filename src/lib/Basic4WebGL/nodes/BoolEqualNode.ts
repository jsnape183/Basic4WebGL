import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from '@Basic4WebGL/builtInTypes';
import BaseEqualityValidatorNode from '@Basic4WebGL/validators/BaseEqualityValidatorNode';

class BoolEqualNode extends BaseEqualityValidatorNode {
  constructor(left: Tree, right: Tree) {
    super(nodeTypes.Equals, undefined, [left, right]);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
  }
}

export default BoolEqualNode;
