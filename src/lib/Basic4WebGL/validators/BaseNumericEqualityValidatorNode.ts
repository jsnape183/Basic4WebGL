import builtInTypes from '@Basic4WebGL/builtInTypes';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';

const numericTypes = [builtInTypes.Number, builtInTypes.Variant];

class BaseNumericEqualityValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!numericTypes.includes(this.children[0].dataType.name)) {
      throw new SemanticTypeError(
        [builtInTypes.Number],
        this.children[0].dataType
      );
    }

    if (!numericTypes.includes(this.children[1].dataType.name)) {
      throw new SemanticTypeError(
        [builtInTypes.Number],
        this.children[1].dataType
      );
    }
  }
}

export default BaseNumericEqualityValidatorNode;
