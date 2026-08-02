import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryAssign)
class DictionaryAssignRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const key = doChild(node, 0, table);
    const value = doChild(node, 1, table);
    if (node.data.type === symbolTypes.Variable) {
      return `_sbCheckedDictSet(${formatSymbol(node.data)},${key},${value},"${node.data.name}");`;
    }
    return `${formatSymbol(node.data)}.set(${key},${value});`;
  }
}

export default DictionaryAssignRule;
