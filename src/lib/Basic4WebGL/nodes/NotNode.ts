import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class NotNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Not, data, children);
  }
}

export default NotNode;
