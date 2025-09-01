import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';

class BaseConditionalValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (
      !getBuiltInType(builtInTypes.Boolean).canAccept(this.children[0].dataType)
    ) {
      throw new SemanticTypeError(
        getBuiltInType(builtInTypes.Boolean).acceptsTypes,
        this.children[0].dataType
      );
    }
  }
}

export default BaseConditionalValidatorNode;
