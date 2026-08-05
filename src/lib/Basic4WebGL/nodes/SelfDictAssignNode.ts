import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Indexed WRITE of a dictionary field through a `this.<chain>` receiver, in
 * statement context: `self.scores["a"] = v` -> `this.scores.set("a",v);`.
 *
 * Despite the `Self` name (kept for symmetry with SelfArrayAssignNode, its
 * array counterpart), `chain` is just a JS receiver expression string, so
 * this node is also reused for external-instance dictionary field writes
 * (`someInstance.scores["a"] = v`) — see ObjectPropertyRule.
 */
class SelfDictAssignNode extends Tree {
  constructor(data: { chain: string }, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.SelfDictAssign, data, children);
    this.loc = loc;
  }
}

export default SelfDictAssignNode;
