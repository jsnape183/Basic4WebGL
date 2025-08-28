import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class ToNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.To, data, children);
  }
}

export default ToNode;
