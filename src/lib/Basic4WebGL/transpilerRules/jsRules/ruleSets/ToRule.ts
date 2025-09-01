import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.To)
class ToRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `${formatSymbol(node.data)} = ${doChild(node, 0, table)}; ${
      node.data
    } <= ${doChild(node, 1, table)}; ${node.data}++`;
  }
}

export default ToRule;
