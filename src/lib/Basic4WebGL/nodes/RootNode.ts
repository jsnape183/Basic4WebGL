import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class RootNode extends Tree {
  constructor(data: any | undefined, children: Tree | Array<Tree>) {
    super(nodeTypes.Root, data, children);
  }
}

export default RootNode;
