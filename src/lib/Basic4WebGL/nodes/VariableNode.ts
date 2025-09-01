import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class VariableNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.String, data, []);
    this.dataType = getBuiltInType(builtInTypes.Variant);
  }
}

export default VariableNode;
