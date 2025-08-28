import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class AddNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Add, data, children);
  }
}

export default AddNode;
