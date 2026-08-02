import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryLookup)
class DictionaryLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const key = doChild(node, 0, table);
    if (node.data.type === symbolTypes.Variable) {
      return `_sbCheckedDictGet(${formatSymbol(node.data)},${key},"${node.data.name}")`;
    }
    return `_sbDictGet(${formatSymbol(node.data)},${key})`;
  }
}

export default DictionaryLookupRule;
