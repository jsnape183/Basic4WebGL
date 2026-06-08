import { Tree } from '@CompilerLib/tree';
import BuiltInType from '@CompilerLib/builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class FunctionReturnNode extends Tree {
  constructor(data: any | undefined, children: Tree | null, loc?: SourceLocation) {
    super(nodeTypes.FunctionReturn, data, children ? [children] : []);
    this.dataType = children ? children.dataType : new BuiltInType('Unknown');
    this.loc = loc;
  }
}

export default FunctionReturnNode;
