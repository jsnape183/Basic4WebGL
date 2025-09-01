import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';
import { Symbol } from '../../symbols';

class CloneNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.Clone, data, new Array<Tree>());
    this.dataType = (data.object as Symbol).dataType;
  }
}

export default CloneNode;
