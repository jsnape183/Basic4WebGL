import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class CloneNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.Clone, data, new Array<Tree>());
  }
}

export default CloneNode;
