import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';

class VariableListNode extends Tree {
  constructor(data: any | undefined, children: Tree | Array<Tree>) {
    super(nodeTypes.VariableList, data, children);
  }
}

export default VariableListNode;
