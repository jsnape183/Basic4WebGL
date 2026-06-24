import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';
import { doChild, prefixClass } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.VariableDimAssign)
class VariableDimAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const rhs = doChild(node, 0, table);

    if (node.data.scope.type === scopeTypes.Class) {
      return `${prefixClass(node.data.scope.name)}.prototype.${node.data.name} = ${rhs};`;
    }

    if (
      node.data.scope.type === scopeTypes.Function ||
      node.data.scope.type === scopeTypes.Constructor
    ) {
      return `${node.data.scope.name}_${node.data.name} = ${rhs};`;
    }

    return `${node.data.scope.name}.${node.data.name} = ${rhs};`;
  }
}

export default VariableDimAssignRule;
