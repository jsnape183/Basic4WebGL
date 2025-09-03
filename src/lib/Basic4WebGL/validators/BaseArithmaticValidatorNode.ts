import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';

class BaseArithmaticValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!this.dataType?.canAccept(this.children[0].dataType)) {
      throw new SemanticTypeError(
        this.dataType.acceptsTypes,
        this.children[0].dataType
      );
    }

    if (!this.dataType?.canAccept(this.children[1].dataType)) {
      throw new SemanticTypeError(
        this.dataType.acceptsTypes,
        this.children[1].dataType
      );
    }
  }
}

export default BaseArithmaticValidatorNode;
