import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class TypedElementAccessNode extends Tree {
  constructor(data: any, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.TypedElementAccess, data, children);
    this.loc = loc;
  }
}

export default TypedElementAccessNode;
