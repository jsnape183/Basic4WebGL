import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class InNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.In, data, children);
  }
}

export default InNode;
