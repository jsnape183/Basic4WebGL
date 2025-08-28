import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class IfNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.If, data, children);
  }
}

export default IfNode;
