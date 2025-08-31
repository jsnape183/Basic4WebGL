import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class CallTermNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.CallTerm, data, children);
    this.dataType = builtInTypes.Variant;
  }
}

export default CallTermNode;
