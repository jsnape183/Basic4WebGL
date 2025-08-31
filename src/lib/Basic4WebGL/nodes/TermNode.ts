import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';

class TermNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Term, data, children);
    this.dataType = children[0].dataType;
  }
}

export default TermNode;
