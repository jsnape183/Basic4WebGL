import { SemanticTypeError } from '../../compiler/errors';
import { Tree } from '../../tree';
import IValidatable from '../../tree/IValidatable';
import builtInTypes from '../builtInTypes';

class BaseBooleanArthrmaticValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!this.children[0].dataType?.canAccept(builtInTypes.Boolean)) {
      throw new SemanticTypeError(
        [builtInTypes.Boolean],
        this.children[0].dataType
      );
    }

    if (!this.children[1].dataType?.canAccept(builtInTypes.Boolean)) {
      throw new SemanticTypeError(
        [builtInTypes.Boolean],
        this.children[1].dataType
      );
    }
  }
}

export default BaseBooleanArthrmaticValidatorNode;
