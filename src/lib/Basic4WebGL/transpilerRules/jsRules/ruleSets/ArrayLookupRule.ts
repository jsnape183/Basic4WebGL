import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { symbolTypes } from '../../../symbolTypes';
import { doChild, formatSymbol } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.ArrayLookup)
class ArrayLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    const index = doChild(node, 0, table);
    // node.children[0] is the ArrayList of index expressions — its own
    // .children length is the dimension count. The checked accessor only
    // makes sense for the single-dimension case: a Variable-kind symbol
    // only ever arises from `dim x; x = someFunc()`, which is always a
    // flat dict/array, never a declared multi-dim array (those are always
    // `dim x(N,M)`, which is strictly Array-kind and never reaches here).
    const isLooselyTyped = node.data.type === symbolTypes.Variable;
    const dimensionCount = node.children[0].children.length;
    if (isLooselyTyped && dimensionCount === 1) {
      return `_sbCheckedArrayGet(${formatSymbol(node.data)},${index},"${node.data.name}")`;
    }
    return `${formatSymbol(node.data)}[${index}]`;
  }
}

export default ArrayLookupRule;
