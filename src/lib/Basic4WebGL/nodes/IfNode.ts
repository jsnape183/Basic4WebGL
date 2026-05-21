import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import BaseConditionalValidatorNode from '../validators/BaseConditionalValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class IfNode extends BaseConditionalValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.If, data, children);
    this.loc = loc;
  }
}

export default IfNode;
