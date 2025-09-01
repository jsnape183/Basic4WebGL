import { Tree } from '../../CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import { Symbol } from '@CompilerLib/symbols';

class CloneNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.Clone, data, new Array<Tree>());
    this.dataType = (data.object as Symbol).dataType;
  }
}

export default CloneNode;
