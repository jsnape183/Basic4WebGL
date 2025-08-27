import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class EmptyNode extends Tree {
  constructor() {
    super(nodeTypes.Empty, undefined);
  }
}

export default EmptyNode;
