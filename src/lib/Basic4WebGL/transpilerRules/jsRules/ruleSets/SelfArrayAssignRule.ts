import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { concatChildren, doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SelfArrayAssign)
class SelfArrayAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const dimStr = concatChildren(node.children[0], '][', table);
    return `${node.data.chain}[${dimStr}]=${doChild(node, 1, table)};`;
  }
}

export default SelfArrayAssignRule;
