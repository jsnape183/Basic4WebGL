import { SemanticError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import { FunctionSymbol } from '../symbolTypes';

class BaseParameterValidatorNode extends Tree implements IValidatable {
  validate(): void {
    const symbol = this.data as FunctionSymbol;
    if (this.children[0].children.length !== symbol.parameters.length) {
      throw new SemanticError(
        `Function ${symbol.name} expects ${symbol.parameters.length} arguments, but got ${this.children[0].children.length}.`,
        this.loc
      );
    }
  }
}

export default BaseParameterValidatorNode;
