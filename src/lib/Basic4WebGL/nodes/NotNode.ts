import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class NotNode extends Tree {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Not, data, children);
    this.dataType = builtInTypes.Boolean;
  }
}

export default NotNode;
