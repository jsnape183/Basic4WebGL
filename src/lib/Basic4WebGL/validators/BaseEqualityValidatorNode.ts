import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';

class BaseEqualityValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!this.children[0].dataType.canAccept(this.children[1].dataType)) {
      throw new SemanticTypeError(
        this.children[0].dataType.acceptsTypes,
        this.children[1].dataType
      );
    }
  }
}

export default BaseEqualityValidatorNode;
