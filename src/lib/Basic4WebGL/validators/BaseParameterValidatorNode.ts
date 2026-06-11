import { SemanticError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import { FunctionSymbol } from '../symbolTypes';
import nodeTypes from '../nodeTypes';

class BaseParameterValidatorNode extends Tree implements IValidatable {
  validate(): void {
    const symbol = this.data as FunctionSymbol;
    const argNodes = this.children[0].children;
    if (argNodes.length !== symbol.parameters.length) {
      throw new SemanticError(
        `Function ${symbol.name} expects ${symbol.parameters.length} arguments, but got ${argNodes.length}.`,
        this.loc
      );
    }

    // Type-check args against typed params
    if (symbol?.parameters) {
      symbol.parameters.forEach((param: any, i: number) => {
        const paramClass = param?.classSymbol?.name?.toLowerCase();
        if (!paramClass) return; // untyped param — skip

        const argNode = argNodes[i];
        if (!argNode) return; // missing arg — arity error is handled elsewhere

        // NewObject arg: new Enemy()
        if ((argNode as any).type === nodeTypes.NewObject) {
          const argClass = (argNode as any).data.classSymbol.name.toLowerCase();
          if (argClass !== paramClass) {
            throw new SemanticError(
              `Type mismatch at argument ${i + 1}: parameter '${param.name}' expects '${paramClass}' but got 'new ${argClass}'`,
              (argNode as any).loc
            );
          }
        }
        // Typed variable arg: e (Object symbol with classSymbol)
        else if ((argNode as any).data?.classSymbol) {
          const argClass = (argNode as any).data.classSymbol.name.toLowerCase();
          if (argClass !== paramClass) {
            throw new SemanticError(
              `Type mismatch at argument ${i + 1}: parameter '${param.name}' expects '${paramClass}' but got '${argClass}'`,
              (argNode as any).loc
            );
          }
        }
      });
    }
  }
}

export default BaseParameterValidatorNode;
