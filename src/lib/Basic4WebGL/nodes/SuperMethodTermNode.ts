import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents super.method(args) in expression context.
 * data.parentName  — the parent class name (lowercase)
 * data.methodName  — the method name (lowercase)
 * children[0]      — ExpressionList of arguments
 */
class SuperMethodTermNode extends Tree {
  constructor(data: { parentName: string; methodName: string }, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.SuperMethodTerm, data, [args]);
    this.loc = loc;
  }
}

export default SuperMethodTermNode;
