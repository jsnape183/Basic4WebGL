import { getBuiltInType } from '../../builtInTypes/builtInTypeFactory';
import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';
import { Symbol } from '../../symbols';

class FunctionTermNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionTerm, data, children);
    this.dataType =
      (data as Symbol).dataType || getBuiltInType(builtInTypes.Variant);
  }
}

export default FunctionTermNode;
