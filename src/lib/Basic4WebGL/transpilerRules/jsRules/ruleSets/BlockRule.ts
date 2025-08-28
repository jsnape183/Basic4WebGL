import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { getTranspilerRule } from '../../../../transpiler/transpilerRuleFactory';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';

@RegisterTranspilerRule(nodeTypes.Block)
class BlockRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    let output = '';
    node.children.forEach((n) => {
      output = `${output}${getTranspilerRule(n.type).generate(n, table)}
      `;
    });
    return output;
  }
}

export default BlockRule;
