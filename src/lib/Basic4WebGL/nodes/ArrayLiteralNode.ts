import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class ArrayLiteralNode extends Tree {
  constructor(data: any | undefined, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.ArrayLiteral, data, children);
    this.dataType = getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
  }
}

export default ArrayLiteralNode;
