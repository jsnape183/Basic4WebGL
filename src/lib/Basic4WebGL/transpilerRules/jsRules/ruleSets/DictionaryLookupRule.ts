import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.DictionaryLookup)
class DictionaryLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    return `_sbDictGet(${formatSymbol(node.data)},${doChild(node, 0, table)})`;
  }
}

export default DictionaryLookupRule;
