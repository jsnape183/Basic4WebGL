import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents super(args) in a child class constructor.
 * data.parentName — the parent class name (lowercase, as in the symbol table)
 * children[0]     — ExpressionList of arguments
 */
class SuperConstructorCallNode extends Tree {
  constructor(data: { parentName: string }, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.SuperConstructorCall, data, [args]);
    this.loc = loc;
  }
}

export default SuperConstructorCallNode;
