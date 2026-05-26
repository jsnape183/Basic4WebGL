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
    const { arraySymbol, classSymbol } = node.data;
    const sizes = doChild(node, 0, table);

    const factory =
      node.children.length > 1
        ? `() => new ${classSymbol.name}(${doChild(node, 1, table)})`
        : `() => new ${classSymbol.name}()`;

    const rhs = `_createTypedArray([${sizes}], ${factory})`;

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
