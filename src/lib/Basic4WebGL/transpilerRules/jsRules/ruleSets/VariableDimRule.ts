import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { formatSymbol, prefixClass } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.VariableDim)
class VariableDimRule implements IGeneratable {
  generate(node: Tree): string {
    if (node.data.scope.type === scopeTypes.Class) {
      return `${prefixClass(node.data.scope.name)}.prototype.${node.data.name} = undefined;`;
    }

    if (
      node.data.scope.type === scopeTypes.Function ||
      node.data.scope.type === scopeTypes.Constructor
    ) {
      return `let ${formatSymbol(node.data)} = undefined;`;
    }

    return `${formatSymbol(node.data)} = undefined;`;
  }
}

export default VariableDimRule;
