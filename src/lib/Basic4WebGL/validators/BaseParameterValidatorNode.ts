import { SemanticError } from '../../compiler/errors';
import { Tree } from '../../tree';
import IValidatable from '../../tree/IValidatable';
import { FunctionSymbol } from '../symbolTypes';

class BaseParameterValidatorNode extends Tree implements IValidatable {
  validate(): void {
    const symbol = this.data as FunctionSymbol;
    if (this.children[0].children.length !== symbol.parameters.length) {
      throw new SemanticError(
        `Function ${symbol.name} expects ${symbol.parameters.length} arguments, but got ${this.children[0].children.length}.`
      );
    }
  }
}

export default BaseParameterValidatorNode;
