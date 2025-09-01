import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';

class VariableDimNode extends Tree {
  constructor(data: any | undefined) {
    super(nodeTypes.VariableDim, data, new Array<Tree>());
  }
}

export default VariableDimNode;
