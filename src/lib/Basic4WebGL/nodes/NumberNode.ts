import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

export class NumberNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.Number, data, []);
    this.dataType = getBuiltInType(builtInTypes.Number);
  }
}
