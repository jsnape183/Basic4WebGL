import { SemanticTypeError } from '../../compiler/errors';
import { Tree } from '../../tree';
import IValidatable from '../../tree/IValidatable';

class BaseArithmaticValidatorNode extends Tree implements IValidatable {
  validate(): void {
    console.log(
      this.dataType,
      this.children[0].dataType,
      this.children[1].dataType
    );
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
