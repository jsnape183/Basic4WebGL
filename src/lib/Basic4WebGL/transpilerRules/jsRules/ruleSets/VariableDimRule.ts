import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
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
