import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class DimNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Dim, data, children);
  }
}

export default DimNode;
