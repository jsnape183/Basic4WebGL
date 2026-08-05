import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Indexed READ of a dictionary field through a `this.<chain>` receiver, in
 * expression context: `self.scores["a"]` -> `_sbDictGet(this.scores,"a")`.
 *
 * Despite the `Self` name (kept for symmetry with SelfArrayLookupNode, its
 * array counterpart), `chain` is just a JS receiver expression string, so
 * this node is also reused for external-instance dictionary field reads
 * (`someInstance.scores["a"]`) — see VariableFactorRule.
 *
 * `data.symbol` is the resolved class-scope DictionarySymbol, carried so the
 * node can report the field's declared dataType to the type checker.
 */
class SelfDictLookupNode extends Tree {
  constructor(
    data: { chain: string; symbol: Symbol },
    children: Tree[],
    loc?: SourceLocation
  ) {
    super(nodeTypes.SelfDictLookup, data, children);
    this.dataType = data.symbol.dataType;
    this.loc = loc;
  }
}

export default SelfDictLookupNode;
