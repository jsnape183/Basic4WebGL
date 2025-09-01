import { getBuiltInType } from '../../builtInTypes/builtInTypeFactory';
import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';

class FunctionTermNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionTerm, data, children);
    this.dataType = getBuiltInType(builtInTypes.Variant);
  }
}

export default FunctionTermNode;
