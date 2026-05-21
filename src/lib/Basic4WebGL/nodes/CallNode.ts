import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class CallNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Call, data, children);
    this.loc = loc;
  }

  validate(): void {
    if (this.children[0].dataType != getBuiltInType(builtInTypes.String)) {
      throw new SemanticTypeError(
        getBuiltInType(builtInTypes.String).acceptsTypes,
        this.children[0].dataType
      );
    }
  }
}

export default CallNode;
