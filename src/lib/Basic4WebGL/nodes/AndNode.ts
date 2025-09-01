import { getBuiltInType } from '../../builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '../../compiler/errors';
import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseBooleanArthrmaticValidatorNode from '../validators/BaseBooleanArithmaticValidatorNode';

class AndNode extends BaseBooleanArthrmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.And, data, children);
    this.dataType = getBuiltInType(builtInTypes.Boolean);
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
