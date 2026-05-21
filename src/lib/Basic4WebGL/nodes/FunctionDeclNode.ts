import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class FunctionDeclNode extends Tree {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.FunctionDecl, data, children);
    this.loc = loc;
  }
}

export default FunctionDeclNode;
