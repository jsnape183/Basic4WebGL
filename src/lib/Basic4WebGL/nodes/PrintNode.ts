import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '@CompilerLib/errors';
import { Tree } from '@CompilerLib/tree';
import IValidatable from '@CompilerLib/tree/IValidatable';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Print, data, children);
  }
  validate(): void {
    if (
      getBuiltInType(builtInTypes.Variant).canAccept(
        this.children[0].dataType
      ) === false
    ) {
      throw new SemanticTypeError(
        [builtInTypes.String],
        this.children[0].dataType
      );
    }
  }
}

export default PrintNode;
