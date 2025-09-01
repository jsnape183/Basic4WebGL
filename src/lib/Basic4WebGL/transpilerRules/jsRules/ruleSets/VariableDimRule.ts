import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { scopeTypes } from '../../../symbolTypes';

@RegisterTranspilerRule(nodeTypes.VariableDim)
class VariableDimRule implements IGeneratable {
  generate(node: Tree): string {
    if (node.data.scopeType === scopeTypes.Class) {
      return `${`${node.data.scope.name}.prototype.${node.data.name}`} = undefined;`;
    }

    return `${`${node.data.scope.name}.${node.data.name}`} = undefined;`;
  }
}

export default VariableDimRule;
