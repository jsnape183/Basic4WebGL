import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class TypedElementAccessNode extends Tree {
  constructor(data: any, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.TypedElementAccess, data, children);
    // A field read off a typed collection element (e.g.
    // `self.enemies(i).transformY`) knows the field's real dataType up
    // front — callers pass it via `data.dataType` so strict type checks
    // (bare `if`, comparisons, `and`/`or`) see the field's actual type
    // instead of falling back to the Tree base class's default Unknown.
    // Method-call uses of this node (`self.enemies(i).hit()`) don't set it —
    // their return type isn't tracked here, same as PropertyMethodTermNode.
    if (data?.dataType !== undefined) {
      this.dataType = data.dataType;
    }
    this.loc = loc;
  }
}

export default TypedElementAccessNode;
