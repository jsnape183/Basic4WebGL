import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';
import { Symbol } from '@CompilerLib/symbols';

class FunctionTermNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionTerm, data, children);
    this.dataType =
      (data as Symbol).dataType || getBuiltInType(builtInTypes.Variant);
  }
}

export default FunctionTermNode;
