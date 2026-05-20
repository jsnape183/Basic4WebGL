import builtInTypes from '@Basic4WebGL/builtInTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';

class BaseNumericEqualityValidatorNode extends Tree implements IValidatable {
  validate(): void {
    const numeric = getBuiltInType(builtInTypes.Number);
    if (this.children[0].dataType.name !== builtInTypes.Number) {
      throw new SemanticTypeError(
        [builtInTypes.Number],
        this.children[0].dataType
      );
    }

    if (this.children[1].dataType.name !== builtInTypes.Number) {
      throw new SemanticTypeError(
        [builtInTypes.Number],
        this.children[1].dataType
      );
    }
  }
}

export default BaseNumericEqualityValidatorNode;
