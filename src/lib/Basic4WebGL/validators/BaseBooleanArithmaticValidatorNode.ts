import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';

class BaseBooleanArthrmaticValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (
      !this.children[0].dataType?.canAccept(
        getBuiltInType(builtInTypes.Boolean)
      )
    ) {
      throw new SemanticTypeError(
        [builtInTypes.Boolean],
        this.children[0].dataType
      );
    }

    if (
      !this.children[1].dataType?.canAccept(
        getBuiltInType(builtInTypes.Boolean)
      )
    ) {
      throw new SemanticTypeError(
        [builtInTypes.Boolean],
        this.children[1].dataType
      );
    }
  }
}

export default BaseBooleanArthrmaticValidatorNode;
