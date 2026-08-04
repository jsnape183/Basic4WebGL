import Symbols from '@CompilerLib/symbols';
import {
  IGeneratable,
  RegisterTranspilerRule,
} from '@CompilerLib/transpiler/IGeneratable';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../../../nodeTypes';
import { concatChildren } from '../helpers/transpilerHelpers';

@RegisterTranspilerRule(nodeTypes.SelfArrayLookup)
class SelfArrayLookupRule implements IGeneratable {
  generate(node: Tree, table: Symbols): string {
    // Multi-dimensional fields chain separate subscripts — `this.grid[1][2]`,
    // matching how SelfArrayAssignRule emits the write side.
    const dimStr = concatChildren(node.children[0], '][', table);
    return `${node.data.chain}[${dimStr}]`;
  }
}

export default SelfArrayLookupRule;
