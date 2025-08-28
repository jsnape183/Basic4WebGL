import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class DivideNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Divide, data, children);
  }
}

export default DivideNode;
