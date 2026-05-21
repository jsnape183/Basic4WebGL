import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseBooleanArthrmaticValidatorNode from '../validators/BaseBooleanArithmaticValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class OrNode extends BaseBooleanArthrmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.Or, data, children);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
    this.loc = loc;
  }
}

export default OrNode;
