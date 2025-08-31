import { Tree } from '../../tree';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';
import nodeTypes from '../nodeTypes';

class AddNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Add, data, children);
    this.dataType = children[0].dataType;
  }
}

export default AddNode;
