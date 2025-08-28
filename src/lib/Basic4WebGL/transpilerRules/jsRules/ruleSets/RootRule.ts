import Symbols from '../../../../symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '../../../../transpiler/IGeneratable';
import { getTranspilerRule } from '../../../../transpiler/transpilerRuleFactory';
import { Tree } from '../../../../tree';
import nodeTypes from '../../../nodeTypes';
import { formatRoot } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Root)
class RootRule implements IGeneratable {
  generate(node: Tree, table: Symbols | undefined): string {
    const children = node.children.map(
      (n) => `${getTranspilerRule(n.type).generate(n, table)}`
    );
    return formatRoot(node, children);
  }
}

export default RootRule;
