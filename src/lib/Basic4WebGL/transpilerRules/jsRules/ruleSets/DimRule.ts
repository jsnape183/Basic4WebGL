import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Dim)
class DimRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const sizes = doChild(node, 0, table);
    const rhs = `_createArray([${sizes}])`;

    // Class array fields are initialised per-instance, in the constructor —
    // RootRule injects this `this.x = ...` line after any super() call
    // (roadmap #35: a prototype initializer meant two instances shared one
    // array). Scalar fields keep their prototype default (VariableDimRule).
    if (node.data.scope.type === scopeTypes.Class) {
      return `this.${node.data.name} = ${rhs};`;
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

export default DimRule;
