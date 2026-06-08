import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.If)
class IfRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const condition = doChild(node, 0, table);
    const thenBlock = doChild(node, 1, table);

    if (node.children.length === 2) {
      return `if(${condition}){${thenBlock}}`;
    }

    const elsePart = doChild(node, 2, table);

    // child[2] is a nested IfNode (from elseif) → emit "else if"
    if (node.children[2].type === nodeTypes.If) {
      return `if(${condition}){${thenBlock}}else ${elsePart}`;
    }

    return `if(${condition}){${thenBlock}}else{${elsePart}}`;
  }
}

export default IfRule;
