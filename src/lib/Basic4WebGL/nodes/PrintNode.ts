import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Print, data, children);
    this.loc = loc;
  }
  validate(): void {
    if (
      getBuiltInType(builtInTypes.Variant).canAccept(
        this.children[0].dataType
      ) === false
    ) {
      throw new SemanticTypeError(
        [builtInTypes.String],
        this.children[0].dataType,
        this.loc
      );
    }
  }
}

export default PrintNode;
