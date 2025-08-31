import { SemanticTypeError } from '../../compiler/errors';
import { Tree } from '../../tree';
import IValidatable from '../../tree/IValidatable';
import builtInTypes from '../builtInTypes';

class BaseConditionalValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!builtInTypes.Boolean.canAccept(this.children[0].dataType)) {
      throw new SemanticTypeError(
        builtInTypes.Boolean.acceptsTypes,
        this.children[0].dataType
      );
    }
  }
}

export default BaseConditionalValidatorNode;
