import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Clone)
class CloneRule implements IGeneratable {
  generate(node: Tree): string {
    return `${formatSymbol(node.data.object)} = new ${
      node.data.module.name
    }();`;
  }
}

export default CloneRule;
