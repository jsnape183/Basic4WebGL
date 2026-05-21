import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseBooleanArthrmaticValidatorNode from '../validators/BaseBooleanArithmaticValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class AndNode extends BaseBooleanArthrmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.And, data, children);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
    this.loc = loc;
  }

  validate(): void {
    if (!this.children[0].dataType?.canAccept(this.dataType)) {
      throw new SemanticTypeError(
        [builtInTypes.Boolean],
        this.children[0].dataType
      );
    }

    if (!this.children[1].dataType?.canAccept(this.dataType)) {
      throw new SemanticTypeError(
        [builtInTypes.Boolean],
        this.children[1].dataType
      );
    }
  }
}

export default AndNode;
