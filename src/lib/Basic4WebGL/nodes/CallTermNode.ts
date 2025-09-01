import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class CallTermNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.CallTerm, data, children);
    this.dataType = getBuiltInType(builtInTypes.Variant);
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

export default CallTermNode;
