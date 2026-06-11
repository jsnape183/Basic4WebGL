import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryDim)
class DictionaryDimRule implements IGeneratable {
  generate(node: Tree, _table: Symbols | undefined): string {
    const rhs = '_createDict()';

    if (node.data.scope.type === scopeTypes.Class) {
      return `${node.data.scope.name}.prototype.${node.data.name} = ${rhs};`;
    }

    if (
      node.data.scope.type === scopeTypes.Function ||
      node.data.scope.type === scopeTypes.Constructor
    ) {
      return `let ${formatSymbol(node.data)} = ${rhs};`;
    }

    return `${formatSymbol(node.data)} = ${rhs};`;
  }
}

export default DictionaryDimRule;
