import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class BlockNode extends Tree {
  constructor(data: any | undefined, children: Tree | Array<Tree>) {
    super(nodeTypes.Block, data, children);
  }
}

export default BlockNode;
