import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';

class BaseArithmaticValidatorNode extends Tree implements IValidatable {
  validate(): void {
    // If the inferred type is Unknown, static type resolution wasn't possible
    // (e.g. a chained method call like obj.prop.method()). Trust the runtime.
    if (this.dataType?.name === 'Unknown') return;

    if (!this.dataType?.canAccept(this.children[0].dataType)) {
      throw new SemanticTypeError(
        this.dataType.acceptsTypes,
        this.children[0].dataType,
        this.loc
      );
    }

    if (!this.dataType?.canAccept(this.children[1].dataType)) {
      throw new SemanticTypeError(
        this.dataType.acceptsTypes,
        this.children[1].dataType,
        this.loc
      );
    }
  }
}

export default BaseArithmaticValidatorNode;
