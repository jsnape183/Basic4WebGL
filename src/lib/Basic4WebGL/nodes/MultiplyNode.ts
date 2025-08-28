import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class MultiplyNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Multiply, data, children);
  }
}

export default MultiplyNode;
