import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import { Symbol } from '@CompilerLib/symbols';

class NewObjectNode extends Tree {
  constructor(data: any, children: Tree[], loc?: SourceLocation) {
    super(nodeTypes.NewObject, data, children);
    this.loc = loc;
    // Propagate the class symbol's dataType so assignment validators can
    // check type compatibility (e.g. e = new Enemy() for a typed variable).
    if (data?.classSymbol) {
      this.dataType = (data.classSymbol as Symbol).dataType;
    }
  }
}

export default NewObjectNode;
