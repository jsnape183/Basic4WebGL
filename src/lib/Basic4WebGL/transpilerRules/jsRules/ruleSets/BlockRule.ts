import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { getTranspilerRule } from '@CompilerLib/transpiler/transpilerRuleFactory';
import { Tree } from '@CompilerLib/tree';
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
