import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';

class StringNode extends Tree {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.String, data, children);
    this.dataType = builtInTypes.String;
  }
}

export default StringNode;
