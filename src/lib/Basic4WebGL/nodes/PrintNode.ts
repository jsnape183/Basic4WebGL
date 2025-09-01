import { getBuiltInType } from '../../builtInTypes/builtInTypeFactory';
import { SemanticTypeError } from '../../compiler/errors';
import { Tree } from '../../tree';
import IValidatable from '../../tree/IValidatable';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class PrintNode extends Tree implements IValidatable {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Print, data, children);
  }
  validate(): void {
    if (
      getBuiltInType(builtInTypes.String).canAccept(
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
