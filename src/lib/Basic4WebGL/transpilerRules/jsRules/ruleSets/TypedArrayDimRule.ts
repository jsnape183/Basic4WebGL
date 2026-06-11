import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.TypedArrayDim)
class TypedArrayDimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const { arraySymbol } = node.data;
    const sizes = doChild(node, 0, table);

    const rhs = `_createTypedArray([${sizes}], () => null)`;

    if (arraySymbol.scope.type === scopeTypes.Class) {
      return `${arraySymbol.scope.name}.prototype.${arraySymbol.name} = ${rhs};`;
    }

    if (
      arraySymbol.scope.type === scopeTypes.Function ||
      arraySymbol.scope.type === scopeTypes.Constructor
    ) {
      return `let ${formatSymbol(arraySymbol)} = ${rhs};`;
    }

    return `${formatSymbol(arraySymbol)} = ${rhs};`;
  }
}

export default TypedArrayDimRule;
