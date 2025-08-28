import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class StringNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.String, data, children);
  }
}

export default StringNode;
