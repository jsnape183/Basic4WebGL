import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class UMinusNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.UMinus, data, children);
    this.dataType = getBuiltInType(builtInTypes.Number);
  }
}

export default UMinusNode;
