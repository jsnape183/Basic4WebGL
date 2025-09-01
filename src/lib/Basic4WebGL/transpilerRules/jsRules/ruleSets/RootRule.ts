import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
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
