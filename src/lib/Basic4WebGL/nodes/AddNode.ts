import { Tree } from '@CompilerLib/tree';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class AddNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.Add, data, children);
    this.dataType = children[0].dataType;
    this.loc = loc;
  }
}

export default AddNode;
