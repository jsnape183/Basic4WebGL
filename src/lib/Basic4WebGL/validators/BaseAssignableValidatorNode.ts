import { SemanticTypeError } from '../../compiler/errors';
import { Tree } from '../../tree';
import IValidatable from '../../tree/IValidatable';

class BaseAssignableValidatorNode extends Tree implements IValidatable {
  validate(): void {
    if (!this.children[0].dataType?.canAccept(this.children[1].dataType)) {
      throw new SemanticTypeError(
        this.children[0].dataType.acceptsTypes,
        this.children[1].dataType
      );
    }
  }
}
export default BaseAssignableValidatorNode;
