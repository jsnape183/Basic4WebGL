import { CompilationError, SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import { Symbol } from '@CompilerLib/symbols';

class BaseAssignableValidatorNode extends Tree implements IValidatable {
  validate(): void {
    const symbol = this.data as Symbol;
    if (!symbol) {
      throw new CompilationError('Expected Variable for assignment operator');
    }
    if (!symbol.dataType?.canAccept(this.children[0].dataType)) {
      const valueNode = this.children.length > 1 ? this.children[1] : this.children[0];
      throw new SemanticTypeError(this.children[0].dataType.acceptsTypes, valueNode.dataType);
    }
  }
}
export default BaseAssignableValidatorNode;
