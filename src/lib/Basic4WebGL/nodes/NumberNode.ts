import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

export class NumberNode extends Tree {
  constructor(data: any | undefined, loc?: SourceLocation) {
    super(nodeTypes.Number, data, []);
    this.dataType = getBuiltInType(builtInTypes.Number);
    this.loc = loc;
  }
}
