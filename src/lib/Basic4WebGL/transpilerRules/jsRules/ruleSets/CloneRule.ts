import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import Symbols from '@CompilerLib/symbols';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.Clone)
class CloneRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const lhs = formatSymbol(node.data.object);
    const className = node.data.classSymbol.name;

    if (node.children.length > 0) {
      const args = doChild(node, 0, table);
      return `${lhs} = new ${className}(${args});`;
    }
    return `${lhs} = null;`;
  }
}

export default CloneRule;
