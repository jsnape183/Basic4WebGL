import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class AndNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.And, data, children);
  }
}

export default AndNode;
