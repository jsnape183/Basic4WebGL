import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { Tree } from '@CompilerLib/tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const KIND_TO_BUILTIN: Record<string, string> = {
  number: builtInTypes.Number,
  string: builtInTypes.String,
  boolean: builtInTypes.Boolean,
};

class ConstantRefNode extends Tree {
  constructor(
    data: { module: string; name: string },
    valueKind?: 'number' | 'string' | 'boolean',
    loc?: SourceLocation
  ) {
    super(nodeTypes.ConstantRef, data, []);
    this.dataType = getBuiltInType(
      valueKind ? KIND_TO_BUILTIN[valueKind] : builtInTypes.Variant
    );
    this.loc = loc;
  }
}

export default ConstantRefNode;
