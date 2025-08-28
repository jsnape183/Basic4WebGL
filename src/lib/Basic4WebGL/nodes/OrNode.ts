import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class OrNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Or, data, children);
  }
}

export default OrNode;
