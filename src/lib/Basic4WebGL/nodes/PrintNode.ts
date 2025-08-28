import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class PrintNode extends Tree {
  constructor(data: any | undefined, children: Tree | Array<Tree>) {
    super(nodeTypes.Print, data, children);
  }
}

export default PrintNode;
